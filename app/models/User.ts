import mongoose, { Schema, Document, models } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "member" | "trainer"|"admin";
  profileImage?: string;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["member", "trainer","admin"], required: true },
    profileImage: { type: String },
  },
  { timestamps: true }
);

// ✅ This avoids re-compiling the model on hot reload
const User = models.User || mongoose.model<IUser>("User", UserSchema);

export default User;

