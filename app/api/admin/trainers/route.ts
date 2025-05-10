// app/api/admin/trainers/route.ts
import { connectToDatabase } from "@/lib/mongodb";
import ApprovedTrainer from "@/models/ApprovedTrainer";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectToDatabase();
    const trainers = await ApprovedTrainer.find();
    return NextResponse.json(trainers);
  } catch (error) {
    console.error("Failed to fetch trainers:", error);
    return NextResponse.json({ error: "Failed to load trainers" }, { status: 500 });
  }
}
