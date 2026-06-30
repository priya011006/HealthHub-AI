const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const emailService = require('../services/emailService');
const calendarService = require('../services/calendarService');

/**
 * @desc    Get Admin Dashboard Stats
 * @route   GET /api/admin/stats
 * @access  Private/Admin
 */
const getDashboardStats = async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    const totalPatients = await Patient.countDocuments();
    const totalDoctors = await Doctor.countDocuments();
    
    const todayAppointments = await Appointment.countDocuments({
      date: todayStr,
      status: { $ne: 'cancelled' }
    });

    const upcomingAppointments = await Appointment.countDocuments({
      date: { $gt: todayStr },
      status: { $in: ['booked', 'rescheduled'] }
    });

    const cancelledAppointments = await Appointment.countDocuments({
      status: 'cancelled'
    });

    // Recent Activity (last 5 appointments booked or clinical note additions)
    const recentActivity = await Appointment.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('patientId', 'name')
      .populate('doctorId', 'name specialization');

    // Quick Stats: Doctor counts by specialization for bar charts
    const specStats = await Doctor.aggregate([
      { $group: { _id: '$specialization', count: { $sum: 1 } } }
    ]);

    // Appointments by month or status
    const statusStats = await Appointment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    return res.json({
      success: true,
      stats: {
        totalPatients,
        totalDoctors,
        todayAppointments,
        upcomingAppointments,
        cancelledAppointments,
      },
      recentActivity,
      charts: {
        specialization: specStats,
        status: statusStats
      }
    });
  } catch (error) {
    console.error('[Admin Stats Error]:', error.message);
    return res.status(500).json({ success: false, message: 'Server error retrieving statistics.' });
  }
};

/**
 * @desc    Create a new Doctor profile & account
 * @route   POST /api/admin/doctors
 * @access  Private/Admin
 */
const createDoctor = async (req, res) => {
  const {
    email,
    password,
    name,
    phone,
    specialization,
    qualification,
    experience,
    workingDays,
    workingHours,
    slotDuration,
    maxPatientsPerDay,
    profilePhoto,
  } = req.body;

  if (!email || !password || !name || !phone || !specialization || !qualification || !experience) {
    return res.status(400).json({ success: false, message: 'Required doctor fields are missing.' });
  }

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    // Create Base User
    const user = await User.create({
      email,
      password,
      role: 'doctor',
    });

    // Create Doctor Profile
    const doctor = await Doctor.create({
      userId: user._id,
      name,
      phone,
      specialization,
      qualification,
      experience: Number(experience),
      workingDays: workingDays || [1, 2, 3, 4, 5],
      workingHours: workingHours || { start: '09:00', end: '17:00' },
      slotDuration: Number(slotDuration) || 30,
      maxPatientsPerDay: Number(maxPatientsPerDay) || 15,
      profilePhoto: profilePhoto || '',
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      doctor,
    });
  } catch (error) {
    console.error('[Admin Doctor Create Error]:', error.message);
    return res.status(500).json({ success: false, message: 'Server error creating doctor profile.' });
  }
};

/**
 * @desc    Get all doctors (Admin view includes inactive/private logs)
 * @route   GET /api/admin/doctors
 * @access  Private/Admin
 */
const getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find().populate('userId', 'email');
    return res.json({ success: true, doctors });
  } catch (error) {
    console.error('[Admin Get Doctors Error]:', error.message);
    return res.status(500).json({ success: false, message: 'Server error retrieving doctors.' });
  }
};

/**
 * @desc    Edit doctor details and manage leave scheduling
 * @route   PUT /api/admin/doctors/:id
 * @access  Private/Admin
 */
const updateDoctor = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const doctor = await Doctor.findById(id).populate('userId', 'email');
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }

    // Detect if leaveDates are being updated
    let leaveDatesChanged = false;
    let oldLeaveDates = [...doctor.leaveDates];
    let newLeaveDates = updateData.leaveDates || [];

    if (updateData.leaveDates) {
      // Find new leaves that weren't there before
      const addedLeaves = newLeaveDates.filter(d => !oldLeaveDates.includes(d));
      if (addedLeaves.length > 0) {
        leaveDatesChanged = true;
        
        // Cancel existing appointments scheduled on these leave dates
        const conflictingAppointments = await Appointment.find({
          doctorId: doctor._id,
          date: { $in: addedLeaves },
          status: { $in: ['booked', 'rescheduled'] }
        }).populate({
          path: 'patientId',
          populate: { path: 'userId' }
        });

        console.log(`[Admin Leave Config] Cancelling ${conflictingAppointments.length} conflicting appointments for doctor ${doctor.name}`);
        
        for (const appt of conflictingAppointments) {
          appt.status = 'cancelled';
          appt.cancellationReason = `Doctor scheduled leave on this date: ${appt.date}`;
          await appt.save();

          // Sync with calendar (delete Google event)
          if (appt.googleCalendarEventId) {
            await calendarService.deleteCalendarEvent(appt.googleCalendarEventId);
          }

          // Send Nodemailer cancellation email
          if (appt.patientId && appt.patientId.userId) {
            const patientEmail = appt.patientId.userId.email;
            await emailService.sendCancellationNotification(
              appt,
              patientEmail,
              doctor.userId.email,
              `Dr. ${doctor.name} will be on leave on this date.`
            );
          }
        }
      }
    }

    // Update Doctor properties
    Object.assign(doctor, updateData);
    await doctor.save();

    return res.json({ success: true, message: 'Doctor profile updated successfully.', doctor });
  } catch (error) {
    console.error('[Admin Doctor Update Error]:', error.message);
    return res.status(500).json({ success: false, message: 'Server error updating doctor profile.' });
  }
};

/**
 * @desc    Toggle doctor active status (Activate / Deactivate)
 * @route   PATCH /api/admin/doctors/:id/toggle
 * @access  Private/Admin
 */
const toggleDoctorStatus = async (req, res) => {
  const { id } = req.params;

  try {
    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }

    doctor.isActive = !doctor.isActive;
    await doctor.save();

    return res.json({
      success: true,
      message: `Doctor status updated to ${doctor.isActive ? 'Active' : 'Inactive'}`,
      doctor
    });
  } catch (error) {
    console.error('[Admin Doctor Toggle Error]:', error.message);
    return res.status(500).json({ success: false, message: 'Server error toggling active status.' });
  }
};

/**
 * @desc    Delete doctor and cancel appointments
 * @route   DELETE /api/admin/doctors/:id
 * @access  Private/Admin
 */
const deleteDoctor = async (req, res) => {
  const { id } = req.params;

  try {
    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }

    // Cancel all upcoming appointments
    const upcomingConflicting = await Appointment.find({
      doctorId: doctor._id,
      status: { $in: ['booked', 'rescheduled'] }
    }).populate({
      path: 'patientId',
      populate: { path: 'userId' }
    });

    for (const appt of upcomingConflicting) {
      appt.status = 'cancelled';
      appt.cancellationReason = 'Doctor profile removed from platform.';
      await appt.save();

      if (appt.googleCalendarEventId) {
        await calendarService.deleteCalendarEvent(appt.googleCalendarEventId);
      }

      if (appt.patientId && appt.patientId.userId) {
        await emailService.sendCancellationNotification(
          appt,
          appt.patientId.userId.email,
          'clinic-admin@healthhub.com',
          'Doctor is no longer with HealthHub AI.'
        );
      }
    }

    // Remove user login and doctor profile
    await User.findByIdAndDelete(doctor.userId);
    await Doctor.findByIdAndDelete(id);

    return res.json({ success: true, message: 'Doctor profile and account deleted successfully.' });
  } catch (error) {
    console.error('[Admin Doctor Delete Error]:', error.message);
    return res.status(500).json({ success: false, message: 'Server error deleting doctor.' });
  }
};

/**
 * @desc    Get all appointments (Admin calendar)
 * @route   GET /api/admin/appointments
 * @access  Private/Admin
 */
const getAdminAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('patientId', 'name')
      .populate('doctorId', 'name specialization');
    return res.json({ success: true, appointments });
  } catch (error) {
    console.error('[Admin Appointments Error]:', error.message);
    return res.status(500).json({ success: false, message: 'Server error fetching appointments calendar.' });
  }
};

module.exports = {
  getDashboardStats,
  createDoctor,
  getAllDoctors,
  updateDoctor,
  toggleDoctorStatus,
  deleteDoctor,
  getAdminAppointments
};
