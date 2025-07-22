// app/api/enrollments/[enrollmentId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Enrollment from "@/models/enrollment";

const connectToDB = async () => {
  if (mongoose.connection.readyState === 0) {
    try {
      await mongoose.connect(process.env.MONGODB_URI!, { dbName: 'fit-sync' });
      console.log('MongoDB connected');
      console.log('🔎 [DEBUG] mongoose.connection.name:', mongoose.connection.name);
    } catch (error) {
      console.error('DB connection error:', error);
      throw error;
    }
  } else {
    console.log('MongoDB already connected');
  }
};


export async function GET(
  req: NextRequest,
  { params }: { params: { enrollmentId: string } }
) {
  try {
    await connectToDB();

    const enrollmentId = params.enrollmentId.trim();
    console.log("Enrollment ID received:", enrollmentId);

    if (!mongoose.Types.ObjectId.isValid(enrollmentId)) {
      return NextResponse.json({ error: "Invalid enrollment ID" }, { status: 400 });
    }

    const enrollment = await Enrollment.findById(enrollmentId);

    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    }

    return NextResponse.json(enrollment);
  } catch (error) {
    console.error("Error fetching enrollment:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
