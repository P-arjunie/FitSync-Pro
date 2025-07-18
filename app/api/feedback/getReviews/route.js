import {connectToDatabase} from "../../../lib/mongodb";
import Review from "@/models/Review";
import User from "@/models/User";

export async function GET() {
  try {
    await connectToDatabase();
    
    // Fetch reviews with user information
    const reviews = await Review.aggregate([
      {
        $lookup: {
          from: "users", // Collection name (usually lowercase plural)
          localField: "memberEmail", // Field in Review model
          foreignField: "email", // Field in User model
          as: "userInfo"
        }
      },
      {
        $unwind: {
          path: "$userInfo",
          preserveNullAndEmptyArrays: true // Keep reviews even if user not found
        }
      },
      {
        $addFields: {
          userName: {
            $ifNull: ["$userInfo.name", "Anonymous"] // Fallback if user not found
          }
        }
      },
      {
        $project: {
          userInfo: 0 // Remove the userInfo object from results
        }
      },
      {
        $sort: { createdAt: -1 } // Newest first
      }
    ]);

    return new Response(JSON.stringify({ reviews }), { status: 200 });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return new Response(JSON.stringify({ message: "Failed to fetch reviews." }), { status: 500 });
  }
}