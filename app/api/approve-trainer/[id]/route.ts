import { NextResponse } from "next/server"; // Import Next.js response utility
import { connectToDatabase } from "@/lib/mongodb"; // Import database connection function

import Trainer from "@/models/Trainer"; // Import the model for pending trainers
import ApprovedTrainer from "@/models/ApprovedTrainer"; // Import the model for approved trainers

// POST handler to approve a trainer using their ID from the URL parameters
export async function POST(_: Request, { params }: { params: { id: string } }) {
  // Connect to the MongoDB database
  await connectToDatabase();

  // Find the pending trainer in the Trainer collection using the ID
  const trainer = await Trainer.findById(params.id);
  
  // If the trainer is not found, return a 404 response
  if (!trainer) {
    return NextResponse.json({ error: "Trainer not found" }, { status: 404 });
  }

  // Destructure all relevant fields from the pending trainer document
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

  // Create a new document in the ApprovedTrainer collection with the same data
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

  // Delete the trainer from the pending Trainer collection
  await trainer.deleteOne();

  // Return a success message indicating the trainer has been approved
  return NextResponse.json({ message: "Trainer approved" });
}

