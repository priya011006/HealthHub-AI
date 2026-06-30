const nodemailer = require('nodemailer');
const SyncQueue = require('../models/SyncQueue');

let transporter;

const getTransporter = () => {
  if (!transporter) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('EMAIL_USER or EMAIL_PASS not set. Emails will be logged to console instead of sent.');
      return null;
    }
    transporter = nodemailer.createTransport({
      service: 'gmail', // Standard gmail SMTP or custom smtp via env
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return transporter;
};

/**
 * Common HTML email shell wrapper for branding
 */
const wrapHtmlTemplate = (title, contentHTML) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #F8FAFC; color: #1E293B; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
          .container { max-width: 600px; margin: 20px auto; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03); border: 1px solid #E2E8F0; }
          .header { background-color: #0F172A; padding: 30px; text-align: center; }
          .header h1 { color: #FFFFFF; font-size: 24px; margin: 0; font-weight: 700; letter-spacing: -0.5px; }
          .header span { color: #3B82F6; font-weight: 500; font-size: 14px; display: block; margin-top: 4px; }
          .content { padding: 40px 30px; line-height: 1.6; }
          .footer { background-color: #F1F5F9; padding: 20px; text-align: center; font-size: 12px; color: #64748B; border-top: 1px solid #E2E8F0; }
          .btn { display: inline-block; padding: 12px 24px; background-color: #2563EB; color: #FFFFFF !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin-top: 20px; box-shadow: 0 2px 4px rgba(37,99,235,0.2); }
          .badge { display: inline-block; padding: 4px 8px; font-size: 11px; font-weight: 600; border-radius: 6px; text-transform: uppercase; margin-bottom: 10px; }
          .badge-blue { background-color: #DBEAFE; color: #1E40AF; }
          .badge-red { background-color: #FEE2E2; color: #991B1B; }
          .badge-green { background-color: #D1FAE5; color: #065F46; }
          .details-box { background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; margin-top: 20px; }
          .details-row { display: flex; margin-bottom: 8px; font-size: 14px; }
          .details-label { width: 120px; font-weight: 600; color: #475569; }
          .details-val { flex: 1; color: #0F172A; }
          h2 { font-size: 18px; color: #0F172A; margin-top: 0; font-weight: 700; }
          p { margin: 0 0 16px 0; font-size: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>HealthHub AI</h1>
            <span>Smart Healthcare Appointment & Follow-up Platform</span>
          </div>
          <div class="content">
            ${contentHTML}
          </div>
          <div class="footer">
            &copy; 2026 HealthHub AI Clinic Network. All rights reserved.<br>
            If you have any questions, please contact our support team.
          </div>
        </div>
      </body>
    </html>
  `;
};

/**
 * Tries to send an email immediately. If it fails, queues it in the database SyncQueue.
 */
const sendEmail = async (options) => {
  const { to, subject, html, forceQueue = false } = options;
  const client = getTransporter();

  if (!client || forceQueue) {
    console.log(`[Email Queue] Queuing email to: ${to} | Subject: ${subject}`);
    await SyncQueue.create({
      type: 'email',
      payload: { to, subject, html },
    });
    return false;
  }

  try {
    await client.sendMail({
      from: `"HealthHub AI" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`[Email Success] Sent to: ${to} | Subject: ${subject}`);
    return true;
  } catch (error) {
    console.error(`[Email Failed] Failed to send email to ${to}:`, error.message);
    // Queue it for later retry
    await SyncQueue.create({
      type: 'email',
      payload: { to, subject, html },
      lastError: error.message,
    });
    return false;
  }
};

/**
 * Email Types
 */

// 1. Booking Confirmation Email
const sendBookingConfirmation = async (appointment, patientEmail, doctorEmail) => {
  const content = `
    <div class="badge badge-green">Confirmed</div>
    <h2>Appointment Confirmed!</h2>
    <p>Dear ${appointment.patientId.name || 'Patient'}, your appointment has been successfully scheduled with <strong>Dr. ${appointment.doctorId.name}</strong>.</p>
    
    <div class="details-box">
      <div class="details-row"><div class="details-label">Doctor:</div><div class="details-val">Dr. ${appointment.doctorId.name} (${appointment.doctorId.specialization})</div></div>
      <div class="details-row"><div class="details-label">Date:</div><div class="details-val">${appointment.date}</div></div>
      <div class="details-row"><div class="details-label">Time:</div><div class="details-val">${appointment.time}</div></div>
      <div class="details-row"><div class="details-label">AI Urgency:</div><div class="details-val">${appointment.aiPreVisitSummary.urgencyLevel}</div></div>
    </div>
    
    <p style="margin-top: 20px;">Please arrive 10 minutes prior to your scheduled time. If you need to cancel or reschedule, you can do so through the HealthHub Portal.</p>
  `;
  
  const html = wrapHtmlTemplate('Appointment Booking Confirmation', content);
  
  // Send to patient
  await sendEmail({ to: patientEmail, subject: 'Appointment Confirmed - HealthHub AI', html });
  
  // Send to doctor
  const docContent = `
    <div class="badge badge-blue">New Appointment</div>
    <h2>New Appointment Scheduled</h2>
    <p>Dr. ${appointment.doctorId.name}, a new appointment has been booked for you by <strong>${appointment.patientId.name}</strong>.</p>
    
    <div class="details-box">
      <div class="details-row"><div class="details-label">Patient:</div><div class="details-val">${appointment.patientId.name}</div></div>
      <div class="details-row"><div class="details-label">Date:</div><div class="details-val">${appointment.date}</div></div>
      <div class="details-row"><div class="details-label">Time:</div><div class="details-val">${appointment.time}</div></div>
      <div class="details-row"><div class="details-label">Chief Complaint:</div><div class="details-val">${appointment.symptoms.text}</div></div>
      <div class="details-row"><div class="details-label">AI Urgency:</div><div class="details-val">${appointment.aiPreVisitSummary.urgencyLevel}</div></div>
    </div>
  `;
  const docHtml = wrapHtmlTemplate('New Appointment Scheduled', docContent);
  await sendEmail({ to: doctorEmail, subject: 'New Appointment Scheduled - HealthHub AI', html: docHtml });
};

// 2. Appointment Rescheduled Email
const sendRescheduleNotification = async (appointment, patientEmail, doctorEmail) => {
  const content = `
    <div class="badge badge-blue">Rescheduled</div>
    <h2>Appointment Rescheduled</h2>
    <p>Dear ${appointment.patientId.name || 'Patient'}, your appointment with <strong>Dr. ${appointment.doctorId.name}</strong> has been rescheduled.</p>
    
    <div class="details-box">
      <div class="details-row"><div class="details-label">Doctor:</div><div class="details-val">Dr. ${appointment.doctorId.name}</div></div>
      <div class="details-row"><div class="details-label">New Date:</div><div class="details-val">${appointment.date}</div></div>
      <div class="details-row"><div class="details-label">New Time:</div><div class="details-val">${appointment.time}</div></div>
    </div>
  `;
  const html = wrapHtmlTemplate('Appointment Rescheduled', content);
  await sendEmail({ to: patientEmail, subject: 'Appointment Rescheduled - HealthHub AI', html });

  const docContent = `
    <div class="badge badge-blue">Rescheduled</div>
    <h2>Appointment Rescheduled</h2>
    <p>Dr. ${appointment.doctorId.name}, your appointment with <strong>${appointment.patientId.name}</strong> has been rescheduled to ${appointment.date} at ${appointment.time}.</p>
  `;
  const docHtml = wrapHtmlTemplate('Appointment Rescheduled', docContent);
  await sendEmail({ to: doctorEmail, subject: 'Appointment Rescheduled - HealthHub AI', html: docHtml });
};

// 3. Appointment Cancelled Email
const sendCancellationNotification = async (appointment, patientEmail, doctorEmail, reason = 'Cancelled by system/user') => {
  const content = `
    <div class="badge badge-red">Cancelled</div>
    <h2>Appointment Cancelled</h2>
    <p>Dear ${appointment.patientId.name || 'Patient'}, your appointment with <strong>Dr. ${appointment.doctorId.name}</strong> scheduled for ${appointment.date} at ${appointment.time} has been cancelled.</p>
    <p><strong>Reason:</strong> ${reason}</p>
  `;
  const html = wrapHtmlTemplate('Appointment Cancelled', content);
  await sendEmail({ to: patientEmail, subject: 'Appointment Cancelled - HealthHub AI', html });

  const docContent = `
    <div class="badge badge-red">Cancelled</div>
    <h2>Appointment Cancelled</h2>
    <p>Dr. ${appointment.doctorId.name}, your appointment with patient <strong>${appointment.patientId.name}</strong> scheduled for ${appointment.date} at ${appointment.time} has been cancelled.</p>
    <p><strong>Reason:</strong> ${reason}</p>
  `;
  const docHtml = wrapHtmlTemplate('Appointment Cancelled', docContent);
  await sendEmail({ to: doctorEmail, subject: 'Appointment Cancelled - HealthHub AI', html: docHtml });
};

// 4. Appointment Reminder Email (24h pre-visit)
const sendAppointmentReminder = async (appointment, patientEmail) => {
  const content = `
    <div class="badge badge-blue">Reminder</div>
    <h2>Upcoming Appointment Reminder</h2>
    <p>Dear ${appointment.patientId.name || 'Patient'}, this is a reminder that you have an appointment scheduled for tomorrow with <strong>Dr. ${appointment.doctorId.name}</strong>.</p>
    
    <div class="details-box">
      <div class="details-row"><div class="details-label">Doctor:</div><div class="details-val">Dr. ${appointment.doctorId.name}</div></div>
      <div class="details-row"><div class="details-label">Date:</div><div class="details-val">${appointment.date}</div></div>
      <div class="details-row"><div class="details-label">Time:</div><div class="details-val">${appointment.time}</div></div>
    </div>
  `;
  const html = wrapHtmlTemplate('Upcoming Appointment Reminder', content);
  await sendEmail({ to: patientEmail, subject: 'Appointment Reminder: Tomorrow - HealthHub AI', html });
};

// 5. Medication Reminder Email
const sendMedicationReminder = async (reminder, patientEmail) => {
  const content = `
    <div class="badge badge-green">Medication Reminder</div>
    <h2>Time to Take Your Medication</h2>
    <p>Dear ${reminder.patientId.name || 'Patient'}, this is your scheduled medication reminder.</p>
    
    <div class="details-box">
      <div class="details-row"><div class="details-label">Medicine:</div><div class="details-val" style="font-size: 16px; font-weight: bold; color: #2563EB;">${reminder.medicineName}</div></div>
      <div class="details-row"><div class="details-label">Dosage:</div><div class="details-val">${reminder.dosage}</div></div>
      <div class="details-row"><div class="details-label">Schedule:</div><div class="details-val">${reminder.frequency}</div></div>
    </div>
    <p style="margin-top: 15px; font-size: 12px; color: #64748B;">Please take your medication as directed by your physician. If you experience adverse side effects, consult Dr. ${reminder.appointmentId.doctorId.name || 'your doctor'} immediately.</p>
  `;
  const html = wrapHtmlTemplate('Medication Reminder', content);
  await sendEmail({ to: patientEmail, subject: `Medication Reminder: ${reminder.medicineName} - HealthHub AI`, html });
};

module.exports = {
  sendEmail,
  sendBookingConfirmation,
  sendRescheduleNotification,
  sendCancellationNotification,
  sendAppointmentReminder,
  sendMedicationReminder
};
