import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import LoginHistory from "@/models/LoginHistory";

// This is a dedicated API route for logging login attempts for analytics.
// It's designed to be called internally by the main login route.
export async function POST(req: Request) {
  try {
    // Extract login attempt data from the request body
    const { userId, email, status, reason, ipAddress, userAgent } = await req.json();

    // Basic validation
    if (!email || !status) {
      return NextResponse.json(
        { error: "Email and status are required for logging." },
        { status: 400 }
      );
    }

    // Connect to the database
    await connectToDatabase();

    // Create a new log entry in the LoginHistory collection
    await LoginHistory.create({
      userId,
      email,
      status,
      reason,
      ipAddress,
      userAgent,
      timestamp: new Date(),
    });

    // Return a success response. The client doesn't need to wait for this.
    return NextResponse.json(
      { message: "Login attempt logged successfully." },
      { status: 201 }
    );
  } catch (error) {
    // Log any errors to the console for debugging, but don't block the main login flow.
    console.error("Error logging login attempt:", error);
    // Return an error response, though the calling service might ignore it.
    return NextResponse.json(
      { error: "Failed to log login attempt." },
      { status: 500 }
    );
  }
}