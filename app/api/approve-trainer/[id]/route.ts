import { NextResponse } from "next/server";
import connectMongoDB from "@/lib/mongodb";
import Trainer from "@/models/Trainer";
import ApprovedTrainer from "@/models/ApprovedTrainer";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  await connectMongoDB();
  
  const trainer = await Trainer.findById(params.id);
  if (!trainer) {
    return NextResponse.json({ error: "Trainer not found" }, { status: 404 });
  }

  const {
    firstName,
    lastName,
    email,
    phone,
    dob,
    gender,
    address,
    specialization,
    certifications,
    preferredTrainingHours,
    yearsOfExperience,
    availability,
    pricingPlan,
    emergencyName,
    emergencyPhone,
    relationship,
    startDate,
    termsAccepted,
    profileImage,
    submittedAt,
    biography,
    skills,
  } = trainer;

  await ApprovedTrainer.create({
    firstName,
    lastName,
    email,
    phone,
    dob,
    gender,
    address,
    specialization,
    certifications,
    preferredTrainingHours,
    yearsOfExperience,
    availability,
    pricingPlan,
    emergencyName,
    emergencyPhone,
    relationship,
    startDate,
    termsAccepted,
    profileImage,
    submittedAt,
    biography,
    skills,
  });

  await trainer.deleteOne();

  return NextResponse.json({ message: "Trainer approved" });
}
