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
      enum:["pending","approved"],
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



