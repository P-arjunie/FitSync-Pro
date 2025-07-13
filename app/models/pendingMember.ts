// models/PendingMember.ts
import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IPendingMember extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  contactNumber: string;
  dob: string;
  gender: string;
  address: string;
  currentWeight: number;
  height: number;
  bmi: number;
  goalWeight: number;
  image: string;
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
  status: string;
  role: string;
}

const pendingMemberSchema: Schema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { 
      type: String, 
      required: true, 
      unique: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please use a valid email address']
    },
    password: { type: String, required: true },
    contactNumber: { type: String, required: true },
    dob: { type: String, required: true },
    gender: { type: String, required: true },
    address: { type: String, required: true },
    currentWeight: { type: Number, required: true },
    height: { type: Number, required: true },
    bmi: { type: Number, required: true },
    goalWeight: { type: Number, required: true },
    image: { type: String, required: true },
    emergencyContact: {
      name: { type: String, required: true },
      relationship: { type: String, required: true },
      phone: { type: String, required: true },
    },
    membershipInfo: {
      plan: { type: String, required: true },
      startDate: { type: String, required: true },
      paymentPlan: { type: String, required: true },
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    role: {
      type: String,
      default: "member",
    },
  },
  { 
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        delete ret.password; // Never return password in JSON responses
        return ret;
      }
    }
  }
);

const PendingMember = models.PendingMember || model<IPendingMember>("PendingMember", pendingMemberSchema);

export default PendingMember;