import { NextResponse } from "next/server";
import { connectToDatabase } from "../../../lib/mongodb";
import ApprovedTrainer from "@/models/ApprovedTrainer";
import Review from "@/models/Review";

export async function GET() {
  try {
    await connectToDatabase();

    // Fetch all approved trainers (no need for status filter now)
    const trainers = await ApprovedTrainer.find();

    const trainerWithReviews = await Promise.all(
      trainers.map(async (trainer) => {
        const fullName = `${trainer.firstName} ${trainer.lastName}`;
        const reviews = await Review.find({ trainer: fullName });

        // Defensive: If no reviews, averageRating should be '0.0'
        let averageRating = 0;
        if (reviews.length > 0) {
          averageRating = reviews.reduce((acc, cur) => acc + (cur.rating || 0), 0) / reviews.length;
        }

        // Get the first pricing plan as the main one to display
        const pricingPlan = trainer.pricingPlans?.[0] || 'N/A';

        return {
          ...trainer._doc,
          fullName,
          averageRating: averageRating.toFixed(1),
          reviews: Array.isArray(reviews) ? reviews : [],
          pricingPlan // Add this field for backward compatibility
        };
      })
    );

    return NextResponse.json({ data: trainerWithReviews }, { status: 200 });
  } catch (error) {
    console.error("API error in getTrainerWithReviews:", error);
    return NextResponse.json(
      { message: "Failed to load trainers." },
      { status: 500 }
    );
  }
}