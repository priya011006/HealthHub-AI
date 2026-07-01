const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const User = require('../models/User');
const geminiService = require('../services/geminiService');
const emailService = require('../services/emailService');
const calendarService = require('../services/calendarService');

/**
 * Helper to check if a date is a weekend (Saturday/Sunday)
 */
const isWeekend = (dateStr) => {
  const day = new Date(dateStr).getDay();
  return day === 0 || day === 6;
};

/**
 * @desc    Get Available Slots for a Doctor on a specific Date
 * @route   GET /api/appointments/slots
 * @access  Private
 */
const getAvailableSlots = async (req, res) => {
  const { doctorId, date } = req.query;

  if (!doctorId || !date) {
    return res.status(400).json({ success: false, message: 'Please provide doctorId and date.' });
  }

  try {
    const doctor = await Doctor.findById(doctorId);
    if (!doctor || !doctor.isActive) {
      return res.status(404).json({ success: false, message: 'Doctor not found or inactive.' });
    }

    // 1. Check if date is in doctor leave dates
    if (doctor.leaveDates.includes(date)) {
      return res.json({ success: true, categories: { morning: [], afternoon: [], evening: [] }, message: 'Doctor is on leave on this date.' });
    }

    // 2. Check if date is a working day
    const dayOfWeek = new Date(date).getDay();
    if (!doctor.workingDays.includes(dayOfWeek)) {
      return res.json({ success: true, categories: { morning: [], afternoon: [], evening: [] }, message: 'Doctor does not work on this day of the week.' });
    }

    // 3. Generate all slots for working hours
    const slots = [];
    const [startHour, startMin] = doctor.workingHours.start.split(':').map(Number);
    const [endHour, endMin] = doctor.workingHours.end.split(':').map(Number);
    const duration = doctor.slotDuration; // e.g. 30

    let current = new Date(`${date}T${doctor.workingHours.start}:00`);
    const end = new Date(`${date}T${doctor.workingHours.end}:00`);

    while (current < end) {
      const hours = String(current.getHours()).padStart(2, '0');
      const mins = String(current.getMinutes()).padStart(2, '0');
      slots.push(`${hours}:${mins}`);
      current = new Date(current.getTime() + duration * 60 * 1000);
    }

    // 4. Query active bookings on this date
    const bookedAppointments = await Appointment.find({
      doctorId,
      date,
      status: { $ne: 'cancelled' }
    }).select('time');

    const bookedTimes = bookedAppointments.map(appt => appt.time);

    // 5. Categorize and filter slots (Morning, Afternoon, Evening)
    const morning = [];
    const afternoon = [];
    const evening = [];

    slots.forEach(slot => {
      const [hour] = slot.split(':').map(Number);
      const isBooked = bookedTimes.includes(slot);
      const slotObj = { time: slot, isBooked };

      if (hour < 12) {
        morning.push(slotObj);
      } else if (hour >= 12 && hour < 17) {
        afternoon.push(slotObj);
      } else {
        evening.push(slotObj);
      }
    });

    return res.json({
      success: true,
      categories: {
        morning,
        afternoon,
        evening
      }
    });
  } catch (error) {
    console.error('[Get Slots Error]:', error.message);
    return res.status(500).json({ success: false, message: 'Server error retrieving slots.' });
  }
};

/**
 * @desc    Book a new Appointment
 * @route   POST /api/appointments/book
 * @access  Private
 */
const bookAppointment = async (req, res) => {
  const { doctorId, date, time, symptoms } = req.body;

  if (!doctorId || !date || !time || !symptoms || !symptoms.text || !symptoms.duration || !symptoms.severity) {
    return res.status(400).json({ success: false, message: 'Required appointment booking details are missing.' });
  }

  try {
    // Get patient profile
    const patient = await Patient.findOne({ userId: req.user._id }).populate('userId', 'email');
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient profile not found.' });
    }

    // Get doctor details
    const doctor = await Doctor.findById(doctorId).populate('userId', 'email');
    if (!doctor || !doctor.isActive) {
      return res.status(404).json({ success: false, message: 'Doctor not found or currently inactive.' });
    }

    // Double check slot availability in DB before booking
    const slotTaken = await Appointment.findOne({
      doctorId,
      date,
      time,
      status: { $ne: 'cancelled' }
    });

    if (slotTaken) {
      return res.status(400).json({ success: false, message: 'This slot has already been booked.' });
    }

    // Call Gemini to analyze symptoms pre-visit (or use already generated preview if passed)
    let aiSummary;
    if (req.body.aiPreVisitSummary) {
      aiSummary = req.body.aiPreVisitSummary;
    } else {
      aiSummary = await geminiService.analyzeSymptoms({
        text: symptoms.text,
        duration: symptoms.duration,
        severity: symptoms.severity,
        currentMedication: symptoms.currentMedication,
        allergies: symptoms.allergies,
        notes: symptoms.notes
      });
    }

    // Create appointment model
    const appointment = new Appointment({
      patientId: patient._id,
      doctorId: doctor._id,
      date,
      time,
      symptoms,
      aiPreVisitSummary: {
        urgencyLevel: aiSummary.urgencyLevel,
        chiefComplaint: aiSummary.chiefComplaint,
        suggestedQuestions: aiSummary.suggestedQuestions
      },
      status: 'booked'
    });

    // Try saving
    try {
      await appointment.save();
    } catch (saveError) {
      // Catch MongoDB unique index duplicate key error (code 11000)
      if (saveError.code === 11000) {
        return res.status(400).json({ success: false, message: 'This slot has already been booked.' });
      }
      throw saveError;
    }

    // Populate references for calendar and email
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patientId')
      .populate('doctorId');

    const patientEmail = patient.userId.email;
    const doctorEmail = doctor.userId.email;

    // Return success immediately
res.status(201).json({
  success: true,
  message: 'Appointment scheduled successfully!',
  appointment: populatedAppointment
});

// Run background tasks without blocking the user
calendarService
  .createCalendarEvent(populatedAppointment, patientEmail, doctorEmail)
  .catch((err) =>
    console.error('[Background Calendar Error]:', err.message)
  );

emailService
  .sendBookingConfirmation(populatedAppointment, patientEmail, doctorEmail)
  .catch((err) =>
    console.error('[Background Email Error]:', err.message)
  );

return;
  } catch (error) {
    console.error('[Book Appointment Error]:', error.message);
    return res.status(500).json({ success: false, message: 'Server error scheduling appointment.' });
  }
};

/**
 * @desc    Reschedule Appointment
 * @route   POST /api/appointments/reschedule/:id
 * @access  Private
 */
const rescheduleAppointment = async (req, res) => {
  const { id } = req.params;
  const { date, time } = req.body;

  if (!date || !time) {
    return res.status(400).json({ success: false, message: 'Please provide new date and time.' });
  }

  try {
    const appointment = await Appointment.findById(id)
      .populate({ path: 'patientId', populate: { path: 'userId' } })
      .populate({ path: 'doctorId', populate: { path: 'userId' } });

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    // Verify authorized user (Only patient who booked or doctor assigned or admin)
    const isOwner = 
      (req.user.role === 'patient' && String(appointment.patientId.userId._id) === String(req.user._id)) ||
      (req.user.role === 'doctor' && String(appointment.doctorId.userId._id) === String(req.user._id)) ||
      (req.user.role === 'admin');

    if (!isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized to reschedule this appointment.' });
    }

    // Verify new slot is free
    const slotTaken = await Appointment.findOne({
      doctorId: appointment.doctorId._id,
      date,
      time,
      status: { $ne: 'cancelled' },
      _id: { $ne: appointment._id }
    });

    if (slotTaken) {
      return res.status(400).json({ success: false, message: 'This slot has already been booked.' });
    }

    // Save rescheduled parameters
    appointment.date = date;
    appointment.time = time;
    appointment.status = 'rescheduled';

    try {
      await appointment.save();
    } catch (saveError) {
      if (saveError.code === 11000) {
        return res.status(400).json({ success: false, message: 'This slot has already been booked.' });
      }
      throw saveError;
    }

    const patientEmail = appointment.patientId.userId.email;
    const doctorEmail = appointment.doctorId.userId.email;

    // Update google calendar sync & email notification
    await calendarService.updateCalendarEvent(appointment, patientEmail, doctorEmail);
    await emailService.sendRescheduleNotification(appointment, patientEmail, doctorEmail);

    return res.json({
      success: true,
      message: 'Appointment rescheduled successfully.',
      appointment
    });
  } catch (error) {
    console.error('[Reschedule Error]:', error.message);
    return res.status(500).json({ success: false, message: 'Server error rescheduling appointment.' });
  }
};

/**
 * @desc    Cancel Appointment
 * @route   POST /api/appointments/cancel/:id
 * @access  Private
 */
const cancelAppointment = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    const appointment = await Appointment.findById(id)
      .populate({ path: 'patientId', populate: { path: 'userId' } })
      .populate({ path: 'doctorId', populate: { path: 'userId' } });

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    // Verify authorized user
    const isOwner = 
      (req.user.role === 'patient' && String(appointment.patientId.userId._id) === String(req.user._id)) ||
      (req.user.role === 'doctor' && String(appointment.doctorId.userId._id) === String(req.user._id)) ||
      (req.user.role === 'admin');

    if (!isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this appointment.' });
    }

    appointment.status = 'cancelled';
    appointment.cancellationReason = reason || 'Cancelled by user request.';
    await appointment.save();

    const patientEmail = appointment.patientId.userId.email;
    const doctorEmail = appointment.doctorId.userId.email;

    // Delete calendar event & email cancellation notifications
    if (appointment.googleCalendarEventId) {
      await calendarService.deleteCalendarEvent(appointment.googleCalendarEventId);
    }
    await emailService.sendCancellationNotification(appointment, patientEmail, doctorEmail, appointment.cancellationReason);

    return res.json({
      success: true,
      message: 'Appointment successfully cancelled.',
      appointment
    });
  } catch (error) {
    console.error('[Cancel Error]:', error.message);
    return res.status(500).json({ success: false, message: 'Server error cancelling appointment.' });
  }
};

/**
 * @desc    Get details of a specific appointment
 * @route   GET /api/appointments/:id
 * @access  Private
 */
const getAppointmentDetails = async (req, res) => {
  const { id } = req.params;

  try {
    const appointment = await Appointment.findById(id)
      .populate('patientId')
      .populate('doctorId');

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    return res.json({ success: true, appointment });
  } catch (error) {
    console.error('[Get Appointment Error]:', error.message);
    return res.status(500).json({ success: false, message: 'Server error loading appointment details.' });
  }
};

/**
 * @desc    Analyze symptoms before booking (Preview)
 * @route   POST /api/appointments/analyze-symptoms
 * @access  Private
 */
const analyzeSymptomsPreview = async (req, res) => {
  const { text, duration, severity, currentMedication, allergies, notes } = req.body;
  if (!text || !duration || !severity) {
    return res.status(400).json({ success: false, message: 'Symptom text, duration, and severity are required.' });
  }

  try {
    const aiSummary = await geminiService.analyzeSymptoms({
      text,
      duration,
      severity,
      currentMedication,
      allergies,
      notes
    });
    return res.json({ success: true, aiSummary });
  } catch (error) {
    console.error('[Analyze Symptoms Preview Error]:', error.message);
    return res.status(500).json({ success: false, message: 'Server error analyzing symptoms.' });
  }
};

module.exports = {
  getAvailableSlots,
  bookAppointment,
  rescheduleAppointment,
  cancelAppointment,
  getAppointmentDetails,
  analyzeSymptomsPreview
};
