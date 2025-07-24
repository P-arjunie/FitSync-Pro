import { NextRequest, NextResponse } from "next/server";
import nodemailer from 'nodemailer';
import { connectToDatabase } from "@/lib/mongodb";
import Payment from "@/models/Payment";
import User from "@/models/User";

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

    // Find and update payment record in fitsync_paymentsses
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
      return NextResponse.json({ error: `Payment not found in fitsync_paymentsses for userId=${userId}, paymentFor=${paymentFor}, purchaseId=${purchaseId}`, debugPayments, debugQuery }, { status: 404 });
    }

    // Check if refund already requested
    if (payment.refundStatus !== 'none') {
      return NextResponse.json({ error: "Refund already requested or processed" }, { status: 400 });
    }

    // Check if refund is within 7 days of purchase
    const now = new Date();
    const purchaseDate = payment.createdAt ? new Date(payment.createdAt) : null;
    if (purchaseDate && ((now.getTime() - purchaseDate.getTime()) > 7 * 24 * 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'Refunds can only be claimed within one week of purchase.' }, { status: 403 });
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
          const user = await User.findOne({ _id: userId });
          const userEmailDb = user?.email;
          const recipients = ['fitsyncpro.gym@gmail.com'];
          if (userEmailDb) recipients.push(userEmailDb);
          await transporter.sendMail({
            from: `FitSync Pro <${process.env.EMAIL_USER}>`,
            to: recipients.join(','),
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
    // If enrollment, also update Enrollment to refunded
    if (paymentFor === 'enrollment') {
      const Enrollment = (await import('@/models/enrollment')).default;
      const enrollmentId = payment.relatedEnrollmentId || purchaseId;
      await Enrollment.updateMany({
        _id: enrollmentId,
        userId,
        status: { $in: ['paid', 'active'] }
      }, {
        status: 'refunded',
        updatedAt: new Date(),
      });
    }
    await payment.save();

    return NextResponse.json({ 
      success: true, 
      message: "Refund processed successfully",
      refundAmount: refundAmount
    });
  } catch (error: any) {
    console.error("❌ Refund request error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to process refund request" 
    }, { status: 500 });
  }
} 