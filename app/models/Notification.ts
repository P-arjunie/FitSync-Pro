import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  userId: { type: String, required: true },     // required
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, required: true },       // e.g., contact, payment, booking
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// Avoid overwrite error during development
export default mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);
