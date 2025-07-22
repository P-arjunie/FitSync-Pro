import { connectToDatabase } from "../../../lib/mongodb";
import Review from "@/models/Review";
import { NextResponse } from "next/server";

// GET /api/feedback/getTrainerReviews?fullName=John%20Smith
export async function GET(req) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const fullName = searchParams.get("fullName");
    if (!fullName) {
      return NextResponse.json({ success: false, message: "Trainer full name required" }, { status: 400 });
    }
    // Only fetch reviews for this trainer's full name
    const reviews = await Review.find({ trainer: fullName }).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, reviews }, { status: 200 });
  } catch (error) {
    console.error("Error fetching trainer reviews:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch trainer reviews." }, { status: 500 });
  }
}
