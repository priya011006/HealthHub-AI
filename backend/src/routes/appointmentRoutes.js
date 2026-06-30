const express = require('express');
const router = express.Router();
const {
  getAvailableSlots,
  bookAppointment,
  rescheduleAppointment,
  cancelAppointment,
  getAppointmentDetails,
  analyzeSymptomsPreview
} = require('../controllers/appointmentController');
const { protect } = require('../middleware/authMiddleware');

// Protect all routes
router.use(protect);

router.get('/slots', getAvailableSlots);
router.post('/book', bookAppointment);
router.post('/reschedule/:id', rescheduleAppointment);
router.post('/cancel/:id', cancelAppointment);
router.post('/analyze-symptoms', analyzeSymptomsPreview);
router.get('/:id', getAppointmentDetails);

module.exports = router;
