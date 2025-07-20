import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/sendEmail"; // Your existing sendEmail helper

export async function POST(req: NextRequest) {
  try {
    const { toEmail } = await req.json();

    if (!toEmail) {
      return NextResponse.json({ error: "Missing 'toEmail' in request body" }, { status: 400 });
    }

    await sendEmail({
      to: toEmail,
      subject: "Test Email from FitSync Pro",
      text: "This is a test email to verify your Nodemailer setup is working.",
      html: "<p>This is a test email to verify your Nodemailer setup is working.</p>",
    });

    return NextResponse.json({ message: "Test email sent successfully!" });
  } catch (error) {
    console.error("Error sending test email:", error);
    return NextResponse.json({ error: "Failed to send test email" }, { status: 500 });
  }
}
