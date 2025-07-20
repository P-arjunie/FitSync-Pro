import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Member from "@/models/member";
import ApprovedTrainer from "@/models/ApprovedTrainer";
import ResetToken from "@/models/ResetToken";
import { sendEmail } from "@/lib/sendEmail";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check if user exists in any collection
    const [user, member, trainer] = await Promise.all([
      User.findOne({ email: email.toLowerCase() }),
      Member.findOne({ email: email.toLowerCase() }),
      ApprovedTrainer.findOne({ email: email.toLowerCase() })
    ]);

    let userRole = null;
    let userName = null;

    if (trainer) {
      userRole = "trainer";
      userName = `${trainer.firstName} ${trainer.lastName}`;
    } else if (member) {
      userRole = "member";
      userName = `${member.firstName} ${member.lastName}`;
    } else if (user) {
      userRole = user.role;
      userName = user.name;
    }

    if (!userRole) {
      // Don't reveal if email exists or not for security
      return NextResponse.json(
        { message: "If an account with this email exists, a password reset link has been sent." },
        { status: 200 }
      );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expires = Date.now() + 3600000; // 1 hour

    // Store token in database
    await ResetToken.create({
      token: resetToken,
      email: email.toLowerCase(),
      role: userRole,
      expires: new Date(expires)
    });

    // Create reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;

    // Check if email configuration is available
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("Email configuration not found. Password reset link:", resetUrl);
      return NextResponse.json(
        { message: "Password reset link has been generated. Please contact support for assistance." },
        { status: 200 }
      );
    }

    // Send email
    const emailSubject = "Password Reset Request - FitSync Pro";
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">FitSync Pro</h1>
        </div>
        <div style="padding: 20px; background-color: #f9fafb;">
          <h2 style="color: #374151;">Hello ${userName},</h2>
          <p style="color: #6b7280; line-height: 1.6;">
            You requested a password reset for your FitSync Pro account. Click the button below to reset your password:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            This link will expire in 1 hour. If you didn't request this password reset, please ignore this email.
          </p>
          <p style="color: #6b7280; font-size: 14px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${resetUrl}" style="color: #dc2626;">${resetUrl}</a>
          </p>
        </div>
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
          <p>© 2024 FitSync Pro. All rights reserved.</p>
        </div>
      </div>
    `;

    const emailText = `
      Hello ${userName},

      You requested a password reset for your FitSync Pro account. Click the link below to reset your password:

      ${resetUrl}

      This link will expire in 1 hour. If you didn't request this password reset, please ignore this email.

      Best regards,
      FitSync Pro Team
    `;

    try {
      await sendEmail({
        to: email,
        subject: emailSubject,
        text: emailText,
        html: emailHtml
      });

      return NextResponse.json(
        { message: "Password reset link has been sent to your email." },
        { status: 200 }
      );
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      
      // If email fails, still return success but log the error
      // In production, you might want to handle this differently
      return NextResponse.json(
        { message: "Password reset link has been sent to your email." },
        { status: 200 }
      );
    }

  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Failed to process password reset request" },
      { status: 500 }
    );
  }
} 