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
  status: {
    type: String,
    enum: ['active', 'cancelled', 'completed'],
    default: 'active'
  },
  canceled: {
    type: Boolean,
    default: false
  },
  cancellationReason: {
    type: String,
    default: ""
  },
  cancelledAt: {
    type: Date,
    default: null
  },
  cancelledBy: {
    type: String,
    default: null
  },
  rescheduledAt: {
    type: Date,
    default: null
  },
  rescheduledBy: {
    type: String,
    default: null
  },
  rescheduleReason: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Add custom validator to ensure end time is after start time
sessionSchema.pre('save', function(next) {
  if (this.start && this.end) {
    if (this.end <= this.start) {
      const error = new Error('End time must be after start time');
      return next(error);
    }
  }
  next();
});

// Add custom validator to ensure end time is after start time for updates
sessionSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  if (update.start && update.end) {
    if (update.end <= update.start) {
      const error = new Error('End time must be after start time');
      return next(error);
    }
  }
  next();
});

// Check if model already exists to prevent overwriting during hot reloads
const Session = mongoose.models.Session || mongoose.model('Session', sessionSchema);

export default Session;