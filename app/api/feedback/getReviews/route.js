import {connectToDatabase} from "../../../lib/mongodb";
import Review from "@/models/Review";

export async function GET() {
  try {
    await connectToDatabase();
    const reviews = await Review.find({});
    return new Response(JSON.stringify({ reviews }), { status: 200 });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return new Response(JSON.stringify({ message: "Failed to fetch reviews." }), { status: 500 });
  }
}
