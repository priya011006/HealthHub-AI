const { google } = require('googleapis');
const GoogleToken = require('../models/GoogleToken');
const SyncQueue = require('../models/SyncQueue');

const getOAuth2Client = () => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
    console.warn('Google Credentials not fully set in .env. Google Calendar sync will be disabled.');
    return null;
  }
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
};

/**
 * Returns an authenticated and auto-refreshing OAuth2 client for the specified owner
 */
const getAuthenticatedClient = async (ownerId = 'system') => {
  const oauth2Client = getOAuth2Client();
  if (!oauth2Client) return null;

  try {
    const tokenRecord = await GoogleToken.findOne({ ownerId });
    if (!tokenRecord) {
      console.warn(`No Google tokens found for owner: ${ownerId}. Calendar authorization is required.`);
      return null;
    }

    oauth2Client.setCredentials({
      access_token: tokenRecord.accessToken,
      refresh_token: tokenRecord.refreshToken,
      expiry_date: tokenRecord.expiryDate,
    });

    // Listen for automatic token refreshes by the googleapis library
    oauth2Client.on('tokens', async (tokens) => {
      console.log(`[Google Auth] Rotating access tokens for owner: ${ownerId}`);
      const updateFields = {
        accessToken: tokens.access_token,
        expiryDate: tokens.expiry_date,
      };
      if (tokens.refresh_token) {
        updateFields.refreshToken = tokens.refresh_token;
      }
      await GoogleToken.updateOne({ ownerId }, { $set: updateFields });
    });

    return oauth2Client;
  } catch (error) {
    console.error('[Google Auth Error] Failed to retrieve tokens:', error.message);
    return null;
  }
};

/**
 * Generates the OAuth Consent URL
 */
const getAuthUrl = (ownerId = 'system') => {
  const oauth2Client = getOAuth2Client();
  if (!oauth2Client) return null;

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/calendar'],
    state: ownerId,
  });
};

/**
 * Handles the OAuth redirect code, exchanges it, and saves the tokens to DB
 */
const saveTokenFromCode = async (code, ownerId = 'system') => {
  const oauth2Client = getOAuth2Client();
  if (!oauth2Client) throw new Error('Google OAuth credentials not configured');

  const { tokens } = await oauth2Client.getToken(code);
  
  if (!tokens.refresh_token) {
    // If we didn't get a refresh token, try finding an existing record to preserve the old refresh token
    const existing = await GoogleToken.findOne({ ownerId });
    if (existing) {
      tokens.refresh_token = existing.refreshToken;
    } else {
      throw new Error('No refresh token returned. Try removing app access from Google account settings and re-authenticating.');
    }
  }

  await GoogleToken.findOneAndUpdate(
    { ownerId },
    {
      ownerId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: tokens.expiry_date,
    },
    { upsert: true, new: true }
  );

  return tokens;
};

/**
 * Formats appointment date/time to Google Calendar API RFC3339 format
 */
const getEventTimestamps = (dateStr, timeStr, durationMinutes = 30) => {
  const start = new Date(`${dateStr}T${timeStr}:00`);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  return {
    start: start.toISOString(),
    end: end.toISOString()
  };
};

/**
 * Creates Google Calendar Event
 */
const createCalendarEvent = async (appointment, patientEmail, doctorEmail, forceQueue = false) => {
  const auth = await getAuthenticatedClient('system');
  
  if (!auth || forceQueue) {
    console.log('[Calendar Sync] Calendar not authenticated. Queueing event creation.');
    await SyncQueue.create({
      type: 'calendar_create',
      payload: { appointmentId: appointment._id, patientEmail, doctorEmail }
    });
    return null;
  }

  try {
    const calendar = google.calendar({ version: 'v3', auth });
    const { start, end } = getEventTimestamps(appointment.date, appointment.time, appointment.doctorId.slotDuration || 30);

    const event = {
      summary: `HealthHub: ${appointment.patientId.name} with Dr. ${appointment.doctorId.name}`,
      location: 'HealthHub AI Virtual Clinic / Facility',
      description: `
Patient Chief Complaint: ${appointment.symptoms.text}
AI Symptoms Pre-Visit Summary:
- Urgency: ${appointment.aiPreVisitSummary.urgencyLevel}
- Chief Complaint: ${appointment.aiPreVisitSummary.chiefComplaint}
- Suggested Questions: ${appointment.aiPreVisitSummary.suggestedQuestions.join(', ')}
      `,
      start: { dateTime: start, timeZone: 'UTC' },
      end: { dateTime: end, timeZone: 'UTC' },
      attendees: [
        { email: patientEmail },
        { email: doctorEmail }
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 }
        ]
      }
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      sendUpdates: 'all', // Send email updates to attendees
    });

    console.log('[Calendar Success] Event created:', response.data.id);
    appointment.googleCalendarEventId = response.data.id;
    await appointment.save();
    return response.data.id;
  } catch (error) {
    console.error('[Calendar Sync Failed] Creating event failed:', error.message);
    await SyncQueue.create({
      type: 'calendar_create',
      payload: { appointmentId: appointment._id, patientEmail, doctorEmail },
      lastError: error.message
    });
    return null;
  }
};

/**
 * Updates Google Calendar Event
 */
const updateCalendarEvent = async (appointment, patientEmail, doctorEmail, forceQueue = false) => {
  if (!appointment.googleCalendarEventId) {
    // If it doesn't have an event ID, try creating it instead
    return createCalendarEvent(appointment, patientEmail, doctorEmail);
  }

  const auth = await getAuthenticatedClient('system');
  if (!auth || forceQueue) {
    console.log('[Calendar Sync] Calendar not authenticated. Queueing event update.');
    await SyncQueue.create({
      type: 'calendar_update',
      payload: { appointmentId: appointment._id, patientEmail, doctorEmail }
    });
    return null;
  }

  try {
    const calendar = google.calendar({ version: 'v3', auth });
    const { start, end } = getEventTimestamps(appointment.date, appointment.time, appointment.doctorId.slotDuration || 30);

    const event = {
      summary: `HealthHub: ${appointment.patientId.name} with Dr. ${appointment.doctorId.name} (Rescheduled)`,
      location: 'HealthHub AI Virtual Clinic / Facility',
      start: { dateTime: start, timeZone: 'UTC' },
      end: { dateTime: end, timeZone: 'UTC' },
      attendees: [
        { email: patientEmail },
        { email: doctorEmail }
      ]
    };

    await calendar.events.patch({
      calendarId: 'primary',
      eventId: appointment.googleCalendarEventId,
      resource: event,
      sendUpdates: 'all',
    });

    console.log('[Calendar Success] Event updated:', appointment.googleCalendarEventId);
    return appointment.googleCalendarEventId;
  } catch (error) {
    console.error('[Calendar Sync Failed] Updating event failed:', error.message);
    await SyncQueue.create({
      type: 'calendar_update',
      payload: { appointmentId: appointment._id, patientEmail, doctorEmail },
      lastError: error.message
    });
    return null;
  }
};

/**
 * Deletes Google Calendar Event
 */
const deleteCalendarEvent = async (googleCalendarEventId, forceQueue = false) => {
  if (!googleCalendarEventId) return;

  const auth = await getAuthenticatedClient('system');
  if (!auth || forceQueue) {
    console.log('[Calendar Sync] Calendar not authenticated. Queueing event deletion.');
    await SyncQueue.create({
      type: 'calendar_delete',
      payload: { googleCalendarEventId }
    });
    return;
  }

  try {
    const calendar = google.calendar({ version: 'v3', auth });
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: googleCalendarEventId,
      sendUpdates: 'all',
    });
    console.log('[Calendar Success] Event deleted:', googleCalendarEventId);
  } catch (error) {
    console.error('[Calendar Sync Failed] Deleting event failed:', error.message);
    await SyncQueue.create({
      type: 'calendar_delete',
      payload: { googleCalendarEventId },
      lastError: error.message
    });
  }
};

module.exports = {
  getAuthUrl,
  saveTokenFromCode,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  getAuthenticatedClient
};
