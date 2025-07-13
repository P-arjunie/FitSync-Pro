// app/api/enrollments/route.ts

import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Enrollment from "@/models/enrollment";

const connectToDB = async () => {
  if (mongoose.connections[0].readyState === 0) {
    try {
      await mongoose.connect(process.env.MONGODB_URI!);
      console.log("✅ MongoDB Connected");
    } catch (error) {
      console.error("❌ DB connection error:", error);
      throw new Error("Failed to connect to the database");
    }
  }
};

export async function POST(req: NextRequest) {
  try {
    await connectToDB();

    const body = await req.json();
    console.log("📦 Incoming POST data:", body);

    const { userId, className, totalAmount } = body;

    if (!userId || !className || typeof totalAmount !== "number") {
      return NextResponse.json(
        { error: "Missing or invalid fields: userId, className, totalAmount" },
        { status: 400 }
      );
    }

    const newEnrollment = new Enrollment({
      userId,
      className,
      totalAmount,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const savedEnrollment = await newEnrollment.save();
    console.log("✅ Enrollment saved:", savedEnrollment);

    return NextResponse.json(savedEnrollment, { status: 201 });
  } catch (error: any) {
    console.error("❌ Error creating enrollment:", error);
    return NextResponse.json(
      { error: error.message || "Could not create enrollment" },
      { status: 500 }
    );
  }
}
