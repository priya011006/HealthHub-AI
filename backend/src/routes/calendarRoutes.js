const express = require('express');
const router = express.Router();
const { getGoogleAuthUrl, oauth2Callback } = require('../controllers/calendarController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Get auth URL is protected and authorized for admin
router.get('/auth-url', protect, authorize('admin'), getGoogleAuthUrl);

// Callback from Google is public
router.get('/oauth2callback', oauth2Callback);

module.exports = router;
