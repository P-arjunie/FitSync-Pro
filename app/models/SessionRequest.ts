import mongoose, { Schema, Document, models } from "mongoose";

export interface ISessionRequest extends Document {
  memberName: string;
  memberEmail: string;
  trainerId: string;
  trainerName: string;
  sessionName: string;
  sessionType: string;
  preferredDate: string;
  preferredTime: string;
  pricingPlan: string;
  notes?: string;
  place?: string;
  meetingLink?: string;
  rejectionReason?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
}

const SessionRequestSchema = new Schema<ISessionRequest>({
  memberName: { type: String, required: true },
  memberEmail: { type: String, required: true },
  trainerId: { type: String, required: true },
  trainerName: { type: String, required: true },
  sessionName: { type: String, required: true },
  sessionType: { type: String, required: true },
  preferredDate: { type: String, required: true },
  preferredTime: { type: String, required: true },
  pricingPlan: { type: String, required: true },
  notes: { type: String },
  place: { type: String },
  meetingLink: { type: String },
  rejectionReason: { type: String },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
});

const SessionRequest = models.SessionRequest || mongoose.model<ISessionRequest>("SessionRequest", SessionRequestSchema);

export default SessionRequest; 