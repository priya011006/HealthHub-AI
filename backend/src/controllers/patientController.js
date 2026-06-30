const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const MedicationReminder = require('../models/MedicationReminder');

/**
 * Helper to fetch Patient Profile from authenticated User
 */
const getPatientProfile = async (userId) => {
  const patient = await Patient.findOne({ userId });
  if (!patient) {
    throw new Error('Patient profile not found.');
  }
  return patient;
};

/**
 * @desc    Get Patient Dashboard Overview data
 * @route   GET /api/patients/dashboard
 * @access  Private/Patient
 */
const getDashboardData = async (req, res) => {
  try {
    const patient = await getPatientProfile(req.user._id);
    const todayStr = new Date().toISOString().split('T')[0];

    // Get closest upcoming appointment
    const upcoming = await Appointment.find({
      patientId: patient._id,
      date: { $gte: todayStr },
      status: { $in: ['booked', 'rescheduled'] }
    })
      .sort({ date: 1, time: 1 })
      .populate('doctorId')
      .exec();

    // Separate next appointment from the rest
    const nextAppointment = upcoming[0] || null;
    const otherUpcoming = upcoming.slice(1);

    // Get active medication reminders
    const reminders = await MedicationReminder.find({
      patientId: patient._id,
      isActive: true,
      endDate: { $gte: new Date() }
    }).populate({
      path: 'appointmentId',
      populate: { path: 'doctorId' }
    });

    return res.json({
      success: true,
      patient,
      nextAppointment,
      otherUpcoming,
      reminders
    });
  } catch (error) {
    console.error('[Patient Dashboard Error]:', error.message);
    return res.status(500).json({ success: false, message: error.message || 'Server error loading dashboard.' });
  }
};

/**
 * @desc    Search and filter active doctors
 * @route   GET /api/patients/doctors
 * @access  Private/Patient
 */
const searchDoctors = async (req, res) => {
  const { name, specialization, experience, day } = req.query;

  try {
    const query = { isActive: true };

    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }

    if (specialization) {
      query.specialization = { $regex: specialization, $options: 'i' };
    }

    if (experience) {
      query.experience = { $gte: Number(experience) };
    }

    if (day !== undefined) {
      // day: 0 (Sun) to 6 (Sat)
      query.workingDays = Number(day);
    }

    const doctors = await Doctor.find(query).populate('userId', 'email');
    return res.json({ success: true, doctors });
  } catch (error) {
    console.error('[Patient Doctor Search Error]:', error.message);
    return res.status(500).json({ success: false, message: 'Server error searching doctors.' });
  }
};

/**
 * @desc    Get patient profile
 * @route   GET /api/patients/profile
 * @access  Private/Patient
 */
const getProfile = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id }).populate('userId', 'email');
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Profile not found.' });
    }
    return res.json({ success: true, patient });
  } catch (error) {
    console.error('[Patient Get Profile Error]:', error.message);
    return res.status(500).json({ success: false, message: 'Server error loading profile.' });
  }
};

/**
 * @desc    Update patient profile
 * @route   PUT /api/patients/profile
 * @access  Private/Patient
 */
const updateProfile = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient profile not found.' });
    }

    const { name, phone, gender, dateOfBirth, medicalHistory } = req.body;

    if (name) patient.name = name;
    if (phone) patient.phone = phone;
    if (gender) patient.gender = gender;
    if (dateOfBirth) patient.dateOfBirth = new Date(dateOfBirth);
    if (medicalHistory !== undefined) patient.medicalHistory = medicalHistory;

    await patient.save();

    return res.json({ success: true, message: 'Profile updated successfully.', patient });
  } catch (error) {
    console.error('[Patient Profile Update Error]:', error.message);
    return res.status(500).json({ success: false, message: 'Server error updating profile.' });
  }
};

/**
 * @desc    Get medication reminders
 * @route   GET /api/patients/reminders
 * @access  Private/Patient
 */
const getReminders = async (req, res) => {
  try {
    const patient = await getPatientProfile(req.user._id);
    const reminders = await MedicationReminder.find({ patientId: patient._id })
      .populate({
        path: 'appointmentId',
        populate: { path: 'doctorId' }
      })
      .sort({ createdAt: -1 });

    return res.json({ success: true, reminders });
  } catch (error) {
    console.error('[Patient Reminders Error]:', error.message);
    return res.status(500).json({ success: false, message: 'Server error retrieving reminders.' });
  }
};

/**
 * @desc    Get a single doctor by ID
 * @route   GET /api/patients/doctors/:id
 * @access  Private/Patient
 */
const getDoctorById = async (req, res) => {
  const { id } = req.params;
  try {
    const doctor = await Doctor.findOne({ _id: id, isActive: true }).populate('userId', 'email');
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }
    return res.json({ success: true, doctor });
  } catch (error) {
    console.error('[Patient Get Doctor Error]:', error.message);
    return res.status(500).json({ success: false, message: 'Server error retrieving doctor.' });
  }
};

/**
 * @desc    Toggle Medication Reminder active status
 * @route   PATCH /api/patients/reminders/:id/toggle
 * @access  Private/Patient
 */
const toggleReminder = async (req, res) => {
  const { id } = req.params;

  try {
    const patient = await getPatientProfile(req.user._id);
    const reminder = await MedicationReminder.findOne({ _id: id, patientId: patient._id });

    if (!reminder) {
      return res.status(404).json({ success: false, message: 'Medication reminder not found.' });
    }

    reminder.isActive = !reminder.isActive;
    await reminder.save();

    return res.json({
      success: true,
      message: `Reminder successfully ${reminder.isActive ? 'activated' : 'deactivated'}.`,
      reminder
    });
  } catch (error) {
    console.error('[Patient Toggle Reminder Error]:', error.message);
    return res.status(500).json({ success: false, message: 'Server error toggling reminder.' });
  }
};

module.exports = {
  getDashboardData,
  searchDoctors,
  getDoctorById,
  getProfile,
  updateProfile,
  getReminders,
  toggleReminder
};
