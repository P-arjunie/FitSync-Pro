import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Trainer from "@/models/Trainer";

// GET handler to fetch all trainers (including pending ones)
export async function GET() {
  try {
    await connectToDatabase();
    
    // Fetch all trainers
    const trainers = await Trainer.find().select("firstName lastName email status profileImage");
    
    return NextResponse.json(trainers);
  } catch (error) {
    console.error("Failed to fetch trainers:", error);
    return NextResponse.json({ error: "Failed to load trainers" }, { status: 500 });
  }
} 