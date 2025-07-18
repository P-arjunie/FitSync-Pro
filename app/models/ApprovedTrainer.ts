import mongoose, { Schema, Document } from "mongoose";
import { PasswordUtils } from "@/lib/password-utils";

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
  emergencyContact: {
    name: string;
    phone: string;
  relationship: string;
  };
  startDate?: Date;
  termsAccepted: boolean;
  profileImage: string;
  submittedAt: Date;
  biography?: string;
  skills?: { name: string; level: number }[];
  password: string;
  status?: string;
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
  emergencyContact: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
  relationship: { type: String, required: true },
  },
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
  password: { type: String, required: true },
  status: { type: String, enum: ["approved", "suspended"], default: "approved" },
});

// Pre-save middleware to hash password
approvedTrainerSchema.pre('save', async function(next) {
  const trainer = this as unknown as IApprovedTrainer;

  if (!trainer.isModified('password')) {
    console.log('[ApprovedTrainer pre-save] Password not modified, skipping hash.');
    return next();
  }

  try {
    if (!trainer.password || trainer.password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
    // Only hash if not already a bcrypt hash (any salt rounds)
    const bcryptRegex = /^\$2[abxy]?\$\d{2}\$[./A-Za-z0-9]{53}$/;
    if (bcryptRegex.test(trainer.password)) {
      console.log('[ApprovedTrainer pre-save] Password already a bcrypt hash, skipping hash.');
      return next();
    }
    console.log('[ApprovedTrainer pre-save] Hashing password.');
    trainer.password = await PasswordUtils.hashPassword(trainer.password);
    next();
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Password hashing error in pre-save:', error);
      next(error);
    } else {
      next(new Error('Unknown error occurred during password hashing'));
    }
  }
});

// Instance method to compare password
approvedTrainerSchema.methods.comparePassword = async function(password: string): Promise<boolean> {
  return await PasswordUtils.comparePassword(password, this.password);
};

// Instance method to hash password manually
approvedTrainerSchema.methods.hashPassword = async function(password: string): Promise<void> {
  this.password = await PasswordUtils.hashPassword(password);
};

// Ensure password field is never returned in queries by default
approvedTrainerSchema.set('toJSON', {
  transform: function(doc, ret) {
    delete ret.password;
    return ret;
  }
});

export default mongoose.models.ApprovedTrainer || 
  mongoose.model<IApprovedTrainer>('ApprovedTrainer', approvedTrainerSchema);
