import mongoose, { Schema, Document } from "mongoose";

export interface IApprovedTrainer extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string;
  gender: string;
  address: string;
  specialization: string;
  certifications: string[]; // changed from string to array
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
  submittedAt: Date;
  biography?: string;
  skills?: { name: string; level: number }[];
}

const approvedTrainerSchema = new Schema<IApprovedTrainer>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  dob: { type: String, required: true },
  gender: { type: String, required: true },
  address: { type: String, required: true },
  specialization: { type: String, required: true },
  certifications: { type: [String], required: true }, // array of strings
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
  submittedAt: { type: Date, default: Date.now },
  biography: { type: String, default: "" },
  skills: [
    {
      name: { type: String, required: true },
      level: { type: Number, min: 0, max: 100 },
    },
  ],
});

export default mongoose.models.ApprovedTrainer ||
  mongoose.model<IApprovedTrainer>("ApprovedTrainer", approvedTrainerSchema);
