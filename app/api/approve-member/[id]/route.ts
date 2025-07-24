import { NextRequest, NextResponse } from "next/server"; // Import types for request and response from Next.js
import { connectToDatabase } from "@/lib/mongodb"; // Import function to connect to MongoDB

import PendingMember from "@/models/pendingMember"; // Import the PendingMember model
import Member from "@/models/member"; // Import the Member model
import { sendEmail } from '@/lib/sendEmail';
import dedent from 'dedent';

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

    try {
      await sendEmail({
        to: approvedMemberData.email,
        subject: '✅ Your FitSync Pro Membership Approved',
        html: dedent`
          <div style="background:#e53935;padding:24px 0 0 0;text-align:center;border-radius:8px 8px 0 0;">
            <h1 style="color:#fff;margin:0;font-size:2rem;font-family:sans-serif;">FitSync Pro</h1>
          </div>
          <div style="background:#fff;padding:32px 32px 24px 32px;border-radius:0 0 8px 8px;font-family:sans-serif;max-width:600px;margin:auto;">
            <h2 style="color:#e53935;margin-top:0;">Welcome to FitSync Pro!</h2>
            <p>Dear ${approvedMemberData.firstName},</p>
            <p>Your membership has been <b>approved</b> by our admin team. You can now log in and start your fitness journey with us!</p>
            <ul style="padding-left:20px;text-align:left;">
              <li><b>Email:</b> ${approvedMemberData.email}</li>
            </ul>
            <p>If you have any questions, reply to this email or contact our support team.</p>
            <br/>
            <p>Thank you,<br/>FitSync Pro Team</p>
          </div>
        `
      });
    } catch (err) {
      console.error('Failed to send approval email to member:', err);
    }

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

