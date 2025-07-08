// app/api/admin/members/route.ts

import { connectToDatabase } from "@/lib/mongodb"; // Import function to connect to MongoDB
import Member from "@/models/member"; // Import the Member model
import { NextResponse } from "next/server"; // Import Next.js helper for sending responses

// GET handler to fetch all pending members for admin review
export async function GET() {
  try {
    // Establish connection to the database
    await connectToDatabase();

    // Query the Member collection for members with status "pending"
    const members = await Member.find({ status: "pending" });

    // Return the list of pending members as a JSON response
    return NextResponse.json(members);
  } catch (error) {
    // Log any errors that occur during the database operation
    console.error("Failed to fetch members:", error);

    // Return a 500 error response in case of failure
    return NextResponse.json({ error: "Failed to load members" }, { status: 500 });
  }
}
