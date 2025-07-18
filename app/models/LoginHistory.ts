import mongoose, { Schema, Document, models } from "mongoose";

export interface ILoginHistory extends Document {
  userId?: mongoose.Schema.Types.ObjectId; // Optional: only for successful logins
  email: string; // The email used for the attempt
  timestamp: Date;
  status: "success" | "failure";
  reason?: "invalid_credentials" | "suspended_account"; // More detail on failures
  ipAddress?: string; // For geographic tracking
  userAgent?: string; // For device/browser tracking
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

const LoginHistory = models.LoginHistory || mongoose.model<ILoginHistory>("LoginHistory", LoginHistorySchema);

export default LoginHistory;