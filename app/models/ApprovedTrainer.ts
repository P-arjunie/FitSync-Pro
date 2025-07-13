import mongoose, { Schema, Document } from 'mongoose';
import { PasswordUtils } from '@/lib/password-utils';

export interface IApprovedTrainer extends Document {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  dob: string;
  gender: string;
  address: string;
  profileImage: string;
  
  // Professional Information
  specialization: string;
  certifications: string[];
  yearsOfExperience: number;
  preferredTrainingHours: string;
  availability: string;
  pricingPlan: string;
  biography?: string;
  skills?: { name: string; level: number }[];
  
  // Emergency Contact
  emergencyName: string;
  emergencyPhone: string;
  relationship: string;
  
  // Administrative
  termsAccepted: boolean;
  submittedAt: Date;
  startDate?: Date;
  role: string;
  status: 'approved' | 'suspended' | 'pending';
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  comparePassword(password: string): Promise<boolean>;
  hashPassword(password: string): Promise<void>;
}

const ApprovedTrainerSchema: Schema = new Schema({
  // Personal Information
  firstName: { 
    type: String, 
    required: true,
    trim: true 
  },
  lastName: { 
    type: String, 
    required: true,
    trim: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true 
  },
  password: { 
    type: String, 
    required: true,
    minlength: 6 
  },
  phone: { 
    type: String, 
    required: true,
    trim: true 
  },
  dob: { 
    type: String, 
    required: true 
  },
  gender: { 
    type: String, 
    required: true 
  },
  address: { 
    type: String, 
    required: true 
  },
  profileImage: { 
    type: String, 
    required: true,
    default: null 
  },

  // Professional Information
  specialization: { 
    type: String, 
    required: true,
    trim: true 
  },
  certifications: { 
    type: [String], 
    required: true 
  },
  yearsOfExperience: { 
    type: Number, 
    required: true,
    min: 0 
  },
  preferredTrainingHours: { 
    type: String, 
    required: true 
  },
  availability: { 
    type: String, 
    required: true 
  },
  pricingPlan: { 
    type: String, 
    required: true 
  },
  biography: { 
    type: String, 
    default: "" 
  },
  skills: [
    {
      name: { 
        type: String, 
        required: true 
      },
      level: { 
        type: Number, 
        min: 0, 
        max: 100 
      },
    },
  ],

  // Emergency Contact
  emergencyName: { 
    type: String, 
    required: true 
  },
  emergencyPhone: { 
    type: String, 
    required: true 
  },
  relationship: { 
    type: String, 
    required: true 
  },

  // Administrative
  termsAccepted: { 
    type: Boolean, 
    required: true 
  },
  submittedAt: { 
    type: Date, 
    default: Date.now 
  },
  startDate: { 
    type: Date, 
    default: Date.now 
  },
  role: { 
    type: String, 
    default: "trainer" 
  },
  status: { 
    type: String, 
    enum: ["approved", "suspended", "pending"], 
    default: "pending" 
  },
}, {
  timestamps: true
});

// Pre-save middleware to hash password
ApprovedTrainerSchema.pre('save', async function(next) {
  const trainer = this as unknown as IApprovedTrainer;
  
  if (!trainer.isModified('password')) {
    return next();
  }
  
  try {
    if (!trainer.password || trainer.password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
    
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
ApprovedTrainerSchema.methods.comparePassword = async function(password: string): Promise<boolean> {
  return await PasswordUtils.comparePassword(password, this.password);
};

// Instance method to hash password manually
ApprovedTrainerSchema.methods.hashPassword = async function(password: string): Promise<void> {
  this.password = await PasswordUtils.hashPassword(password);
};

// Ensure password field is never returned in queries by default
ApprovedTrainerSchema.set('toJSON', {
  transform: function(doc, ret) {
    delete ret.password;
    return ret;
  }
});

export default mongoose.models.ApprovedTrainer || 
  mongoose.model<IApprovedTrainer>('ApprovedTrainer', ApprovedTrainerSchema);