// app/api/enrollments/route.ts

import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Enrollment from "@/models/enrollment";

const connectToDB = async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!, { dbName: 'fit-sync' });
    console.log('✅ MongoDB connected (enrollments)');
    console.log('🔎 [DEBUG] mongoose.connection.name:', mongoose.connection.name);
  }
};

export async function POST(req: NextRequest) {
  try {
    await connectToDB();

    const { userId, className, totalAmount } = await req.json();

    if (!userId || !className || typeof totalAmount !== "number") {
      return NextResponse.json(
        { error: "Missing or invalid fields" },
        { status: 400 }
      );
    }

    // Check for active (not refunded) enrollments
    const Payment = (await import('@/models/Payment')).default;
    const activeEnrollments = await Payment.countDocuments({
      userId,
      paymentFor: 'enrollment',
      paymentStatus: { $in: ['paid', 'succeeded', 'active'] },
      $or: [
        { refundStatus: { $in: [null, 'none'] } },
        { refundStatus: { $exists: false } }
      ]
    });
    if (activeEnrollments >= 2) {
      return NextResponse.json(
        { error: 'You are already engaged in 2 classes. Please refund one to continue.' },
        { status: 400 }
      );
    }

    // Check for active (not refunded) enrollments for the same class
    const existingClassEnrollment = await Payment.findOne({
      userId,
      paymentFor: 'enrollment',
      paymentStatus: { $in: ['paid', 'succeeded', 'active'] },
      $or: [
        { refundStatus: { $in: [null, 'none'] } },
        { refundStatus: { $exists: false } }
      ],
      firstName: className
    });
    if (existingClassEnrollment) {
      return NextResponse.json(
        { error: 'You are already enrolled in this class. Please refund to enroll again.' },
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
    console.error("❌ Enrollment creation error:", error);
    return NextResponse.json(
      { error: error.message || "Enrollment creation failed" },
      { status: 500 }
    );
  }
}
