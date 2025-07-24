import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import mongoose from "mongoose";
import PricingPlanPurchase from "@/models/PricingPlanPurchase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

const connectToDB = async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!, { dbName: 'fit-sync' });
    console.log('✅ MongoDB connected (cancel subscription)');
    console.log('🔎 [DEBUG] mongoose.connection.name:', mongoose.connection.name);
  }
};

export async function POST(req: NextRequest) {
  try {
    await connectToDB();

    const body = await req.json();
    const { userId, planName, reason } = body;

    if (!userId || !planName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Find the pricing plan purchase (paid or active)
    const plan = await PricingPlanPurchase.findOne({ 
      userId, 
      planName,
      status: { $in: ["paid", "active"] }
    });

    if (!plan) {
      return NextResponse.json({ error: "Active subscription not found" }, { status: 404 });
    }

    // Calculate refund amount (25% of plan amount)
    const refundAmount = Math.round(plan.amount * 0.25 * 100) / 100;
    console.log('[DEBUG] Calculated refundAmount:', refundAmount);

    // Update all matching plans to refunded
    await PricingPlanPurchase.updateMany({
      userId,
      planName,
      status: { $in: ["paid", "active"] }
    }, {
      status: "refunded",
      refundedAt: new Date(),
    });

    // Also update Payment records for this subscription (by relatedPlanId)
    const Payment = (await import('@/models/Payment')).default;
    let payment = await Payment.findOne({ userId, paymentFor: 'pricing-plan', relatedPlanId: plan._id });
    if (!payment) {
      // Create a Payment record if missing (to ensure wallet refund is counted)
      payment = await Payment.create({
        firstName: plan.planName,
        lastName: userId.toString(),
        email: '',
        company: 'FitSyncPro',
        amount: plan.amount,
        currency: 'usd',
        paymentStatus: 'refunded',
        paymentMethodId: 'manual-refund',
        billingAddress: {
          zip: '',
          country: '',
          city: '',
          street: '',
        },
        userId,
        paymentFor: 'pricing-plan',
        relatedPlanId: plan._id,
        refundStatus: 'refunded',
        refundProcessedAt: new Date(),
        refundAmount: refundAmount,
        refundReason: reason,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('[DEBUG] Created missing Payment for subscription refund:', payment);
    } else {
      payment.paymentStatus = 'refunded';
      payment.refundStatus = 'refunded';
      payment.refundProcessedAt = new Date();
      payment.refundAmount = refundAmount;
      payment.refundReason = reason;
      await payment.save();
      console.log('[DEBUG] Updated Payment:', payment);
    }

    // Add refund to wallet (EXACTLY like enrollment refund)
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
            description: `Refund for ${plan.planName}`,
            purchaseId: payment._id.toString(),
            status: 'completed',
            createdAt: new Date(),
          },
        },
      },
      { upsert: true }
    );
    const walletAfter = await Wallet.findOne({ userId });
    console.log('[DEBUG] Wallet after update:', walletAfter);

    return NextResponse.json({ 
      success: true, 
      message: "Subscription cancelled and refunded successfully",
      refundAmount
    });

  } catch (error: any) {
    console.error("❌ Cancel subscription error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to cancel subscription" 
    }, { status: 500 });
  }
} 