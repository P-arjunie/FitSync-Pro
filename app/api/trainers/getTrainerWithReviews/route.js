import { NextResponse } from "next/server";
import connectMongoDB from "@/lib/mongodb";
import Trainer from "@/models/Trainer";
import Review from "@/models/Review";

export async function GET() {
  try {
    await connectMongoDB();

    // Fetch only approved trainers
    const trainers = await Trainer.find({ status: "approved" });

    const trainerWithReviews = await Promise.all(
      trainers.map(async (trainer) => {
        const fullName = `${trainer.firstName} ${trainer.lastName}`;
        const reviews = await Review.find({ trainer: fullName });

        const averageRating =
          reviews.reduce((acc, cur) => acc + cur.rating, 0) / (reviews.length || 1);

        return {
          ...trainer._doc,
          fullName,
          averageRating: averageRating.toFixed(1),
          reviews,
        };
      })
    );

    return NextResponse.json({ data: trainerWithReviews }, { status: 200 });
  } catch (error) {
    console.error("API error in getTrainerWithReviews:", error);
    return NextResponse.json({ message: "Failed to load trainers." }, { status: 500 });
  }
}
