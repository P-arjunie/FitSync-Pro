import { NextRequest, NextResponse } from "next/server";
import connectMongoDB from "@/lib/mongodb";
import PendingMember from "@/models/pendingMember";
import Member from "@/models/member";

export async function POST(req: NextRequest) {
  try {
    await connectMongoDB();
    const { memberId } = await req.json();

    const pendingMember = await PendingMember.findById(memberId);
    if (!pendingMember) {
      return NextResponse.json({ message: "Pending member not found" }, { status: 404 });
    }

    // Transfer data to permanent collection
    const approvedMember = new Member({
      firstName: pendingMember.firstName,
      lastName: pendingMember.lastName,
      dob: pendingMember.dob,
      gender: pendingMember.gender,
      contactNumber: pendingMember.contactNumber,
      email: pendingMember.email,
      address: pendingMember.address,
      emergencyContactName: pendingMember.emergencyContactName,
      emergencyContactRelation: pendingMember.emergencyContactRelation,
      emergencyContactNumber: pendingMember.emergencyContactNumber,
      membershipType: pendingMember.membershipType,
      preferredWorkoutTime: pendingMember.preferredWorkoutTime,
      termsAccepted: pendingMember.termsAccepted,
      image: pendingMember.image,
      userId: pendingMember.userId,
    });

    await approvedMember.save();
    await PendingMember.findByIdAndDelete(memberId);

    return NextResponse.json({ message: "Member approved successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error approving member:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
