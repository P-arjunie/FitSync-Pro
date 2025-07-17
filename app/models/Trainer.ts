import mongoose, { Schema, Document } from "mongoose";

export interface ITrainer extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string;
  gender: string;
  address: string;
  specialization: string;

  certifications: string[]; // Changed to an array of strings

  preferredTrainingHours: string;
  yearsOfExperience: string;
  availability: string;
  pricingPlan: string;
  emergencyName: string;
  emergencyPhone: string;
  relationship: string;
  startDate?: Date;
  termsAccepted: boolean;
  profileImage: string;
  status: "pending" | "approved";
  submittedAt: Date;


  biography: string;
  skills: { name: string; level: number }[];

}

const TrainerSchema = new Schema<ITrainer>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  dob: { type: String, required: true },
  gender: { type: String, required: true },
  address: { type: String, required: true },
  specialization: { type: String, required: true },

  certifications: { type: [String], required: true }, // Changed to array of strings

  preferredTrainingHours: { type: String, required: true },
  yearsOfExperience: { type: String, required: true },
  availability: { type: String, required: true },
  pricingPlan: { type: String, required: true },
  emergencyName: { type: String, required: true },
  emergencyPhone: { type: String, required: true },
  relationship: { type: String, required: true },
  startDate: { type: Date },
  termsAccepted: { type: Boolean, required: true },
  profileImage: { type: String, required: true },
  status: { type: String, enum: ["pending", "approved"], default: "pending" },
  submittedAt: { type: Date, default: Date.now },


  biography: { type: String, default: "" },
  skills: [
    {
      name: { type: String, required: true },

      level: { type: Number, min: 0, max: 100 }, // Added min/max validation

    },
  ],
});

<<<<<<< Updated upstream
export default mongoose.models.Trainer || mongoose.model<ITrainer>("Trainer", TrainerSchema);
=======
trainerSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  
  try {
    const salt = await bcrypt.genSalt(12); // Use 12 rounds for consistency
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
>>>>>>> Stashed changes
