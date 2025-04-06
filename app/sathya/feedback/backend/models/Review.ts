import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
  trainer: { type: String, required: true },
  sessionType: { type: String, required: true },
  date: { type: Date, required: true },
  comments: { type: String },
  rating: { type: Number, required: true, min: 1, max: 5 },
});

export default mongoose.model('Review', ReviewSchema);
