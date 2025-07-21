import { NextRequest, NextResponse } from "next/server"; // Import types for request and response from Next.js
import { connectToDatabase } from "@/lib/mongodb"; // Import function to connect to MongoDB

import PendingMember from "@/models/pendingMember"; // Import the PendingMember model
import Member from "@/models/member"; // Import the Member model

// POST handler to approve a pending member using their ID
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    console.log("🔄 Starting member approval process...");
    // Establish connection to the MongoDB database
    await connectToDatabase();

    // Await the params to get the ID
    const { id } = await params;
    console.log(`📋 Member ID: ${id}`);

    // Find the pending member using the provided ID from the route parameters
    const pending = await PendingMember.findById(id).select('+password');

    // If no pending member is found, return a 404 response
    if (!pending) {
      console.log("❌ Member not found in database");
      return NextResponse.json({ message: "Pending member not found" }, { status: 404 });
    }

    console.log(`✅ Found pending member: ${pending.email}`);

    // Check if member with this email already exists in approved members
    const existingMember = await Member.findOne({ email: pending.email });
    if (existingMember) {
      console.log("❌ Member already exists in approved collection");
      return NextResponse.json({ message: "Member already exists in approved collection" }, { status: 409 });
    }

    // Copy all required fields from pending member
    const approvedMemberData = {
      firstName: pending.firstName,
      lastName: pending.lastName,
      email: pending.email,
      password: pending.password,
      contactNumber: pending.contactNumber,
      dob: pending.dob,
      gender: pending.gender,
      address: pending.address,
      emergencyContact: pending.emergencyContact,
      membershipInfo: pending.membershipInfo,
      image: pending.image,
      currentWeight: pending.currentWeight,
      height: pending.height,
      bmi: pending.bmi,
      goalWeight: pending.goalWeight,
      termsAccepted: pending.termsAccepted !== undefined ? pending.termsAccepted : true,
      role: "member",
      status: "approved"
    };

    // Log the full data object
    console.log("📝 Creating approved member with data:", approvedMemberData);

    // Create the approved member with error handling
    let approvedMember;
    try {
      // Use insertOne to avoid pre-save middleware that would double-hash the password
      const result = await Member.collection.insertOne(approvedMemberData);
      approvedMember = { _id: result.insertedId, ...approvedMemberData };
      console.log("✅ Approved member created with ID:", approvedMember._id);
      // Log the collection name
      console.log("Member model collection name:", Member.collection.name);
      // Log all members in the collection
      const allMembers = await Member.find({});
      console.log("All members in collection after creation:", allMembers);
    } catch (err) {
      console.error("❌ Error creating approved member:", err);
      return NextResponse.json({ message: "Error creating approved member", error: err instanceof Error ? err.message : err }, { status: 500 });
    }

    // Delete the pending member
    await PendingMember.findByIdAndDelete(id);
    console.log("🗑️ Deleted pending member:", pending.email);

    return NextResponse.json({ message: "Member approved", memberId: approvedMember._id });
  } catch (error) {
    // Handle any errors and return a 500 error response
    console.error('❌ Error approving member:', error);
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
      if ((error as any).errors) {
        // If it's a Mongoose validation error, include details
        errorMessage += ' | Validation errors: ' + JSON.stringify((error as any).errors);
      }
    }
    return NextResponse.json({ message: "Error approving member", error: errorMessage }, { status: 500 });
  }
}

