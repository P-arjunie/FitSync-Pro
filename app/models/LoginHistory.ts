import mongoose, { Schema, Document, models } from "mongoose";

export interface ILoginHistory extends Document {
  userId?: mongoose.Schema.Types.ObjectId;
  email: string;
  timestamp: Date;
  status: "success" | "failure";
  reason?: "invalid_credentials" | "suspended_account";
  ipAddress?: string;
  userAgent?: string;
}

const LoginHistorySchema = new Schema<ILoginHistory>({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  email: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, enum: ["success", "failure"], required: true },
  reason: { type: String, enum: ["invalid_credentials", "suspended_account"] },
  ipAddress: { type: String },
  userAgent: { type: String },
});

// Add indexes for better performance
LoginHistorySchema.index({ email: 1, status: 1 });
LoginHistorySchema.index({ email: 1, status: 1, timestamp: -1 });

const LoginHistory = models.LoginHistory || mongoose.model<ILoginHistory>("LoginHistory", LoginHistorySchema);

export default LoginHistory;