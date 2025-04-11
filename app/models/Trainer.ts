import mongoose, { Schema, Document } from "mongoose";

export interface ITrainer extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string;
  gender: string;
  address: string;
  specialization: string;
  certifications: string;
  preferredTrainingHours: string;
  yearsOfExperience: string;
  availability: string;
  pricingPlan: string;
  emergencyName: string;
  emergencyPhone: string;
  relationship: string;
  startDate?: Date;
  termsAccepted: boolean;
  profileImage: string;
  status: "pending" | "approved";
  submittedAt: Date;
}

const TrainerSchema = new Schema<ITrainer>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  dob: { type: String, required: true },
  gender: { type: String, required: true },
  address: { type: String, required: true },
  specialization: { type: String, required: true },
  certifications: { type: String, required: true },
  preferredTrainingHours: { type: String, required: true },
  yearsOfExperience: { type: String, required: true },
  availability: { type: String, required: true },
  pricingPlan: { type: String, required: true },
  emergencyName: { type: String, required: true },
  emergencyPhone: { type: String, required: true },
  relationship: { type: String, required: true },
  startDate: { type: Date },
  termsAccepted: { type: Boolean, required: true },
  profileImage: { type: String, required: true },
  status: { type: String, enum: ["pending", "approved"], default: "pending" },
  submittedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Trainer || mongoose.model<ITrainer>("Trainer", TrainerSchema);
