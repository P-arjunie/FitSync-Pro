import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IPendingMember extends Document {
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
    plan: string;
    startDate: string;
    paymentPlan: string;
  };
  image: string;
  currentWeight: number;
  height: number;
  bmi: number;
  goalWeight: number;
  status: string;
  role: string;
  password: string;
}


const pendingMemberSchema: Schema = new Schema(
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
      plan: String,
      startDate: String,
      paymentPlan: String,
    },
    image: String,
    currentWeight: Number,
    height: Number,
    bmi: Number,
    goalWeight: Number,
    status: {
      type: String,
      default: "pending",
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
pendingMemberSchema.pre('save', async function(next) {
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
      return next();
    }
    const bcryptjs = require('bcryptjs');
    member.password = await bcryptjs.hash(member.password, 12);
    next();
  } catch (error) {
    next(error as any);
  }
});


const PendingMember = models.PendingMember || model<IPendingMember>("PendingMember", pendingMemberSchema);
export default PendingMember;

