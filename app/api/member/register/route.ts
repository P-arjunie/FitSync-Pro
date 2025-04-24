import connectMongoDB from "@/lib/mongodb";
import PendingMember from "@/models/pendingMember";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await connectMongoDB();
    const body = await req.json();
    console.log("📦 Incoming Member Registration Body:", body);

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
    } = body;

    // Validate required fields
    if (
      !firstName || !lastName || !dob || !gender || !contactNumber || !email || !address ||
      !emergencyContact?.name || !emergencyContact?.phone || !emergencyContact?.relationship ||
      !membershipInfo?.plan || !membershipInfo?.startDate ||
      !termsAccepted || !image ||
      currentWeight === undefined || height === undefined || bmi === undefined || goalWeight === undefined
    ) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // Ensure the emergency contact phone is provided
    if (!emergencyContact?.phone) {
      return NextResponse.json({ message: "Emergency contact phone is required" }, { status: 400 });
    }

    // Create the pending member record
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
      membershipInfo,
      currentWeight,
      height,
      bmi,
      goalWeight,
      termsAccepted, // Make sure this is correctly passed and validated
      role: "member",
      status: "pending",
    });

    return NextResponse.json(
      { message: "Member registration submitted successfully!" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
