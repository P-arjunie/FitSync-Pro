// models/Session.ts
import mongoose, { Schema } from 'mongoose';

// Define the Session schema
const sessionSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Session title is required'],
    minlength: [2, 'Session title must be at least 2 characters'],
  },
  trainerName: {
    type: String,
    required: [true, 'Trainer name is required'],
    minlength: [2, 'Trainer name must be at least 2 characters'],
  },
  trainerId: {
    type: String,
    required: [true, 'Trainer ID is required'],
  },
  start: {
    type: Date,
    required: [true, 'Start time is required'],
  },
  end: {
    type: Date,
    required: [true, 'End time is required'],
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    minlength: [2, 'Location must be at least 2 characters'],
  },
  maxParticipants: {
    type: Number,
    required: [true, 'Maximum participants is required'],
    min: [1, 'Maximum participants must be at least 1'],
  },
  currentParticipants: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    required: false,
  },
  canceled: {
    type: Boolean,
    default: false
  },
  cancellationReason: {
    type: String,
    default: null
  },
}, {
  timestamps: true,
});

// Check if model already exists to prevent overwriting during hot reloads
const Session = mongoose.models.Session || mongoose.model('Session', sessionSchema);

export default Session;