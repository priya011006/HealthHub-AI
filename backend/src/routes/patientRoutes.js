const express = require('express');
const router = express.Router();
const {
  getDashboardData,
  searchDoctors,
  getDoctorById,
  getProfile,
  updateProfile,
  getReminders,
  toggleReminder
} = require('../controllers/patientController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Lock down routes
router.use(protect);
router.use(authorize('patient'));

router.get('/dashboard', getDashboardData);
router.get('/doctors', searchDoctors);
router.get('/doctors/:id', getDoctorById);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/reminders', getReminders);
router.patch('/reminders/:id/toggle', toggleReminder);

module.exports = router;
