import { NextRequest, NextResponse } from "next/server"; // Import request and response types from Next.js
import { connectToDatabase } from "@/lib/mongodb"; // Import MongoDB connection utility
import PendingMember from "@/models/pendingMember"; // Import the model for pending members
import Member from "@/models/member"; // Import the model for approved members

// Define the POST route handler for approving a pending member
export async function POST(req: NextRequest) {
  try {
    // Connect to MongoDB
    await connectToDatabase();

    // Parse the request body to extract the memberId
    const { memberId } = await req.json();

    // Find the pending member by ID
    const pendingMember = await PendingMember.findById(memberId);
    if (!pendingMember) {
      // If not found, return a 404 response
      return NextResponse.json({ message: "Pending member not found" }, { status: 404 });
    }

    // Create a new approved member document using data from the pending member
    const approvedMember = new Member({
      firstName: pendingMember.firstName,
      lastName: pendingMember.lastName,
      dob: pendingMember.dob,
      gender: pendingMember.gender,
      contactNumber: pendingMember.contactNumber,
      email: pendingMember.email,
      currentWeight: pendingMember.currentWeight,
      height: pendingMember.height,
      bmi: pendingMember.bmi,
      goalWeight: pendingMember.goalWeight,
      address: pendingMember.address,
      emergencyContactName: pendingMember.emergencyContactName,
      emergencyContactRelation: pendingMember.emergencyContactRelation,
      emergencyContactNumber: pendingMember.emergencyContactNumber,
      membershipType: pendingMember.membershipType,
      preferredWorkoutTime: pendingMember.preferredWorkoutTime,
      termsAccepted: pendingMember.termsAccepted,
      image: pendingMember.image,
      userId: pendingMember.userId,
      status: "approved", // Set the status to approved
    });

    // Save the approved member to the permanent collection
    await approvedMember.save();

    // Delete the member from the pending collection
    await PendingMember.findByIdAndDelete(memberId);

    // Return success response
    return NextResponse.json({ message: "Member approved successfully" }, { status: 200 });
  } catch (error) {
    // Log and return error response
    console.error("Error approving member:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
