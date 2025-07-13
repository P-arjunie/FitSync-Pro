import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import PendingMember from "@/models/pendingMember"; // Note: Case-sensitive import
import { connectToDatabase } from "@/lib/mongodb";

export async function POST(req: Request) {
  try {
    // Connect to database
    await connectToDatabase();
    console.log("✅ Connected to MongoDB");

    // Parse incoming data
    const data = await req.json();
    console.log("📥 Incoming data:", JSON.stringify(data, null, 2));

    // Destructure with defaults for optional fields
    const {
      firstName = '',
      lastName = '',
      email = '',
      password = '',
      contactNumber = '',
      dob = '',
      gender = '',
      address = '',
      currentWeight = 0,
      height = 0,
      bmi = 0,
      goalWeight = 0,
      image = '',
      emergencyContact = {
        name: '',
        relationship: '',
        phone: ''
      },
      membershipInfo = {
        plan: '',
        startDate: '',
        paymentPlan: ''
      }
    } = data;

    // Validate required fields
    if (!email || !password) {
      console.error("❌ Missing email or password");
      return NextResponse.json(
        { error: "Email and password are required" }, 
        { status: 400 }
      );
    }

    // Check for existing member
    const existingMember = await PendingMember.findOne({ email });
    if (existingMember) {
      console.error("❌ User already exists:", email);
      return NextResponse.json(
        { error: "User already exists" }, 
        { status: 409 }
      );
    }

    // Hash password (with salt rounds = 10)
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("🔑 Password hashed successfully");

    // Ensure membershipInfo has all required fields
    const completeMembershipInfo = {
      plan: membershipInfo.plan || '',
      startDate: membershipInfo.startDate || '',
      paymentPlan: membershipInfo.paymentPlan || membershipInfo.plan || 'Monthly' // Use plan as fallback or default
    };

    // Create new member document
    const newMember = new PendingMember({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      contactNumber,
      dob,
      gender,
      address,
      currentWeight: Number(currentWeight),
      height: Number(height),
      bmi: Number(bmi),
      goalWeight: Number(goalWeight),
      image,
      emergencyContact,
      membershipInfo: completeMembershipInfo, // Use the complete object
      status: "pending"
    });

    // Save to database
    const savedMember = await newMember.save();
    console.log("💾 Member saved to DB:", savedMember._id);

    // Return success response (excluding password)
    return NextResponse.json(
      { 
        message: "Registration successful",
        member: {
          id: savedMember._id,
          email: savedMember.email,
          status: savedMember.status
        }
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("❌ Registration error:", error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { error: "Validation failed", details: errors },
        { status: 400 }
      );
    }

    // Handle other errors
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}