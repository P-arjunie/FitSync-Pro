// app/api/admin/trainers/route.ts
import { connectToDatabase } from "@/lib/mongodb"; // Import function to connect to MongoDB
import ApprovedTrainer from "@/models/ApprovedTrainer"; // Import the ApprovedTrainer model
import { NextResponse } from "next/server"; // Import Next.js response helper

// GET handler to retrieve all approved and suspended trainers from the database
export async function GET() {
  try {
    // Establish a connection to the MongoDB database
    await connectToDatabase();

    // Fetch all documents from the ApprovedTrainer collection with status "approved" or "suspended"
    const trainers = await ApprovedTrainer.find({ 
      status: { $in: ["approved", "suspended"] } 
    });

    // Return the list of trainers as a JSON response
    return NextResponse.json(trainers);
  } catch (error) {
    // Log any errors that occur during the database operation
    console.error("Failed to fetch trainers:", error);

    // Return a 500 error response in case of failure
    return NextResponse.json({ error: "Failed to load trainers" }, { status: 500 });
  }
}
