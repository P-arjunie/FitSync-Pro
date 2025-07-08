import { NextRequest, NextResponse } from "next/server"; // Import types for request and response from Next.js
import { connectToDatabase } from "@/lib/mongodb"; // Import function to connect to MongoDB

import PendingMember from "@/models/pendingMember"; // Import the PendingMember model
import Member from "@/models/member"; // Import the Member model

// POST handler to approve a pending member using their ID
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Establish connection to the MongoDB database
    await connectToDatabase();

    // Find the pending member using the provided ID from the route parameters
    const pending = await PendingMember.findById(params.id);

    // If no pending member is found, return a 404 response
    if (!pending) {
      return NextResponse.json({ message: "Member not found" }, { status: 404 });
    }

    // Convert the pending member document to a plain object and create a new approved member
    const approvedMember = new Member(pending.toObject());

    // Save the new approved member to the Member collection
    await approvedMember.save();

    // Remove the pending member from the PendingMember collection
    await PendingMember.findByIdAndDelete(params.id);

    // Return a success response
    return NextResponse.json({ message: "Member approved" });
  } catch (error) {
    // Handle any errors and return a 500 error response
    return NextResponse.json({ message: "Error approving member", error }, { status: 500 });
  }
}

