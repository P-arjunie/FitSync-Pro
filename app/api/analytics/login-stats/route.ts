import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import LoginHistory from "@/models/LoginHistory";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: "Email is required to fetch login statistics." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Normalize email for query
    const normalizedEmail = email.toLowerCase().trim();

    // Get total successful logins
    const totalLogins = await LoginHistory.countDocuments({
      email: normalizedEmail,
      status: "success"
    });

    // Get last successful login with full details
    const lastLogin = await LoginHistory.findOne({
      email: normalizedEmail,
      status: "success"
    })
    .sort({ timestamp: -1 });

    return NextResponse.json({
      totalLogins,
      lastLogin: lastLogin ? {
        timestamp: lastLogin.timestamp,
        ipAddress: lastLogin.ipAddress,
        device: lastLogin.userAgent
      } : null
    });

  } catch (error) {
    console.error("Error fetching login statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch login statistics." },
      { status: 500 }
    );
  }
}