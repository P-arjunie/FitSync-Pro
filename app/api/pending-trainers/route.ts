import { NextResponse } from "next/server"; // Import utility to send Next.js server responses
import { connectToDatabase } from "@/lib/mongodb"; // Import function to establish MongoDB connection
import Trainer from "@/models/Trainer"; // Import Mongoose model for trainer data
import bcrypt from "bcryptjs";

// Handle POST request to register a new trainer
export async function POST(req: Request) {
  try {
    // Connect to MongoDB
    await connectToDatabase();

    // Parse the incoming request body as JSON
    const body = await req.json();
    console.log("📥 Incoming data:", JSON.stringify(body, null, 2));
    console.log("🔑 Raw password received for registration:", body.password);

    // 4. Check if trainer already exists
    const existingTrainer = await Trainer.findOne({ email: body.email });
    if (existingTrainer) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Trainer with this email already exists" 
        },
        { status: 409 }
      );
    }

    // 6. Create new trainer instance with plain password (pre-save hook will hash it)
    const newTrainer = new Trainer({
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      password: body.password, // Pass plain password
      phone: body.phone,
      dob: body.dob,
      gender: body.gender,
      address: body.address,
      specialization: body.specialization,
      certifications: Array.isArray(body.certifications)
        ? body.certifications
        : [body.certifications],
      preferredTrainingHours: body.preferredTrainingHours,
      yearsOfExperience: body.yearsOfExperience,
      availability: body.availability,
      pricingPlan: body.pricingPlan,
      classes: body.classes, // Add this
      emergencyContact: body.emergencyContact,
      termsAccepted: body.termsAccepted,
      profileImage: body.profileImage,
      biography: body.biography,
      skills: body.skills,
      status: "pending",
      submittedAt: body.submittedAt || new Date(),
    });

    // 7. Save the document
    await newTrainer.save();

    // Log all pending trainers with this email (include password field)
    const trainersWithEmail = await Trainer.find({ email: body.email }).select('+password');
    console.log("📋 All pending trainers with this email:");
    trainersWithEmail.forEach(t => console.log(`ID: ${t._id}, Hash: ${t.password}`));

    console.log("✅ Trainer created successfully with hashed password");

    // 9. Return success response (without password)
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
