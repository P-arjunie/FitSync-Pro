import mongoose, { Schema } from 'mongoose';

const virtualSessionSchema = new Schema({
  trainer: {
    type: String,
    required: [true, 'Trainer name is required'],
    minlength: [2, 'Trainer name must be at least 2 characters'],
  },
  sessionType: {
    type: String,
    required: [true, 'Session type is required'],
    minlength: [2, 'Session type must be at least 2 characters'],
  },
  duration: {
    type: String,
    required: [true, 'Duration is required'],
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
  },
  comments: {
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

// Check if model already exists to prevent overwriting during hot reloads
const VirtualSession = mongoose.models.VirtualSession || mongoose.model('VirtualSession', virtualSessionSchema);

export default VirtualSession;
