import { NextRequest, NextResponse } from "next/server";
import connectMongoDB from "@/lib/mongodb";
import PendingMember from "@/models/pendingMember";

export async function POST(req: NextRequest) {
  try {
    await connectMongoDB();
    const body = await req.json();

    const {
      firstName,
      lastName,
      dob,
      gender,
      contactNumber,
      email,
      address,
      emergencyContactName,
      emergencyContactRelation,
      emergencyContactNumber,
      membershipType,
      preferredWorkoutTime,
      termsAccepted,
      image,
      userId,
    } = body;

    // Basic validation
    if (!firstName || !lastName || !email || !image || !termsAccepted) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const newMember = await PendingMember.create({
      firstName,
      lastName,
      dob,
      gender,
      contactNumber,
      email,
      address,
      emergencyContactName,
      emergencyContactRelation,
      emergencyContactNumber,
      membershipType,
      preferredWorkoutTime,
      termsAccepted,
      image,
      role: "member",
      userId,
    });

    return NextResponse.json({ message: "Member registration submitted", member: newMember }, { status: 201 });
  } catch (error) {
    console.error("Error in member register:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
