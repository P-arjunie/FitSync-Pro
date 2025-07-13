import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Trainer from "@/models/Trainer";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    // 1. Connect to database
    await connectToDatabase();

    // 2. Parse incoming data
    const body = await req.json();
    console.log("📥 Incoming data:", JSON.stringify(body, null, 2));

    // 3. Validate required fields
    if (!body.password || !body.email || !body.firstName || !body.lastName) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Missing required fields: firstName, lastName, email, password" 
        },
        { status: 400 }
      );
    }

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

    // 5. Hash the password before creating the trainer
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(body.password, saltRounds);

    // 6. Create new trainer instance with hashed password
    const newTrainer = new Trainer({
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      password: hashedPassword, // Use hashed password
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
      emergencyContact: {
        name: body.emergencyName,
        phone: body.emergencyPhone,
        relationship: body.relationship,
      },
      termsAccepted: body.termsAccepted,
      profileImage: body.profileImage,
      biography: body.biography,
      skills: body.skills,
      status: "pending",
      submittedAt: body.submittedAt || new Date(),
    });

    // 7. Save the document
    await newTrainer.save();

    // 8. Verify password was properly hashed
    if (!hashedPassword.match(/^\$2[abxy]\$\d+\$/)) {
      console.error("Password hashing failed:", hashedPassword);
      await Trainer.deleteOne({ _id: newTrainer._id });
      throw new Error("Password hashing verification failed");
    }

    console.log("✅ Trainer created successfully with hashed password");

    // 9. Return success response (without password)
    return NextResponse.json(
      {
        success: true,
        message: "Trainer registration submitted for approval",
        trainer: {
          id: newTrainer._id,
          email: newTrainer.email,
          firstName: newTrainer.firstName,
          lastName: newTrainer.lastName,
          status: newTrainer.status,
          submittedAt: newTrainer.submittedAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("❌ Registration error:", error);

    // Handle specific error types
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { 
          success: false, 
          error: "Validation failed", 
          details: errors 
        },
        { status: 400 }
      );
    }

    if (error.code === 11000) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Email already exists" 
        },
        { status: 409 }
      );
    }

    // Handle bcrypt errors
    if (error.message.includes("bcrypt") || error.message.includes("hash")) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Password processing failed" 
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Internal server error" 
      },
      { status: 500 }
    );
  }
}

// Optional: Add a GET method to fetch pending trainers
export async function GET(req: Request) {
  try {
    await connectToDatabase();
    
    const url = new URL(req.url);
    const status = url.searchParams.get('status') || 'pending';
    
    const trainers = await Trainer.find({ status })
      .select('-password') // Exclude password from response
      .sort({ submittedAt: -1 });

    return NextResponse.json({
      success: true,
      trainers,
      count: trainers.length
    });
  } catch (error: any) {
    console.error("❌ Fetch trainers error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Failed to fetch trainers" 
      },
      { status: 500 }
    );
  }
}