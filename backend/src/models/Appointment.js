const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    time: {
      type: String, // HH:MM
      required: true,
    },
    symptoms: {
      text: { type: String, required: true },
      duration: { type: String, required: true },
      severity: { type: String, enum: ['low', 'medium', 'high'], required: true },
      currentMedication: { type: String, default: '' },
      allergies: { type: String, default: '' },
      notes: { type: String, default: '' },
    },
    aiPreVisitSummary: {
      urgencyLevel: { type: String, default: 'Summary currently unavailable.' },
      chiefComplaint: { type: String, default: 'Summary currently unavailable.' },
      suggestedQuestions: { type: [String], default: [] },
    },
    status: {
      type: String,
      enum: ['booked', 'rescheduled', 'completed', 'cancelled'],
      default: 'booked',
    },
    cancellationReason: {
      type: String,
      default: '',
    },
    diagnosis: {
      type: String,
      default: '',
    },
    prescription: {
      type: String, // Will contain structured text or JSON representation of prescription
      default: '',
    },
    clinicalNotes: {
      type: String,
      default: '',
    },
    aiPostVisitSummary: {
      diagnosisExplanation: { type: String, default: '' },
      medicationSchedule: { type: String, default: '' },
      precautions: { type: String, default: '' },
      followUpInstructions: { type: String, default: '' },
    },
    googleCalendarEventId: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// CONCURRENCY PREVENSION: Unique index on Doctor + Date + Time for non-cancelled appointments
appointmentSchema.index(
  { doctorId: 1, date: 1, time: 1 },
  { unique: true, partialFilterExpression: { status: { $ne: 'cancelled' } } }
);

module.exports = mongoose.model('Appointment', appointmentSchema);
