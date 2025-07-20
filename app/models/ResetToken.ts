import mongoose, { Schema, Document } from "mongoose";

export interface IResetToken extends Document {
  token: string;
  email: string;
  role: string;
  expires: Date;
  used: boolean;
}

const resetTokenSchema = new Schema<IResetToken>({
  token: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  role: { type: String, required: true },
  expires: { type: Date, required: true },
  used: { type: Boolean, default: false }
}, { timestamps: true });

// Index for automatic cleanup of expired tokens
resetTokenSchema.index({ expires: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.ResetToken || 
  mongoose.model<IResetToken>('ResetToken', resetTokenSchema); 