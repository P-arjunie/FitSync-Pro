import { Schema, model, models } from "mongoose";
import bcrypt from "bcryptjs";

const trainerSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { 
    type: String, 
    required: true,
    unique: true,
    match: [/.+\@.+\..+/, "Please use a valid email address"]
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  phone: { type: String, required: true },
  dob: { type: Date, required: true },
  gender: { type: String, required: true },
  address: { type: String, required: true },
  specialization: { type: String, required: true },
  certifications: { type: [String], required: true },
  preferredTrainingHours: { type: String, required: true },
  yearsOfExperience: { type: String, required: true },
  availability: { type: String, required: true },
  pricingPlan: { type: String, required: true },
  emergencyContact: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    relationship: { type: String, required: true }
  },
  termsAccepted: { type: Boolean, required: true, default: false },
  biography: { type: String, required: true },
  skills: [{
    name: { type: String, required: true },
    level: { type: Number, required: true, min: 1, max: 5 }
  }],
  profileImage: { type: String, required: true },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },
  submittedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

trainerSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(this.password, salt);
    this.password = hash;
    next();
  } catch (err) {
    console.error("Hashing failed:", err);
    next(new Error("Password hashing failed"));
  }
});

// Critical Change 2: Force model recompilation
delete models.Trainer;
const Trainer = model("Trainer", trainerSchema);

export default Trainer;