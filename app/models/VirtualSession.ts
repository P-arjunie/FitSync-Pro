import mongoose, { Schema } from 'mongoose';

const virtualSessionSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Session title is required'],
    minlength: [2, 'Title must be at least 2 characters'],
  },
  trainer: {
    type: String,
    required: [true, 'Trainer name is required'],
    minlength: [2, 'Trainer name must be at least 2 characters'],
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
  },
  maxParticipants: {
    type: Number,
    required: [true, 'Maximum participants is required'],
    min: [1, 'There must be at least 1 participant'],
  },
  description: {
    type: String,
    required: false,
  },
  onlineLink: {
    type: String,
    required: [true, 'Online session link is required'],
    validate: {
      validator: function (v: string) {
        return /^(https?:\/\/)/.test(v);
      },
      message: 'Please enter a valid URL',
    },
  },
}, {
  timestamps: true,
});

const VirtualSession =
  mongoose.models.VirtualSession || mongoose.model('VirtualSession', virtualSessionSchema);

export default VirtualSession;
