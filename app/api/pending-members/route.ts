import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb"; // ✅ Correct for named export

import PendingMember from "@/models/pendingMember";

export async function GET() {
  try {
    await connectToDatabase();

    const pendingMembers = await PendingMember.find().select("firstName lastName image role");
    return NextResponse.json(pendingMembers);
  } catch (error) {
    return NextResponse.json(
      { message: "Error fetching pending members", error },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      userId,
      firstName,
      lastName,
      email,
      nic,
      gender,
      dob,
      contactNumber,
      address,
      emergencyContact,
      membershipPlan,
      profileImage,
      currentWeight,
      height,
      bmi,
      goalWeight,
    } = body;
    

    await connectToDatabase();


    const newPendingMember = new PendingMember({
      userId,
      firstName,
      lastName,
      email,
      nic,
      gender,
      dob,
      contactNumber,
      address,
      emergencyContact,
      membershipPlan,
      image: profileImage,
      status: "pending",
      role: "member",
      createdAt: new Date(),
      currentWeight,
      height,
      bmi,
      goalWeight,
    });
    

    await newPendingMember.save();

    return NextResponse.json({ success: true, insertedId: newPendingMember._id });
  } catch (error) {
    console.error("Error registering member:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
