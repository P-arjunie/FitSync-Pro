import { NextResponse } from "next/server"; // Import Next.js response utility
import { connectToDatabase } from "@/lib/mongodb"; // Import database connection function
import { NextRequest } from "next/server"; // Import Next.js request utility

import Trainer from "@/models/Trainer"; // Import the model for pending trainers
import ApprovedTrainer from "@/models/ApprovedTrainer"; // Import the model for approved trainers

// POST handler to approve a trainer using their ID from the URL parameters
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log("🔄 Starting trainer approval process...");
    await connectToDatabase();
    const { id } = await params;
    console.log(`📋 Trainer ID: ${id}`);

    // Find the pending trainer and explicitly include the password field
    const trainer = await Trainer.findById(id).select('+password');
    
    if (!trainer) {
      console.log("❌ Trainer not found in database");
      return NextResponse.json({ error: "Trainer not found" }, { status: 404 });
    }

    console.log(`✅ Found trainer: ${trainer.email}`);
    console.log("🔑 Pending trainer password (should be hash):", trainer.password);

    // Convert trainer data to proper format for ApprovedTrainer
    const trainerData = trainer.toObject();
    console.log("📊 Original trainer data:", {
      firstName: trainerData.firstName,
      lastName: trainerData.lastName,
      email: trainerData.email,
      yearsOfExperience: trainerData.yearsOfExperience,
      specialization: trainerData.specialization
    });
    
    // Convert yearsOfExperience from string to number
    let yearsOfExperience = 0;
    if (trainerData.yearsOfExperience) {
      // Extract numeric value from string like "1000+" or "5 years"
      const numericMatch = trainerData.yearsOfExperience.toString().match(/(\d+)/);
      if (numericMatch) {
        yearsOfExperience = parseInt(numericMatch[1], 10);
      }
    }
    console.log(`🔢 Converted yearsOfExperience: ${yearsOfExperience}`);

    // Create the approved trainer with properly formatted data
    const approvedTrainerData = {
      // Personal Information
      firstName: trainerData.firstName,
      lastName: trainerData.lastName,
      email: trainerData.email,
      password: trainerData.password,
      phone: trainerData.phone,
      dob: trainerData.dob,
      gender: trainerData.gender,
      address: trainerData.address,
      profileImage: trainerData.profileImage,
      
      // Professional Information
      specialization: trainerData.specialization,
      certifications: trainerData.certifications,
      yearsOfExperience: yearsOfExperience, // Converted to number
      preferredTrainingHours: trainerData.preferredTrainingHours,
      availability: trainerData.availability,
      pricingPlan: trainerData.pricingPlan,
      biography: trainerData.biography || "",
      skills: trainerData.skills || [],
      
      // Emergency Contact (as nested object)
      emergencyContact: {
        name: trainerData.emergencyContact?.name || "",
        phone: trainerData.emergencyContact?.phone || "",
      relationship: trainerData.emergencyContact?.relationship || "",
      },
      
      // Administrative
      termsAccepted: trainerData.termsAccepted,
      submittedAt: trainerData.submittedAt,
      role: "trainer",
      status: "approved",
      startDate: new Date()
    };

    console.log("🔑 Approved trainer password (should match pending):", approvedTrainerData.password);
    console.log("📝 Creating approved trainer with data:", {
      firstName: approvedTrainerData.firstName,
      lastName: approvedTrainerData.lastName,
      email: approvedTrainerData.email,
      yearsOfExperience: approvedTrainerData.yearsOfExperience,
      role: approvedTrainerData.role,
      status: approvedTrainerData.status
    });

    const approvedTrainer = await ApprovedTrainer.collection.insertOne(approvedTrainerData);
    console.log(`✅ Approved trainer created with ID: ${approvedTrainer.insertedId}`);

    // Log all approved trainers with this email
    const approvedWithEmail = await ApprovedTrainer.find({ email: trainer.email });
    console.log("📋 All approved trainers with this email:");
    approvedWithEmail.forEach(t => console.log(`ID: ${t._id}, Hash: ${t.password}`));

    // Delete the pending trainer
    await trainer.deleteOne();
    console.log(`🗑️ Deleted pending trainer: ${trainer.email}`);

    console.log(`✅ Trainer approved: ${trainer.email}`);
    return NextResponse.json({ 
      message: "Trainer approved",
      trainerId: approvedTrainer.insertedId
    });
  } catch (error) {
    console.error("❌ Error approving trainer:", error);
    return NextResponse.json({
      error: "Error approving trainer",
      details: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}

