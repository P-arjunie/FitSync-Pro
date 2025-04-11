import connectMongoDB from "../../../lib/mongodb.js";
import Review from "@/app/models/Review.js"; // Assuming your Review model is already set up

export async function GET(req, res) {
  try {
    // Connect to MongoDB
    await connectMongoDB();

    // Fetch all reviews from the database (no filtering by trainer)
    const reviews = await Review.find({});

    return new Response(JSON.stringify({ reviews }), { status: 200 });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return new Response(JSON.stringify({ message: "Failed to fetch reviews." }), { status: 500 });
  }
}
