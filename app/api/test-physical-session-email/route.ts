import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Member from '@/models/member';
import { sendEmail } from '@/lib/sendEmail';
import dedent from 'dedent';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { testEmail } = body;

    if (!testEmail) {
      return NextResponse.json({ error: "Missing 'testEmail' in request body" }, { status: 400 });
    }

    await connectToDatabase();

    // Test email to a specific address
    await sendEmail({
      to: testEmail,
      subject: "🧪 Test Physical Session Email",
      text: "This is a test email for physical session notifications.",
      html: dedent`
        <p>Hi there!</p>
        <p>This is a test email to verify that physical session email notifications are working correctly.</p>
        <p><strong>Test Details:</strong><br/>
        <strong>Session:</strong> Test Physical Session<br/>
        <strong>Date:</strong> ${new Date().toLocaleDateString()}<br/>
        <strong>Time:</strong> ${new Date().toLocaleTimeString()}<br/>
        <strong>Location:</strong> Test Gym Location<br/>
        <strong>Trainer:</strong> Test Trainer</p>
        <br/>
        <p>If you received this email, the physical session email system is working!</p>
        <p>Thank you,<br/>FitSync Pro Team</p>
      `
    });

    // Also test member count
    const approvedMembers = await Member.find({ 
      status: "approved",
      email: { $exists: true, $ne: "" }
    });

    return NextResponse.json({ 
      message: "Test email sent successfully!",
      memberCount: approvedMembers.length,
      testEmail: testEmail
    });
  } catch (error) {
    console.error("Error sending test email:", error);
    return NextResponse.json({ error: "Failed to send test email" }, { status: 500 });
  }
} 