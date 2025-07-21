import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import ResetToken from "@/models/ResetToken";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const tokenData = await ResetToken.findOne({ 
      token, 
      used: false,
      expires: { $gt: new Date() }
    });

    if (!tokenData) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Token is valid" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Token validation error:", error);
    return NextResponse.json(
      { error: "Failed to validate token" },
      { status: 500 }
    );
  }
} 