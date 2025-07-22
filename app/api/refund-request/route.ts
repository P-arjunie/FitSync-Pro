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
      purchaseType, 
      amount, 
      reason, 
      userEmail, 
      userName,
      itemTitle 
    } = body;

    if (!userId || !purchaseId || !purchaseType || !amount || !reason) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Map UI purchaseType and collection names to DB paymentFor value
    const typeMap: Record<string, string> = {
      'Class Enrollment': 'enrollment',
      'Store Purchase': 'order',
      'Subscription Plan': 'pricing-plan',
      'Monthly Plan': 'monthly-plan',
      'enrollments': 'enrollment',
      'orders': 'order',
      'pricing_plan': 'pricing-plan',
    };
    const paymentFor = typeMap[purchaseType] || purchaseType;

    // DEBUG: Log all Payment records for this user/type
    const allPayments = await Payment.find({ userId, paymentFor });
    console.log('[DEBUG] All Payment records for userId', userId, 'paymentFor', paymentFor, allPayments.map(p => ({_id: p._id, relatedOrderId: p.relatedOrderId, relatedEnrollmentId: p.relatedEnrollmentId, firstName: p.firstName, amount: p.amount, refundStatus: p.refundStatus})));
    // DEBUG: Log the query being run
    console.log('[DEBUG] Refund query', { userId, paymentFor, purchaseId });

    // Find and update payment record in kalana_paymentsses
    const mongoose = require('mongoose');
    let payment = null;
    let debugPayments = await Payment.find({ userId, paymentFor });
    let debugQuery = {};
    if (paymentFor === 'enrollment' && mongoose.Types.ObjectId.isValid(purchaseId)) {
      debugQuery = { userId, paymentFor, relatedEnrollmentId: new mongoose.Types.ObjectId(purchaseId) };
      payment = await Payment.findOne(debugQuery);
    }
    if (!payment && paymentFor === 'order' && mongoose.Types.ObjectId.isValid(purchaseId)) {
      debugQuery = { userId, paymentFor, relatedOrderId: new mongoose.Types.ObjectId(purchaseId) };
      payment = await Payment.findOne(debugQuery);
    }
    if (!payment && paymentFor === 'pricing-plan' && mongoose.Types.ObjectId.isValid(purchaseId)) {
      // Try by relatedPlanId first
      payment = await Payment.findOne({ userId, paymentFor, relatedPlanId: new mongoose.Types.ObjectId(purchaseId) });
      if (!payment) {
        // Try by Payment _id
        payment = await Payment.findOne({ userId, paymentFor, _id: new mongoose.Types.ObjectId(purchaseId) });
      }
      if (!payment) {
        // Try by planName from PricingPlanPurchase
        const PricingPlanPurchase = (await import('@/models/PricingPlanPurchase')).default;
        const plan = await PricingPlanPurchase.findById(purchaseId);
        if (plan) {
          payment = await Payment.findOne({ userId, paymentFor, firstName: plan.planName });
        }
      }
    }
    if (!payment && mongoose.Types.ObjectId.isValid(purchaseId)) {
      debugQuery = { userId, paymentFor, _id: new mongoose.Types.ObjectId(purchaseId) };
      payment = await Payment.findOne(debugQuery);
    }
    if (!payment) {
      console.error('❌ Payment not found. Existing payments for user/type:', debugPayments);
      console.error('❌ Query used:', debugQuery);
      return NextResponse.json({ error: `Payment not found in kalana_paymentsses for userId=${userId}, paymentFor=${paymentFor}, purchaseId=${purchaseId}`, debugPayments, debugQuery }, { status: 404 });
    }

    // Check if refund already requested
    if (payment.refundStatus !== 'none') {
      return NextResponse.json({ error: "Refund already requested or processed" }, { status: 400 });
    }

    let refundAmount = 0;
    if (paymentFor === 'enrollment') {
      // Always use Enrollment.totalAmount for refund calculation
      const Enrollment = (await import('@/models/enrollment')).default;
      const enrollment = await Enrollment.findById(payment.relatedEnrollmentId);
      if (!enrollment) {
        return NextResponse.json({ error: 'Enrollment not found for refund calculation' }, { status: 404 });
      }
      refundAmount = Math.round((enrollment.totalAmount || 0) * 0.25 * 100) / 100;
      console.log('[DEBUG] Class enrollment refund calculation:', { enrollmentId: enrollment._id, totalAmount: enrollment.totalAmount, refundAmount });
    } else if (paymentFor === 'pricing-plan') {
      refundAmount = Math.round((payment.amount || 0) * 0.25 * 100) / 100;
      console.log('[DEBUG] Subscription refund calculation:', { paymentId: payment._id, amount: payment.amount, refundAmount });
    } else if (paymentFor === 'order') {
      // Store purchases are not refundable
      return NextResponse.json({ error: 'Store purchases are not refundable.' }, { status: 403 });
    }

    // Store original refundStatus before updating
    const originalRefundStatus = payment.refundStatus;
    // linter: originalRefundStatus can be undefined, 'none', 'refunded', 'requested', or 'denied'. This check is intentional.
    // Add refund to wallet for class enrollments and subscriptions only if not already refunded
    if ((paymentFor === 'enrollment' || paymentFor === 'pricing-plan') && (!originalRefundStatus || originalRefundStatus === 'none')) {
      const Wallet = (await import('@/models/Wallet')).default;
      const walletBefore = await Wallet.findOne({ userId });
      console.log('[DEBUG] Wallet before update:', walletBefore);
      await Wallet.updateOne(
        { userId },
        {
          $inc: { balance: refundAmount },
          $push: {
            transactions: {
              type: 'refund',
              amount: refundAmount,
              description: `Refund for ${itemTitle}`,
              purchaseId: purchaseId,
              status: 'completed',
              createdAt: new Date(),
            },
          },
        },
        { upsert: true }
      );
      const walletAfter = await Wallet.findOne({ userId });
      console.log('[DEBUG] Wallet after update:', walletAfter);

      // Send admin email for refund
      try {
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
            },
          });
          let originalAmount = 'N/A';
          if (paymentFor === 'enrollment') {
            const Enrollment = (await import('@/models/enrollment')).default;
            const enrollment = await Enrollment.findById(payment.relatedEnrollmentId);
            if (enrollment) {
              originalAmount = enrollment.totalAmount?.toFixed(2) || 'N/A';
            }
          } else {
            originalAmount = payment.amount?.toFixed(2) || 'N/A';
          }
          const emailSubject = `Refund Processed - ${purchaseType}`;
          const emailText = `
Refund Processed:
- User ID: ${userId}
- User Email: ${userEmail}
- User Name: ${userName}
- Purchase ID: ${purchaseId}
- Purchase Type: ${purchaseType}
- Item: ${itemTitle}
- Original Amount: $${originalAmount}
- Refund Amount: $${refundAmount.toFixed(2)}
- Reason: ${reason}
- Processed At: ${new Date().toLocaleString()}
          `;
          await transporter.sendMail({
            from: `FitSync Pro <${process.env.EMAIL_USER}>`,
            to: 'kalanam890@gmail.com',
            subject: emailSubject,
            text: emailText,
          });
          console.log('📧 Refund processed email sent to admin');
        }
      } catch (emailErr) {
        console.error('❌ Failed to send admin refund email:', emailErr);
      }
    }

    // Manual refund (update Payment record)
    payment.refundStatus = paymentFor === 'order' ? 'denied' : 'refunded';
    if (paymentFor !== 'order') {
      payment.refundProcessedAt = new Date();
    }
    payment.refundReason = reason;
    payment.refundAmount = refundAmount;
    payment.paymentStatus = paymentFor === 'order' ? payment.paymentStatus : 'refunded';
    // If pricing-plan, also update PricingPlanPurchase to refunded
    if (paymentFor === 'pricing-plan') {
      const PricingPlanPurchase = (await import('@/models/PricingPlanPurchase')).default;
      await PricingPlanPurchase.updateMany({
        userId,
        amount: payment.amount,
        status: { $in: ['paid', 'active'] }
      }, {
        status: 'refunded',
        refundedAt: new Date(),
      });
    }
    await payment.save();

    // Send email to admin
    const emailSubject = `🔄 Refund Request - ${purchaseType}`;
    const emailText = `
Refund Request Details:
- User ID: ${userId}
- User Email: ${userEmail}
- User Name: ${userName}
- Purchase ID: ${purchaseId}
- Purchase Type: ${purchaseType}
- Item: ${itemTitle}
- Original Amount: $${amount.toFixed(2)}
- Refund Amount: $${refundAmount.toFixed(2)}
- Reason: ${reason}
- Request Date: ${new Date().toLocaleString()}
    `;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">🔄 Refund Request</h2>
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin-top: 0;">Request Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">User ID:</td><td style="padding: 8px 0; color: #6b7280;">${userId}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">User Email:</td><td style="padding: 8px 0; color: #6b7280;">${userEmail}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">User Name:</td><td style="padding: 8px 0; color: #6b7280;">${userName}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Purchase ID:</td><td style="padding: 8px 0; color: #6b7280;">${purchaseId}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Purchase Type:</td><td style="padding: 8px 0; color: #6b7280;">${purchaseType}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Item:</td><td style="padding: 8px 0; color: #6b7280;">${itemTitle}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Original Amount:</td><td style="padding: 8px 0; color: #6b7280;">$${amount.toFixed(2)}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Refund Amount:</td><td style="padding: 8px 0; color: #ef4444; font-weight: bold;">$${refundAmount.toFixed(2)}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Reason:</td><td style="padding: 8px 0; color: #6b7280;">${reason}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Request Date:</td><td style="padding: 8px 0; color: #6b7280;">${new Date().toLocaleString()}</td></tr>
          </table>
        </div>
        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; color: #92400e;"><strong>Note:</strong> This is a refund request. Please review and process accordingly.</p>
        </div>
        <div style="margin-top: 20px; padding: 15px; background: #f0fdf4; border-radius: 8px; border-left: 4px solid #10b981;">
          <p style="margin: 0; color: #065f46;"><strong>FitSync Pro</strong><br>Automated Refund Request System</p>
        </div>
      </div>
    `;

    try {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error("❌ Email credentials not configured");
        return NextResponse.json({ 
          success: true, 
          message: "Refund request processed successfully (email not configured)",
          refundAmount: refundAmount
        });
      }
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
      await transporter.sendMail({
        from: `"FitSync Pro" <${process.env.EMAIL_USER}>`,
        to: "kalanam890@gmail.com",
        subject: emailSubject,
        text: emailText,
        html: emailHtml,
      });
      console.log("📧 Refund request email sent successfully");
      return NextResponse.json({ 
        success: true, 
        message: "Refund request sent successfully",
        refundAmount: refundAmount
      });
    } catch (emailError: any) {
      console.error("❌ Email sending failed:", emailError);
      return NextResponse.json({ 
        success: true, 
        message: "Refund request processed successfully (email notification failed)",
        refundAmount: refundAmount,
        emailError: emailError.message
      });
    }
  } catch (error: any) {
    console.error("❌ Refund request error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to process refund request" 
    }, { status: 500 });
  }
} 