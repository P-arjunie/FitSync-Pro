import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Payment from "@/models/Payment"; // adjust path if needed

const connectToDB = async () => {
  if (mongoose.connections[0].readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!);
  }
};

export async function GET() {
  try {
    await connectToDB();

    // Fetch only successful payments for now
    const payments = await Payment.find({ paymentStatus: "succeeded" });

    return NextResponse.json(payments);
  } catch (err) {
    console.error("Error fetching payments:", err);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}
