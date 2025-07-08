import { NextResponse } from "next/server"; // Import utility to send Next.js server responses
import { connectToDatabase } from "@/lib/mongodb"; // Import function to establish MongoDB connection
import Trainer from "@/models/Trainer"; // Import Mongoose model for trainer data

// Handle POST request to register a new trainer
export async function POST(req: Request) {
  try {
    // Connect to MongoDB
    await connectToDatabase();

    // Parse the incoming request body as JSON
    const body = await req.json();

    // Destructure trainer registration fields from the request body
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
      biography,
      skills,
    } = body;

    // Create a new trainer document using the provided data
    const newTrainer = await Trainer.create({
      firstName,
      lastName,
      email,
      phone,
      dob,
      gender,
      address,
      specialization,
      certifications: Array.isArray(certifications) ? certifications : [certifications], // Ensure certifications is an array
      preferredTrainingHours,
      yearsOfExperience,
      availability,
      pricingPlan,
      emergencyName,
      emergencyPhone,
      relationship,
      startDate: startDate || null, // Set to null if not provided
      termsAccepted,
      profileImage,
      biography: biography || "", // Default to empty string if not provided
      skills: skills || [], // Default to empty array if not provided
      status: "pending", // Set status to pending for approval workflow
    });

    // Return a success response with the newly created trainer
    return NextResponse.json({ success: true, trainer: newTrainer });
  } catch (error) {
    // Log the error and return a 500 error response
    console.error("Trainer registration error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
