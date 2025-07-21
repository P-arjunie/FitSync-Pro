import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Payment from "@/models/Payment";
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await req.json();
    const { 
      paymentId, 
      action, // 'approve' or 'deny'
      adminNotes 
    } = body;

    if (!paymentId || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Find payment record
    const payment = await Payment.findOne({ stripePaymentIntentId: paymentId });
    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Update payment status
    if (action === 'approve') {
      payment.refundStatus = 'refunded';
      payment.refundProcessedAt = new Date();
    } else if (action === 'deny') {
      payment.refundStatus = 'denied';
      payment.refundProcessedAt = new Date();
    }

    await payment.save();

    // Send email notification to user
    try {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error("❌ Email credentials not configured");
        return NextResponse.json({ 
          success: true, 
          message: `Refund ${action}ed successfully (email not configured)`
        });
      }

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const emailSubject = `Refund ${action === 'approve' ? 'Approved' : 'Denied'} - Purchase`;
      const emailText = `
Dear ${payment.firstName} ${payment.lastName},

Your refund request for your purchase has been ${action === 'approve' ? 'approved' : 'denied'}.

${action === 'approve' ? 
  `Refund Amount: $${payment.refundAmount?.toFixed(2) || '0.00'}
  The refund will be processed within 3-5 business days.` : 
  'Your refund request has been denied.'
}

${adminNotes ? `Admin Notes: ${adminNotes}` : ''}

Thank you for your patience.

Best regards,
FitSync Pro Team
      `;

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: ${action === 'approve' ? '#10b981' : '#ef4444'};">
            Refund ${action === 'approve' ? 'Approved' : 'Denied'}
          </h2>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p>Dear ${payment.firstName} ${payment.lastName},</p>
            
            <p>Your refund request for <strong>your purchase</strong> has been ${action === 'approve' ? 'approved' : 'denied'}.</p>
            
            ${action === 'approve' ? `
              <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981; margin: 15px 0;">
                <p style="margin: 0; color: #065f46;">
                  <strong>Refund Amount:</strong> $${payment.refundAmount?.toFixed(2) || '0.00'}<br>
                  The refund will be processed within 3-5 business days.
                </p>
              </div>
            ` : `
              <div style="background: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444; margin: 15px 0;">
                <p style="margin: 0; color: #991b1b;">
                  Your refund request has been denied.
                </p>
              </div>
            `}
            
            ${adminNotes ? `
              <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 15px 0;">
                <p style="margin: 0; color: #92400e;">
                  <strong>Admin Notes:</strong> ${adminNotes}
                </p>
              </div>
            ` : ''}
            
            <p>Thank you for your patience.</p>
            
            <p>Best regards,<br>
            <strong>FitSync Pro Team</strong></p>
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: `"FitSync Pro" <${process.env.EMAIL_USER}>`,
        to: payment.email,
        subject: emailSubject,
        text: emailText,
        html: emailHtml,
      });

      console.log(`📧 Refund ${action} email sent successfully`);

    } catch (emailError: any) {
      console.error("❌ Email sending failed:", emailError);
      // Still return success for the refund processing
    }

    return NextResponse.json({ 
      success: true, 
      message: `Refund ${action}ed successfully`
    });

  } catch (error: any) {
    console.error("❌ Process refund error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to process refund" 
    }, { status: 500 });
  }
} 