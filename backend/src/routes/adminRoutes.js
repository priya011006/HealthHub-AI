const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  createDoctor,
  getAllDoctors,
  updateDoctor,
  toggleDoctorStatus,
  deleteDoctor,
  getAdminAppointments
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Lock down all routes to protect + authorize('admin')
router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/doctors', getAllDoctors);
router.post('/doctors', createDoctor);
router.put('/doctors/:id', updateDoctor);
router.patch('/doctors/:id/toggle', toggleDoctorStatus);
router.delete('/doctors/:id', deleteDoctor);
router.get('/appointments', getAdminAppointments);

module.exports = router;
