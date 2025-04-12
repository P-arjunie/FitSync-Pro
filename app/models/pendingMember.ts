import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IPendingMember extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string;
  dob: string;
  address: string;
  image: string;
  emergencyContact: {
    name: string;
    phone: string;
  };
  membershipInfo: {
    plan: string;
    startDate: string;
  };
  role: "member";
}

const pendingMemberSchema = new Schema<IPendingMember>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  gender: { type: String, required: true },
  dob: { type: String, required: true },
  address: { type: String, required: true },
  image: { type: String, required: true },
  emergencyContact: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
  },
  membershipInfo: {
    plan: { type: String, required: true },
    startDate: { type: String, required: true },
  },
  role: {
    type: String,
    enum: ["member"],
    default: "member",
  },
});

const PendingMember =
  models.PendingMember || model<IPendingMember>("PendingMember", pendingMemberSchema);

export default PendingMember;
