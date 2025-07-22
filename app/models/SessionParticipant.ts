import mongoose, { Schema } from 'mongoose';

const sessionParticipantSchema = new Schema({
  sessionId: {
    type: String,
    required: true,
    ref: 'Session'
  },
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  userName: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: false
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  approvedAt: {
    type: Date,
    default: null
  },
  rejectedAt: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    default: null
  },
  cancelledAt: {
    type: Date,
    default: null
  },
  cancellationReason: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Prevent duplicate joins
sessionParticipantSchema.index({ sessionId: 1, userId: 1 }, { unique: true });

const SessionParticipant = mongoose.models.SessionParticipant || mongoose.model('SessionParticipant', sessionParticipantSchema);

export default SessionParticipant;
