import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Member from "@/models/member";
import ApprovedTrainer from "@/models/ApprovedTrainer";
import ResetToken from "@/models/ResetToken";
import bcryptjs from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
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

    await connectToDatabase();

    // Hash the new password
    const hashedPassword = await bcryptjs.hash(password, 12);

    let updatedUser = null;

    // Update password based on user role
    if (tokenData.role === "trainer") {
      updatedUser = await ApprovedTrainer.findOneAndUpdate(
        { email: tokenData.email },
        { password: hashedPassword },
        { new: true }
      );
    } else if (tokenData.role === "member") {
      updatedUser = await Member.findOneAndUpdate(
        { email: tokenData.email },
        { password: hashedPassword },
        { new: true }
      );
    } else {
      // For admin or other roles, check User collection
      updatedUser = await User.findOneAndUpdate(
        { email: tokenData.email },
        { password: hashedPassword },
        { new: true }
      );
    }

    if (!updatedUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Mark token as used
    await ResetToken.findOneAndUpdate(
      { token },
      { used: true }
    );

    return NextResponse.json(
      { message: "Password reset successful" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
} 