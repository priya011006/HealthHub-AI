// Trigger nodemon restart
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cronJobs = require('./services/cronJobs');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const patientRoutes = require('./routes/patientRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const calendarRoutes = require('./routes/calendarRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const { seedDatabase } = require('./utils/seeder');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: '*', // In production, replace with specific frontend domain (e.g. Vercel domain)
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser
app.use(express.json());

// Request logger middleware
app.use((req, res, next) => {
  console.log(`[Request] ${req.method} ${req.originalUrl}`);
  next();
});

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'An unexpected server error occurred.',
  });
});

// Connect to MongoDB & Start Server
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('CRITICAL: MONGODB_URI is not defined in environment variables. Database connection skipped.');
} else {
  mongoose
    .connect(MONGODB_URI)
    .then(async () => {
      console.log('[Database] MongoDB Atlas connected successfully.');
      
      // Run database seed routine
      await seedDatabase();
      
      // Initialize cron jobs only after successful DB connection
      cronJobs.initCronJobs();
      
      app.listen(PORT, () => {
        console.log(`[Server] HealthHub AI backend running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error('[Database Connection Error]:', err.message);
      process.exit(1);
    });
}

// Fallback listener if Mongo connection is not present (for development check)
if (!MONGODB_URI) {
  app.listen(PORT, () => {
    console.log(`[Server] running in mock mode on port ${PORT} (Database not connected)`);
  });
}
