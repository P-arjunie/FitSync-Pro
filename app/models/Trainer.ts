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

  certifications: string[]; // Changed to an array of strings

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
  status: "pending" | "approved";
  submittedAt: Date;
  password: string;


  biography: string;
  skills: { name: string; level: number }[];

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

  certifications: { type: [String], required: true }, // Changed to array of strings

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
  status: { type: String, enum: ["pending", "approved"], default: "pending" },
  submittedAt: { type: Date, default: Date.now },
  password: { type: String, required: true, select: false },


  biography: { type: String, default: "" },
  skills: [
    {
      name: { type: String, required: true },

      level: { type: Number, min: 0, max: 100 }, // Added min/max validation

    },
  ],
});

// Pre-save middleware to hash password
TrainerSchema.pre('save', async function(next) {
  const trainer = this as any;
  if (!trainer.isModified('password')) {
    return next();
  }
  try {
    if (!trainer.password || trainer.password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
    // Only hash if not already a bcrypt hash (any salt rounds)
    const bcryptRegex = /^\$2[abxy]?\$\d{2}\$[./A-Za-z0-9]{53}$/;
    if (bcryptRegex.test(trainer.password)) {
      console.log('[Trainer pre-save] Password already a bcrypt hash, skipping hash.');
      return next();
    }
    console.log('[Trainer pre-save] Hashing password.');
    // Use bcryptjs for hashing
    const bcryptjs = require('bcryptjs');
    trainer.password = await bcryptjs.hash(trainer.password, 12);
    next();
  } catch (error) {
    next(error as any);
  }
});

// Instance method to compare password
TrainerSchema.methods.comparePassword = async function(password: string): Promise<boolean> {
  const bcryptjs = require('bcryptjs');
  return await bcryptjs.compare(password, this.password);
};

// Ensure password field is never returned in queries by default
TrainerSchema.set('toJSON', {
  transform: function(doc, ret) {
    delete ret.password;
    return ret;
  }
});

export default mongoose.models.Trainer || mongoose.model<ITrainer>("Trainer", TrainerSchema);
