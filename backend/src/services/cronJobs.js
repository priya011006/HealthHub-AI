const cron = require('node-cron');
const MedicationReminder = require('../models/MedicationReminder');
const Appointment = require('../models/Appointment');
const SyncQueue = require('../models/SyncQueue');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const emailService = require('./emailService');
const calendarService = require('./calendarService');

/**
 * Initialize all background cron jobs
 */
const initCronJobs = () => {
  // 1. Hourly check for medication reminders (Runs at minute 0 of every hour)
  cron.schedule('0 * * * *', async () => {
    console.log('[Cron] Running medication reminders job...');
    await checkMedicationReminders();
  });

  // 2. Daily check for tomorrow's appointments (Runs at 08:00 AM every day)
  cron.schedule('0 8 * * *', async () => {
    console.log('[Cron] Running upcoming appointment reminders job...');
    await checkUpcomingAppointments();
  });

  // 3. Queue processor (Runs every 10 minutes)
  cron.schedule('*/10 * * * *', async () => {
    console.log('[Cron] Processing SyncQueue for retries...');
    await processSyncQueue();
  });

  console.log('[Cron] All background cron jobs initialized.');
};

/**
 * Medication reminder checker
 */
const checkMedicationReminders = async () => {
  try {
    const now = new Date();
    const currentHour = now.getHours();
    const todayStr = now.toISOString().split('T')[0];

    // Find active reminders
    const reminders = await MedicationReminder.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).populate({
      path: 'patientId',
      populate: { path: 'userId' },
    }).populate({
      path: 'appointmentId',
      populate: { path: 'doctorId' }
    });

    for (const reminder of reminders) {
      if (!reminder.patientId || !reminder.patientId.userId) continue;
      const email = reminder.patientId.userId.email;
      
      let shouldSend = false;
      const freq = reminder.frequency.toLowerCase();
      
      // Determine if reminder is due for the current hour
      if (currentHour === 8) { // Morning (8 AM)
        if (freq.includes('morning') || freq.includes('once') || freq.includes('twice')) {
          shouldSend = true;
        }
      } else if (currentHour === 20) { // Night (8 PM)
        if (freq.includes('night') || freq.includes('twice')) {
          shouldSend = true;
        }
      }

      if (shouldSend) {
        // Prevent double sending on same day for this time slot
        const lastSentDate = reminder.lastSent ? new Date(reminder.lastSent).toISOString().split('T')[0] : null;
        
        // For twice daily, let's check hours difference since last sent
        const hoursDiff = reminder.lastSent ? (now.getTime() - new Date(reminder.lastSent).getTime()) / (1000 * 60 * 60) : 999;

        if (lastSentDate !== todayStr || (freq.includes('twice') && hoursDiff > 8)) {
          console.log(`[Cron] Sending medication reminder to ${email} for ${reminder.medicineName}`);
          await emailService.sendMedicationReminder(reminder, email);
          reminder.lastSent = now;
          await reminder.save();
        }
      }
    }
  } catch (error) {
    console.error('[Cron Error] Medication reminder check failed:', error);
  }
};

/**
 * Upcoming appointment checker (24 hours ahead)
 */
const checkUpcomingAppointments = async () => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const appointments = await Appointment.find({
      date: tomorrowStr,
      status: { $in: ['booked', 'rescheduled'] }
    }).populate({
      path: 'patientId',
      populate: { path: 'userId' }
    }).populate('doctorId');

    for (const appt of appointments) {
      if (appt.patientId && appt.patientId.userId) {
        const patientEmail = appt.patientId.userId.email;
        console.log(`[Cron] Sending 24h reminder to ${patientEmail} for appointment on ${appt.date}`);
        await emailService.sendAppointmentReminder(appt, patientEmail);
      }
    }
  } catch (error) {
    console.error('[Cron Error] Upcoming appointment reminder failed:', error);
  }
};

/**
 * SyncQueue processor with exponential backoff retries
 */
const processSyncQueue = async () => {
  try {
    const pendingTasks = await SyncQueue.find({
      status: 'pending',
      runAfter: { $lte: new Date() }
    }).limit(20);

    for (const task of pendingTasks) {
      task.attempts += 1;
      let success = false;
      let errorMsg = '';

      try {
        if (task.type === 'email') {
          // Send email directly via Nodemailer without re-queuing
          const { to, subject, html } = task.payload;
          const transporter = emailService.sendEmail; // uses standard sendEmail
          
          // Let's use direct transporter.sendMail if possible to avoid double queue
          const nodemailer = require('nodemailer');
          if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            const directTransporter = nodemailer.createTransport({
              service: 'gmail',
              auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
              }
            });
            await directTransporter.sendMail({
              from: `"HealthHub AI" <${process.env.EMAIL_USER}>`,
              to,
              subject,
              html
            });
            success = true;
          } else {
            throw new Error('Email credentials not set');
          }
        } 
        else if (task.type === 'calendar_create') {
          const { appointmentId, patientEmail, doctorEmail } = task.payload;
          const appointment = await Appointment.findById(appointmentId)
            .populate('patientId')
            .populate('doctorId');
          
          if (appointment && appointment.status !== 'cancelled') {
            const eventId = await calendarService.createCalendarEvent(appointment, patientEmail, doctorEmail, false);
            if (eventId) success = true;
            else throw new Error('Google Calendar API creation returned null');
          } else {
            // Appointment was deleted or cancelled in the meantime
            success = true; 
          }
        }
        else if (task.type === 'calendar_update') {
          const { appointmentId, patientEmail, doctorEmail } = task.payload;
          const appointment = await Appointment.findById(appointmentId)
            .populate('patientId')
            .populate('doctorId');

          if (appointment) {
            const eventId = await calendarService.updateCalendarEvent(appointment, patientEmail, doctorEmail, false);
            if (eventId) success = true;
            else throw new Error('Google Calendar API update returned null');
          } else {
            success = true;
          }
        }
        else if (task.type === 'calendar_delete') {
          const { googleCalendarEventId } = task.payload;
          await calendarService.deleteCalendarEvent(googleCalendarEventId, false);
          success = true;
        }
      } catch (err) {
        errorMsg = err.message;
        console.error(`[Queue Task Failed] Task ID: ${task._id} | Error: ${errorMsg}`);
      }

      if (success) {
        task.status = 'completed';
      } else {
        task.lastError = errorMsg;
        if (task.attempts >= task.maxAttempts) {
          task.status = 'failed';
        } else {
          // Exponential backoff: retry in attempts * 5 minutes
          const retryMinutes = task.attempts * 5;
          task.runAfter = new Date(Date.now() + retryMinutes * 60 * 1000);
        }
      }

      await task.save();
    }
  } catch (error) {
    console.error('[Cron Error] Queue processor failed:', error);
  }
};

module.exports = {
  initCronJobs
};
