const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    specialization: {
      type: String,
      required: true,
      trim: true,
    },
    qualification: {
      type: String,
      required: true,
      trim: true,
    },
    experience: {
      type: Number,
      required: true,
      min: 0,
    },
    workingDays: {
      type: [Number], // Array of days: 0 (Sunday) to 6 (Saturday)
      default: [1, 2, 3, 4, 5], // Monday to Friday default
    },
    workingHours: {
      start: {
        type: String, // e.g. "09:00"
        default: '09:00',
      },
      end: {
        type: String, // e.g. "17:00"
        default: '17:00',
      },
    },
    slotDuration: {
      type: Number, // in minutes
      default: 30,
    },
    maxPatientsPerDay: {
      type: Number,
      default: 15,
    },
    leaveDates: {
      type: [String], // Array of "YYYY-MM-DD" dates
      default: [],
    },
    profilePhoto: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Doctor', doctorSchema);
