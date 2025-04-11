import { NextResponse } from "next/server";
import connectMongoDB from "@/lib/mongodb";
import Trainer from "@/models/Trainer";

export async function POST(req: Request) {
  try {
    await connectMongoDB();

    const data = await req.json();

    // Basic validation (optional)
    if (!data.email || !data.firstName || !data.profileImage) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const newTrainer = new Trainer(data);
    await newTrainer.save();

    return NextResponse.json({ message: "Trainer registration submitted successfully" }, { status: 201 });
  } catch (error) {
    console.error("Trainer submission error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
