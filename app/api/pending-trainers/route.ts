import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb"; // ✅ Correct for named export

import Trainer from "@/models/Trainer";

export async function POST(req: Request) {
  try {
    await connectToDatabase();

    const body = await req.json();

    const {
      firstName,
      lastName,
      email,
      phone,
      dob,
      gender,
      address,
      specialization,
      certifications,
      preferredTrainingHours,
      yearsOfExperience,
      availability,
      pricingPlan,
      emergencyName,
      emergencyPhone,
      relationship,
      startDate,
      termsAccepted,
      profileImage,
      biography,
      skills,
    } = body;

    const newTrainer = await Trainer.create({
      firstName,
      lastName,
      email,
      phone,
      dob,
      gender,
      address,
      specialization,
      certifications: Array.isArray(certifications) ? certifications : [certifications],
      preferredTrainingHours,
      yearsOfExperience,
      availability,
      pricingPlan,
      emergencyName,
      emergencyPhone,
      relationship,
      startDate: startDate || null,
      termsAccepted,
      profileImage,
      biography: biography || "",
      skills: skills || [],
      status: "pending",
    });

    return NextResponse.json({ success: true, trainer: newTrainer });
  } catch (error) {
    console.error("Trainer registration error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
