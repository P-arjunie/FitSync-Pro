<<<<<<< Updated upstream
import { NextResponse } from "next/server"; // Import utility to send Next.js server responses
import { connectToDatabase } from "@/lib/mongodb"; // Import function to establish MongoDB connection
import Trainer from "@/models/Trainer"; // Import Mongoose model for trainer data
=======
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Trainer from "@/models/Trainer";
import bcrypt from "bcryptjs";
>>>>>>> Stashed changes

// Handle POST request to register a new trainer
export async function POST(req: Request) {
  try {
    // Connect to MongoDB
    await connectToDatabase();

    // Parse the incoming request body as JSON
    const body = await req.json();
<<<<<<< Updated upstream
=======
    console.log("📥 Incoming data:", JSON.stringify(body, null, 2));
    console.log("🔑 Raw password received for registration:", body.password);
>>>>>>> Stashed changes

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

<<<<<<< Updated upstream
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
=======
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
    // (Let the Trainer model pre-save hook handle hashing)
    // const saltRounds = 12;
    // const hashedPassword = await bcrypt.hash(body.password, saltRounds);
    // console.log("🔑 Hashed password:", hashedPassword);

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

    // Log all pending trainers with this email (include password field)
    const trainersWithEmail = await Trainer.find({ email: body.email }).select('+password');
    console.log("📋 All pending trainers with this email:");
    trainersWithEmail.forEach(t => console.log(`ID: ${t._id}, Hash: ${t.password}`));

    // 8. Verify password was properly hashed
    // if (!hashedPassword.match(/^\$2[abxy]\$\d+\$/)) {
    //   console.error("Password hashing failed:", hashedPassword);
    //   await Trainer.deleteOne({ _id: newTrainer._id });
    //   throw new Error("Password hashing verification failed");
    // }

    console.log("✅ Trainer created successfully with hashed password");

    // 9. Return success response (without password)
>>>>>>> Stashed changes
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
