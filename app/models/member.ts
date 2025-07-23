import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IMember extends Document {
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  nic: string;
  address: string;
  contactNumber: string;
  email: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  membershipInfo: {
    startDate: string;
  };
  image: string;
  currentWeight: number;
  height: number;
  bmi: number;
  goalWeight: number;
  status: {
      type: String,
      enum:["pending","approved",'suspended'],
      default: "approved",
    },
  role: string;
  password: string;
}


const memberSchema: Schema = new Schema(
  {
    firstName: String,
    lastName: String,
    dob: String,
    gender: String,
    nic: String,
    address: String,
    contactNumber: String,
    email: String,
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
    },
    membershipInfo: {
      startDate: String,
    },
    image: String,
    currentWeight: Number,
    height: Number,
    bmi: Number,
    goalWeight: Number,
    status: {
      type: String,
      enum:["pending","approved",'suspended'],
      default: "approved",
    },
    role: {
      type: String,
      default: "member",
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
  },
  { timestamps: true }
);

// Pre-save middleware to hash password
memberSchema.pre('save', async function(next) {
  const member = this as any;
  if (!member.isModified('password')) {
    return next();
  }
  try {
    if (!member.password || member.password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
    // Only hash if not already a bcrypt hash (any salt rounds)
    const bcryptRegex = /^\$2[abxy]?\$\d{2}\$[./A-Za-z0-9]{53}$/;
    if (bcryptRegex.test(member.password)) {
      console.log('[Member pre-save] Password already a bcrypt hash, skipping hash.');
      return next();
    }
    console.log('[Member pre-save] Hashing password.');
    // Use bcryptjs for hashing
    const bcryptjs = require('bcryptjs');
    member.password = await bcryptjs.hash(member.password, 12);
    next();
  } catch (error) {
    next(error as any);
  }
});

// Instance method to compare password
memberSchema.methods.comparePassword = async function(password: string): Promise<boolean> {
  const bcryptjs = require('bcryptjs');
  return await bcryptjs.compare(password, this.password);
};

// Ensure password field is never returned in queries by default
memberSchema.set('toJSON', {
  transform: function(doc, ret) {
    delete ret.password;
    return ret;
  }
});

const Member = models.Member || model<IMember>("Member", memberSchema);
export default Member;



