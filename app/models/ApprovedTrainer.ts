import mongoose from "mongoose";

const approvedTrainerSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  profileImage: String,
  specialization: String,
  certifications: String,
  experience: String,
  pricingPlan: String,
});

export default mongoose.models.ApprovedTrainer ||
  mongoose.model("ApprovedTrainer", approvedTrainerSchema);
