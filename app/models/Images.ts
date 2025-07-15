// models/Image.ts
import mongoose, { Schema, model, models } from 'mongoose';

// ✅ Updated Comment schema with unique ID (required for UI mapping)
const CommentSchema = new Schema({
  id: { type: String, required: true }, // for client-side key tracking
  text: { type: String, required: true },
  timestamp: { type: Number, required: true },
}, { _id: false });

const ImageSchema = new Schema({
  src: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'approved', 'declined'],
    default: 'pending',
  },
  likes: { type: Number, default: 0 },
  
}, { timestamps: true });

// ✅ Export Mongoose model
export const ImageModel = models.Image || model('Image', ImageSchema);
