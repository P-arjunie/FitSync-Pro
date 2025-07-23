import { NextRequest, NextResponse } from "next/server";
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { testEmail } = body;

    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("❌ Email credentials not configured");
      return NextResponse.json({ 
        error: "Email credentials not configured",
        details: {
          EMAIL_USER: process.env.EMAIL_USER ? "Set" : "Missing",
          EMAIL_PASS: process.env.EMAIL_PASS ? "Set" : "Missing"
        }
      }, { status: 400 });
    }

    console.log("📧 Testing email configuration...");
    console.log("Email User:", process.env.EMAIL_USER);
    console.log("Email Pass:", process.env.EMAIL_PASS ? "Set" : "Missing");

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Verify connection
    try {
      await transporter.verify();
      console.log("✅ Email connection verified successfully");
    } catch (verifyError: any) {
      console.error("❌ Email connection failed:", verifyError);
      return NextResponse.json({ 
        error: "Email connection failed",
        details: verifyError.message
      }, { status: 500 });
    }

    // Send test email
    const testEmailAddress = testEmail || "fitsync.test@gmail.com";
    
    const emailSubject = "🧪 FitSync Pro - Email Test";
    const emailText = `
This is a test email from FitSync Pro to verify email configuration.

Test Details:
- Sent at: ${new Date().toLocaleString()}
- From: ${process.env.EMAIL_USER}
- To: ${testEmailAddress}

If you receive this email, the email configuration is working correctly!

Best regards,
FitSync Pro Team
    `;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">🧪 FitSync Pro - Email Test</h2>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p>This is a test email from FitSync Pro to verify email configuration.</p>
          
          <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981; margin: 15px 0;">
            <h3 style="margin-top: 0; color: #065f46;">Test Details:</h3>
            <ul style="color: #065f46;">
              <li><strong>Sent at:</strong> ${new Date().toLocaleString()}</li>
              <li><strong>From:</strong> ${process.env.EMAIL_USER}</li>
              <li><strong>To:</strong> ${testEmailAddress}</li>
            </ul>
          </div>
          
          <p style="color: #10b981; font-weight: bold;">
            ✅ If you receive this email, the email configuration is working correctly!
          </p>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: #f0fdf4; border-radius: 8px; border-left: 4px solid #10b981;">
          <p style="margin: 0; color: #065f46;">
            <strong>FitSync Pro</strong><br>
            Email Configuration Test
          </p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"FitSync Pro" <${process.env.EMAIL_USER}>`,
      to: testEmailAddress,
      subject: emailSubject,
      text: emailText,
      html: emailHtml,
    });

    console.log("📧 Test email sent successfully");

    return NextResponse.json({ 
      success: true, 
      message: "Test email sent successfully",
      details: {
        from: process.env.EMAIL_USER,
        to: testEmailAddress,
        sentAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error("❌ Test email error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to send test email",
      details: error
    }, { status: 500 });
  }
} 