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
  joinedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Prevent duplicate joins
sessionParticipantSchema.index({ sessionId: 1, userId: 1 }, { unique: true });

const SessionParticipant = mongoose.models.SessionParticipant || mongoose.model('SessionParticipant', sessionParticipantSchema);

export default SessionParticipant;
