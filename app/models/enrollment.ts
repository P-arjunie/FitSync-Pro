// app/models/enrollment.ts
import mongoose from "mongoose";

const EnrollmentSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  className: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  status: { type: String, default: "pending" },
  createdAt: Date,
  updatedAt: Date,
});

export default mongoose.models.Enrollment || mongoose.model("Enrollment", EnrollmentSchema);
