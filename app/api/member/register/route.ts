import { connectToDatabase } from "@/lib/mongodb"; // Import function to connect to MongoDB
import PendingMember from "@/models/pendingMember"; // Import Mongoose model for storing pending member registrations
import { NextResponse } from "next/server"; // Import Next.js response utility

// Defines a POST handler for new member registrations
export async function POST(req: Request) {
  try {
    // Establish a connection to the MongoDB database
    await connectToDatabase();

    // Parse the incoming JSON body from the request
    const body = await req.json();
    console.log("📦 Incoming Member Registration Body:", body); // Log the received data

    // Destructure required fields from the request body
    const {
      firstName,
      lastName,
      dob,
      gender,
      nic,
      contactNumber,
      email,
      address,
      emergencyContact,
      membershipInfo,
      image,
      currentWeight,
      height,
      bmi,
      goalWeight,
      termsAccepted,
      password
    } = body;

    // Validate presence of all required fields including nested emergency contact and membership info
    if (
      !firstName || !lastName || !dob || !gender || !contactNumber || !email || !address ||
      !emergencyContact?.name || !emergencyContact?.phone || !emergencyContact?.relationship ||
      !membershipInfo?.plan || !membershipInfo?.startDate || !membershipInfo?.paymentPlan ||
      !termsAccepted || !image ||
      currentWeight === undefined || height === undefined || bmi === undefined || goalWeight === undefined
    ) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // Double-check if emergency contact phone number is provided
    if (!emergencyContact?.phone) {
      return NextResponse.json({ message: "Emergency contact phone is required" }, { status: 400 });
    }

    // Create a new pending member document in the database with status "pending"
    await PendingMember.create({
      firstName,
      lastName,
      dob,
      gender,
      nic,
      contactNumber,
      email,
      address,
      image,
      emergencyContact,
      membershipInfo, // paymentPlan will be included here
      currentWeight,
      height,
      bmi,
      goalWeight,
      termsAccepted, // Confirm that the terms checkbox was accepted
      role: "member", // Default role is set to "member"
      status: "pending", // Status indicates admin approval is still required
      password
    });

    // Respond with a success message and 201 Created status
    return NextResponse.json(
      { message: "Member registration submitted successfully!" },
      { status: 201 }
    );
  } catch (error) {
    // Log unexpected errors and return a 500 Internal Server Error response
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
