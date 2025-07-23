import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Payment from "@/models/Payment";
import Order from "@/models/order";
import Enrollment from "@/models/enrollment";
import PricingPlanPurchase from "@/models/PricingPlanPurchase";
import MonthlyPlan from "@/models/MonthlyPlan";

const connectToDB = async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!, { dbName: 'fit-sync' });
    console.log('✅ MongoDB connected (purchase history)');
    console.log('🔎 [DEBUG] mongoose.connection.name:', mongoose.connection.name);
  }
};

export async function GET(req: NextRequest) {
  try {
    await connectToDB();
    console.log('🔎 [DEBUG] mongoose.connection.name:', mongoose.connection.name);

    const userId = req.nextUrl.searchParams.get("userId");
    const userEmail = req.nextUrl.searchParams.get("userEmail");
    
    if (!userId && !userEmail) {
      return NextResponse.json({ error: "User ID or email is required" }, { status: 400 });
    }

    // Fetch only successful payments
    const payments = await Payment.find({
      $and: [
        userId ? { userId } : {},
        { hiddenForUser: { $ne: true } },
        {
          $or: [
            { paymentStatus: { $in: ["paid", "succeeded"] } },
            { refundStatus: "refunded" }
          ]
        }
      ]
    }).sort({ createdAt: -1 });

    const purchaseHistory = payments.map(payment => {
      let remainingTime = null;
      if (payment.paymentFor === 'pricing-plan' && payment.refundStatus !== 'refunded') {
        const start = payment.createdAt ? new Date(payment.createdAt) : (payment.updatedAt ? new Date(payment.updatedAt) : new Date());
        const now = new Date();
        const end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
        const msLeft = end.getTime() - now.getTime();
        if (msLeft > 0) {
          const days = Math.floor(msLeft / (24 * 60 * 60 * 1000));
          const hours = Math.floor((msLeft % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
          remainingTime = { days, hours };
        }
      }
      return {
        id: payment._id,
        paymentId: payment._id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.paymentStatus,
        paymentFor: payment.paymentFor,
        itemType: payment.paymentFor === 'pricing-plan' ? 'Subscription Plan' : payment.paymentFor === 'monthly-plan' ? 'Monthly Plan' : payment.paymentFor === 'enrollment' ? 'Class Enrollment' : 'Store Purchase',
        itemDetails: {
          title: payment.firstName || (payment.paymentFor === 'pricing-plan' ? 'Subscription Plan' : payment.paymentFor === 'monthly-plan' ? 'Monthly Plan' : payment.paymentFor === 'enrollment' ? 'Class Enrollment' : 'Store Purchase'),
          planName: payment.paymentFor === 'pricing-plan' ? payment.firstName : undefined,
          ...payment,
        },
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
        remainingTime,
      };
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