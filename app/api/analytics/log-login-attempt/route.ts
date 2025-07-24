import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import LoginHistory from "@/models/LoginHistory";

export async function POST(req: Request) {
  try {
    const { userId, email, status, reason, ipAddress, userAgent } = await req.json();

    if (!email || !status) {
      return NextResponse.json(
        { error: "Email and status are required for logging." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Normalize email to lowercase to ensure consistency
    const normalizedEmail = email.toLowerCase().trim();

    const logEntry = {
      userId,
      email: normalizedEmail,
      status,
      reason,
      ipAddress,
      userAgent,
      timestamp: new Date(),
    };

    await LoginHistory.create(logEntry);

    return NextResponse.json(
      { message: "Login attempt logged successfully." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error logging login attempt:", error);
    return NextResponse.json(
      { error: "Failed to log login attempt." },
      { status: 500 }
    );
  }
}