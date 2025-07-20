import { NextRequest, NextResponse } from "next/server";
import nodemailer from 'nodemailer';
import { connectToDatabase } from "@/lib/mongodb";
import Payment from "@/models/Payment";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await req.json();
    const { 
      userId, 
      purchaseId, 
      amount, 
      reason, 
      userEmail, 
      userName,
      itemTitle,
      orderNumber 
    } = body;

    if (!userId || !purchaseId || !amount || !reason) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Find and update payment record
    const payment = await Payment.findOne({ stripePaymentIntentId: purchaseId });
    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Check if refund already requested
    if (payment.refundStatus !== 'none') {
      return NextResponse.json({ error: "Refund already requested or processed" }, { status: 400 });
    }

    // Update payment with refund request
    payment.refundStatus = 'requested';
    payment.refundRequestedAt = new Date();
    payment.refundReason = reason;
    payment.refundAmount = 0; // Shop items don't get automatic refunds
    await payment.save();

    // Send email to admin for shop refund request
    const emailSubject = `🛍️ Shop Refund Request - ${itemTitle}`;
    const emailText = `
Shop Refund Request Details:
- User ID: ${userId}
- User Email: ${userEmail}
- User Name: ${userName}
- Purchase ID: ${purchaseId}
- Order Number: ${orderNumber}
- Item: ${itemTitle}
- Amount: $${amount.toFixed(2)}
- Reason: ${reason}
- Request Date: ${new Date().toLocaleString()}

Note: This is a shop purchase refund request. Please review and process manually.
    `;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">🛍️ Shop Refund Request</h2>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin-top: 0;">Request Details</h3>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">User ID:</td>
              <td style="padding: 8px 0; color: #6b7280;">${userId}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">User Email:</td>
              <td style="padding: 8px 0; color: #6b7280;">${userEmail}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">User Name:</td>
              <td style="padding: 8px 0; color: #6b7280;">${userName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Purchase ID:</td>
              <td style="padding: 8px 0; color: #6b7280;">${purchaseId}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Order Number:</td>
              <td style="padding: 8px 0; color: #6b7280;">${orderNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Item:</td>
              <td style="padding: 8px 0; color: #6b7280;">${itemTitle}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Amount:</td>
              <td style="padding: 8px 0; color: #6b7280;">$${amount.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Reason:</td>
              <td style="padding: 8px 0; color: #6b7280;">${reason}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">Request Date:</td>
              <td style="padding: 8px 0; color: #6b7280;">${new Date().toLocaleString()}</td>
            </tr>
          </table>
        </div>
        
        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; color: #92400e;">
            <strong>Note:</strong> This is a shop purchase refund request. Please review and process manually as shop items are not eligible for automatic refunds.
          </p>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: #f0fdf4; border-radius: 8px; border-left: 4px solid #10b981;">
          <p style="margin: 0; color: #065f46;">
            <strong>FitSync Pro</strong><br>
            Shop Refund Request System
          </p>
        </div>
      </div>
    `;

    try {
      // Check if email credentials are configured
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error("❌ Email credentials not configured");
        return NextResponse.json({ 
          success: true, 
          message: "Shop refund request recorded (email not configured)"
        });
      }

      // Create transporter
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      // Send email
      await transporter.sendMail({
        from: `"FitSync Pro" <${process.env.EMAIL_USER}>`,
        to: "kalanam890@gmail.com",
        subject: emailSubject,
        text: emailText,
        html: emailHtml,
      });

      console.log("📧 Shop refund request email sent successfully");

      return NextResponse.json({ 
        success: true, 
        message: "Shop refund request sent successfully"
      });

    } catch (emailError: any) {
      console.error("❌ Email sending failed:", emailError);
      
      return NextResponse.json({ 
        success: true, 
        message: "Shop refund request recorded (email notification failed)",
        emailError: emailError.message
      });
    }

  } catch (error: any) {
    console.error("❌ Shop refund request error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to process shop refund request" 
    }, { status: 500 });
  }
} 