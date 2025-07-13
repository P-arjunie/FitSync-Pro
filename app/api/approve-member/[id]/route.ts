import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import PendingMember from "@/models/pendingMember";
import Member from "@/models/member";

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

    // Check if member with this email already exists in approved members
    const existingMember = await Member.findOne({ email: pending.email });
    if (existingMember) {
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

    // Create and save the new approved member
    const approvedMember = new Member(approvedMemberData);
    await approvedMember.save();

    // Remove the pending member from the PendingMember collection
    await PendingMember.findByIdAndDelete(params.id);

    console.log(`✅ Member approved: ${pending.email}`);

    // Return a success response
    return NextResponse.json({ 
      message: "Member approved successfully",
      member: {
        id: approvedMember._id,
        email: approvedMember.email,
        name: `${approvedMember.firstName} ${approvedMember.lastName}`
      }
    });
  } catch (error) {
    console.error("❌ Error approving member:", error);
    // Handle any errors and return a 500 error response
    return NextResponse.json({ 
      message: "Error approving member", 
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}