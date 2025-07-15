import mongoose, { Schema } from 'mongoose';

const virtualSessionSchema = new Schema({
  title: {
    type: String,
    required: true,
    minlength: 2,
  },
  trainer: {
    type: String,
    required: true,
    minlength: 2,
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

const VirtualSession = mongoose.models.VirtualSession || mongoose.model('VirtualSession', virtualSessionSchema);

export default VirtualSession;
