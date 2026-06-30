const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const MedicationReminder = require('../models/MedicationReminder');
const geminiService = require('../services/geminiService');

/**
 * Helper to fetch Doctor Profile from authenticated User
 */
const getDoctorProfile = async (userId) => {
  const doctor = await Doctor.findOne({ userId });
  if (!doctor) {
    throw new Error('Doctor profile not found.');
  }
  return doctor;
};

/**
 * @desc    Get Doctor Dashboard widgets
 * @route   GET /api/doctors/dashboard
 * @access  Private/Doctor
 */
const getDashboardData = async (req, res) => {
  try {
    const doctor = await getDoctorProfile(req.user._id);
    const todayStr = new Date().toISOString().split('T')[0];

    // Today's appointments
    const todayAppointments = await Appointment.find({
      doctorId: doctor._id,
      date: todayStr,
      status: { $in: ['booked', 'rescheduled'] }
    }).populate('patientId');

    // Upcoming appointments
    const upcomingAppointments = await Appointment.find({
      doctorId: doctor._id,
      date: { $gt: todayStr },
      status: { $in: ['booked', 'rescheduled'] }
    })
      .sort({ date: 1, time: 1 })
      .limit(10)
      .populate('patientId');

    // Recent Patients (unique patient IDs from appointments)
    const recentPatientIds = await Appointment.find({ doctorId: doctor._id })
      .distinct('patientId');
    const recentPatients = await Patient.find({ _id: { $in: recentPatientIds.slice(0, 10) } });

    // Pending summaries (completed or past appointments without diagnosis/notes written)
    const pendingSummaries = await Appointment.find({
      doctorId: doctor._id,
      $or: [
        { date: { $lt: todayStr }, status: 'booked' },
        { date: todayStr, status: 'booked' } // booked but pending consultation
      ]
    }).populate('patientId');

    return res.json({
      success: true,
      doctor,
      widgets: {
        todayAppointments,
        upcomingAppointments,
        recentPatients,
        pendingSummaries,
      }
    });
  } catch (error) {
    console.error('[Doctor Dashboard Error]:', error.message);
    return res.status(500).json({ success: false, message: error.message || 'Server error loading dashboard.' });
  }
};

/**
 * @desc    Get Doctor's profile
 * @route   GET /api/doctors/profile
 * @access  Private/Doctor
 */
const getProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id }).populate('userId', 'email');
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Profile not found.' });
    }
    return res.json({ success: true, doctor });
  } catch (error) {
    console.error('[Doctor Get Profile Error]:', error.message);
    return res.status(500).json({ success: false, message: 'Server error retrieving profile.' });
  }
};

/**
 * @desc    Update Doctor's own profile
 * @route   PUT /api/doctors/profile
 * @access  Private/Doctor
 */
const updateProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }

    const { phone, specialization, qualification, experience, workingDays, workingHours, profilePhoto } = req.body;

    if (phone) doctor.phone = phone;
    if (specialization) doctor.specialization = specialization;
    if (qualification) doctor.qualification = qualification;
    if (experience) doctor.experience = Number(experience);
    if (workingDays) doctor.workingDays = workingDays;
    if (workingHours) doctor.workingHours = workingHours;
    if (profilePhoto !== undefined) doctor.profilePhoto = profilePhoto;

    await doctor.save();
    return res.json({ success: true, message: 'Profile updated successfully.', doctor });
  } catch (error) {
    console.error('[Doctor Profile Update Error]:', error.message);
    return res.status(500).json({ success: false, message: 'Server error updating profile.' });
  }
};

/**
 * @desc    Save clinical consultation & trigger Gemini post-visit summary
 * @route   PUT /api/doctors/appointments/:id/consultation
 * @access  Private/Doctor
 */
const saveConsultation = async (req, res) => {
  const { id } = req.params;
  const { diagnosis, prescription, clinicalNotes } = req.body;

  if (!diagnosis || !clinicalNotes) {
    return res.status(400).json({ success: false, message: 'Diagnosis and clinical notes are required.' });
  }

  try {
    const doctor = await getDoctorProfile(req.user._id);
    const appointment = await Appointment.findOne({ _id: id, doctorId: doctor._id });

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found or unauthorized.' });
    }

    appointment.diagnosis = diagnosis;
    appointment.prescription = prescription || '';
    appointment.clinicalNotes = clinicalNotes;
    appointment.status = 'completed';

    // Trigger Gemini post-visit layperson summary
    const aiSummary = await geminiService.summarizeClinicalNotes({
      diagnosis,
      prescription,
      clinicalNotes
    });

    appointment.aiPostVisitSummary = {
      diagnosisExplanation: aiSummary.diagnosisExplanation,
      medicationSchedule: aiSummary.medicationSchedule,
      precautions: aiSummary.precautions,
      followUpInstructions: aiSummary.followUpInstructions
    };

    await appointment.save();

    // Automatically create Medication Reminders!
    // We will attempt to parse the prescription lines to construct automated reminders.
    // If the prescription contains line-by-line items, e.g. "Paracetamol - 1 tab - Twice Daily"
    // Let's inspect the prescription string, splitting by newlines or semicolons
    const prescriptionLines = (prescription || '')
      .split(/[\n;]/)
      .map(line => line.trim())
      .filter(line => line.length > 0);

    for (const line of prescriptionLines) {
      // Simple parser: Try to find frequency tags
      let frequency = 'Once Daily';
      const lowercaseLine = line.toLowerCase();
      
      if (lowercaseLine.includes('twice') || lowercaseLine.includes('bid') || lowercaseLine.includes('2x')) {
        frequency = 'Twice Daily';
      } else if (lowercaseLine.includes('morning') || lowercaseLine.includes('am')) {
        frequency = 'Morning';
      } else if (lowercaseLine.includes('night') || lowercaseLine.includes('pm') || lowercaseLine.includes('bedtime')) {
        frequency = 'Night';
      }

      // Try to isolate dosage: e.g. "1 tablet" or "5ml" or "1 cap"
      let dosage = '1 dose';
      const dosageMatch = line.match(/\b\d+\s*(?:tablet|tab|cap|capsule|pill|ml|tsp|spoon|drop|drops)\b/i);
      if (dosageMatch) {
        dosage = dosageMatch[0];
      }

      // Isolate medicine name (usually the start of the line before a dash, comma, or number)
      let medicineName = line;
      const separatorIndex = line.search(/[-–,:\d]/);
      if (separatorIndex > 0) {
        medicineName = line.substring(0, separatorIndex).trim();
      }

      // Schedule for 7 days starting today
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + 7); // Default duration: 7 days

      await MedicationReminder.create({
        appointmentId: appointment._id,
        patientId: appointment.patientId,
        medicineName,
        dosage,
        frequency,
        startDate,
        endDate,
        isActive: true,
      });
      console.log(`[Medication Reminder Scheduled] Created reminder for ${medicineName} (${frequency})`);
    }

    return res.json({
      success: true,
      message: 'Consultation saved and AI patient recovery guide generated successfully.',
      appointment
    });
  } catch (error) {
    console.error('[Save Consultation Error]:', error.message);
    return res.status(500).json({ success: false, message: 'Server error saving consultation.' });
  }
};

module.exports = {
  getDashboardData,
  getProfile,
  updateProfile,
  saveConsultation
};
