const calendarService = require('../services/calendarService');

/**
 * @desc    Redirect to Google OAuth consent screen
 * @route   GET /api/calendar/auth-url
 * @access  Private/Admin (Central system sync setup)
 */
const getGoogleAuthUrl = (req, res) => {
  try {
    const authUrl = calendarService.getAuthUrl('system');
    if (!authUrl) {
      return res.status(400).json({ success: false, message: 'Google Client ID or credentials not configured.' });
    }
    return res.json({ success: true, url: authUrl });
  } catch (error) {
    console.error('[Calendar Controller URL Error]:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to generate auth URL.' });
  }
};

/**
 * @desc    Google OAuth2 redirect callback handler
 * @route   GET /api/calendar/oauth2callback
 * @access  Public
 */
const oauth2Callback = async (req, res) => {
  const { code, state } = req.query;

  if (!code) {
    return res.status(400).send('<h1>Authorization code is missing.</h1>');
  }

  try {
    const ownerId = state || 'system';
    await calendarService.saveTokenFromCode(code, ownerId);

    // Return a styled success HTML landing page
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Auth Success - HealthHub AI</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #F8FAFC; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); text-align: center; max-width: 400px; border: 1px solid #E2E8F0; }
            h1 { color: #22C55E; font-size: 24px; margin-bottom: 16px; }
            p { color: #475569; font-size: 15px; line-height: 1.5; margin-bottom: 24px; }
            .btn { background: #2563EB; color: white; border: none; padding: 12px 24px; font-weight: bold; border-radius: 8px; cursor: pointer; text-decoration: none; display: inline-block; }
            .btn:hover { background: #1D4ED8; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Connection Successful!</h1>
            <p>HealthHub AI has been successfully authorized to sync appointments with your Google Calendar. You can close this tab now.</p>
            <button class="btn" onclick="window.close()">Close Window</button>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('[OAuth Callback Exchange Error]:', error.message);
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Auth Failed - HealthHub AI</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #F8FAFC; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); text-align: center; max-width: 400px; border: 1px solid #E2E8F0; }
            h1 { color: #EF4444; font-size: 24px; margin-bottom: 16px; }
            p { color: #475569; font-size: 15px; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Authorization Failed</h1>
            <p>An error occurred exchanging codes: <strong>${error.message}</strong>. Please contact system support.</p>
          </div>
        </body>
      </html>
    `);
  }
};

module.exports = {
  getGoogleAuthUrl,
  oauth2Callback,
};
