import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Payment from "@/models/Payment";

const connectToDB = async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!, { dbName: 'fit-sync' });
    console.log('✅ MongoDB connected (purchase history)');
    console.log('🔎 [DEBUG] mongoose.connection.name:', mongoose.connection.name);
  }
};

function getRemainingTime(payment: any) {
  if ((payment.paymentFor === 'pricing-plan' || payment.paymentFor === 'monthly-plan') && payment.refundStatus !== 'refunded') {
    const start = payment.createdAt ? new Date(payment.createdAt) : (payment.updatedAt ? new Date(payment.updatedAt) : new Date());
    const now = new Date();
    const end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
    const msLeft = end.getTime() - now.getTime();
    if (msLeft > 0) {
      const days = Math.floor(msLeft / (24 * 60 * 60 * 1000));
      const hours = Math.floor((msLeft % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      return { days, hours };
    }
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    await connectToDB();
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Fetch only successful or refunded payments from kalana_paymentsses
    const payments = await Payment.find({
      userId,
      $or: [
        { paymentStatus: { $in: ["paid", "succeeded"] } },
        { refundStatus: "refunded" }
      ]
    }).sort({ createdAt: -1 });

    // Map to unified format compatible with frontend
    const purchaseHistory = payments.map((payment: any) => {
      const base: any = {
        id: payment._id,
        paymentId: payment._id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.paymentStatus,
        paymentFor: payment.paymentFor,
        itemType: payment.paymentFor === 'pricing-plan' ? 'Subscription Plan' : payment.paymentFor === 'monthly-plan' ? 'Monthly Plan' : payment.paymentFor === 'enrollment' ? 'Class Enrollment' : 'Store Purchase',
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
        canRefund: payment.refundStatus === 'none',
        refundAmount:
          payment.paymentFor === 'enrollment' || payment.paymentFor === 'pricing-plan'
            ? Math.round((payment.amount || 0) * 0.25 * 100) / 100
            : 0,
        isActive: payment.paymentStatus === 'paid' || payment.paymentStatus === 'succeeded',
        refundStatus: payment.refundStatus || 'none',
        refundRequestedAt: payment.refundRequestedAt,
        refundProcessedAt: payment.refundProcessedAt,
        refundReason: payment.refundReason,
        remainingTime: getRemainingTime(payment),
      };
      // Add itemDetails based on paymentFor
      if (payment.paymentFor === 'order') {
        base.itemDetails = {
          title: payment.firstName || 'Store Purchase',
          orderNumber: payment.relatedOrderId || undefined,
          items: payment.items || [],
        };
      } else if (payment.paymentFor === 'enrollment') {
        base.itemDetails = {
          title: payment.firstName || 'Class Enrollment',
          className: payment.className || undefined,
        };
      } else if (payment.paymentFor === 'pricing-plan') {
        base.itemDetails = {
          title: payment.firstName || 'Subscription Plan',
          planName: payment.firstName || undefined,
          priceId: payment.priceId || undefined,
        };
      } else if (payment.paymentFor === 'monthly-plan') {
        base.itemDetails = {
          title: payment.firstName || 'Monthly Plan',
        };
      } else {
        base.itemDetails = {
          title: payment.firstName || 'Purchase',
        };
      }
      return base;
    });

    return NextResponse.json({
      success: true,
      purchaseHistory,
    });
  } catch (error: any) {
    console.error("❌ Purchase history fetch error:", error);
    return NextResponse.json({
      error: error.message || "Failed to fetch purchase history"
    }, { status: 500 });
  }
} 