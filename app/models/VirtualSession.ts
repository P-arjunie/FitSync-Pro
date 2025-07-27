import mongoose, { Schema } from 'mongoose';

// Sub-schema for Trainer details
const trainerSchema = new Schema({
  name: {
    type: String,
    required: true,
    minlength: 2,
  },
  email: {
    type: String,
    required: true,
    minlength: 5,
  },
});

// Main schema for VirtualSession
const virtualSessionSchema = new Schema({
  title: {
    type: String,
    required: true,
    minlength: 2,
  },
  trainer: {
    type: trainerSchema,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  maxParticipants: {
    type: Number,
    required: true,
    min: 1,
  },
  description: {
    type: String,
  },
  onlineLink: {
    type: String,
    required: true,
    validate: {
      validator: (v: string) => /^(https?:\/\/)/.test(v),
      message: 'Please enter a valid URL',
    },
  },
  participants: {
    type: [
      {
        id: { type: String, required: true },
        firstName: String,
        lastName: String,
        email: String,
      }
    ],
    default: [],
  },
}, {
  timestamps: true,
});

// Add custom validator to ensure end time is after start time
virtualSessionSchema.pre('save', function(next) {
  if (this.startTime && this.endTime) {
    const startTime = new Date(`2000-01-01T${this.startTime}`);
    const endTime = new Date(`2000-01-01T${this.endTime}`);
    
    if (endTime <= startTime) {
      const error = new Error('End time must be after start time');
      return next(error);
    }
  }
  next();
});

const VirtualSession = mongoose.models.VirtualSession || mongoose.model('VirtualSession', virtualSessionSchema);

export default VirtualSession;
