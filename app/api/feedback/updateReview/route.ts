import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Review from "@/models/Review";

export async function PUT(req: Request) {
  try {
    await connectToDatabase();

    const {
      reviewId,
      trainer,
      sessionType,
      date,
      comments,
      rating,
      memberEmail
    } = await req.json();

    if (!reviewId || !memberEmail) {
      return NextResponse.json(
        { message: "Review ID and member email are required" },
        { status: 400 }
      );
    }

    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      {
        trainer,
        sessionType,
        date,
        comments,
        rating,
        memberEmail,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!updatedReview) {
      return NextResponse.json(
        { message: "Review not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Review updated successfully", review: updatedReview },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating review:", error);
    return NextResponse.json(
      { message: "Failed to update review" },
      { status: 500 }
    );
  }
}