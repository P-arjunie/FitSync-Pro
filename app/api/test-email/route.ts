import { NextRequest, NextResponse } from "next/server";
import nodemailer from 'nodemailer';

export async function GET(req: NextRequest) {
  try {
    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return NextResponse.json({ 
        error: "Email credentials not configured",
        emailUser: process.env.EMAIL_USER ? "Set" : "Not set",
        emailPass: process.env.EMAIL_PASS ? "Set" : "Not set"
      }, { status: 500 });
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Test email
    await transporter.sendMail({
      from: `"FitSync Pro Test" <${process.env.EMAIL_USER}>`,
      to: "kalanam890@gmail.com",
      subject: "Test Email from FitSync Pro",
      text: "This is a test email to verify email configuration.",
      html: "<h1>Test Email</h1><p>This is a test email to verify email configuration.</p>",
    });

    return NextResponse.json({ 
      success: true, 
      message: "Test email sent successfully"
    });

  } catch (error: any) {
    console.error("❌ Test email failed:", error);
    return NextResponse.json({ 
      error: "Failed to send test email",
      details: error.message
    }, { status: 500 });
  }
} 