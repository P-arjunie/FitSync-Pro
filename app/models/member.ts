import mongoose, { Schema, Document, models, model } from "mongoose";
import { PasswordUtils } from '@/lib/password-utils';

export interface IMember extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string; // Add password field
  dob: string;
  gender: string;
  address: string;
  contactNumber: string;
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
  status: {
    type: String;
    enum: ["pending", "approved", "suspended"];
    default: "approved";
  };
  role: string;
}



const memberSchema: Schema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true }, // Add unique constraint
    password: { type: String, required: true }, // Add password field
    dob: String,
    gender: String,
    address: String,
    contactNumber: String,
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
      enum: ["pending", "approved", "suspended"],
      default: "approved",
    },
    role: {
      type: String,
      default: "member",
    },
  },
  { timestamps: true }
);

const Member = models.Member || model<IMember>("Member", memberSchema);
export default Member;