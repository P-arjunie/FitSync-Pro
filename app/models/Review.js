// models/Review.js
import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema({
  trainer: { type: String, required: true },
  sessionType: { type: String, required: true },
  date: { type: String, required: true },
  comments: { type: String, required: true },
  rating: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Review || mongoose.model("Review", ReviewSchema);
