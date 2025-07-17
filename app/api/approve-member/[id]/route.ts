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
    const pending = await PendingMember.findById(id);

    // If no pending member is found, return a 404 response
    if (!pending) {
      console.log("❌ Member not found in database");
      return NextResponse.json({ message: "Member not found" }, { status: 404 });
    }

<<<<<<< Updated upstream
    // Convert the pending member document to a plain object and create a new approved member
    const approvedMember = new Member(pending.toObject());

    // Save the new approved member to the Member collection
=======
    console.log(`✅ Found pending member: ${pending.email}`);

    // Check if member with this email already exists in approved members
    const existingMember = await Member.findOne({ email: pending.email });
    if (existingMember) {
      console.log("❌ Member already exists in approved collection");
      return NextResponse.json({ message: "Member already exists in approved collection" }, { status: 409 });
    }

    // Create approved member with all required fields
    const approvedMemberData = {
      firstName: pending.firstName,
      lastName: pending.lastName,
      email: pending.email,
      password: pending.password, // Transfer the hashed password
      contactNumber: pending.contactNumber,
      dob: pending.dob,
      gender: pending.gender,
      nic: pending.nic || "", // Handle if NIC is not in pending schema
      address: pending.address,
      emergencyContact: {
        name: pending.emergencyContact?.name || "",
        relationship: pending.emergencyContact?.relationship || "",
        phone: pending.emergencyContact?.phone || "",
      },
      membershipInfo: {
        plan: pending.membershipInfo?.plan || "",
        startDate: pending.membershipInfo?.startDate || "",
        paymentPlan: pending.membershipInfo?.paymentPlan || "",
      },
      image: pending.image,
      currentWeight: pending.currentWeight,
      height: pending.height,
      bmi: pending.bmi,
      goalWeight: pending.goalWeight,
      status: "approved", // Set status to approved
      role: "member", // Ensure role is set
    };

    console.log("📝 Creating approved member with data:", {
      firstName: approvedMemberData.firstName,
      lastName: approvedMemberData.lastName,
      email: approvedMemberData.email,
      role: approvedMemberData.role,
      status: approvedMemberData.status
    });

    // Create and save the new approved member
    const approvedMember = new Member(approvedMemberData);
>>>>>>> Stashed changes
    await approvedMember.save();
    console.log(`✅ Approved member created with ID: ${approvedMember._id}`);

    // Remove the pending member from the PendingMember collection
    await PendingMember.findByIdAndDelete(id);
    console.log(`🗑️ Deleted pending member: ${pending.email}`);

    // Return a success response
    return NextResponse.json({ message: "Member approved" });
  } catch (error) {
    // Handle any errors and return a 500 error response
    return NextResponse.json({ message: "Error approving member", error }, { status: 500 });
  }
}

