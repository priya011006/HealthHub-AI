const mongoose = require('mongoose');

const syncQueueSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['email', 'calendar_create', 'calendar_update', 'calendar_delete'],
      required: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 5,
    },
    status: {
      type: String,
      enum: ['pending', 'failed', 'completed'],
      default: 'pending',
    },
    lastError: {
      type: String,
      default: '',
    },
    runAfter: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('SyncQueue', syncQueueSchema);
