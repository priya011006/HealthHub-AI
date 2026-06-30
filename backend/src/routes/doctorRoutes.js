const express = require('express');
const router = express.Router();
const {
  getDashboardData,
  getProfile,
  updateProfile,
  saveConsultation
} = require('../controllers/doctorController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Middleware restriction
router.use(protect);
router.use(authorize('doctor'));

router.get('/dashboard', getDashboardData);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/appointments/:id/consultation', saveConsultation);

module.exports = router;
