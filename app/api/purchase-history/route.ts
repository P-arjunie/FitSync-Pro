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
  const start = payment.createdAt ? new Date(payment.createdAt) : (payment.updatedAt ? new Date(payment.updatedAt) : new Date());
  const now = new Date();
  const end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
  const msLeft = end.getTime() - now.getTime();
  if (msLeft > 0) {
    const days = Math.floor(msLeft / (24 * 60 * 60 * 1000));
    const hours = Math.floor((msLeft % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    return { days, hours };
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

    // Fetch all successful or refunded payments
    const payments = await Payment.find({
      userId,
      $or: [
        { paymentStatus: { $in: ["paid", "succeeded", "active"] } },
        { refundStatus: "refunded" }
      ]
    }).sort({ createdAt: -1 });

    // Filter and limit for the 4 requirements
    let classEnrollments = payments.filter((p: any) =>
      p.paymentFor === 'enrollment' &&
      (!p.refundStatus || p.refundStatus === 'none') &&
      getRemainingTime(p)
    );
    // Limit to 2 active enrollments
    classEnrollments = classEnrollments.slice(0, 2);

    let subscriptionPlans = payments.filter((p: any) =>
      p.paymentFor === 'pricing-plan' &&
      (!p.refundStatus || p.refundStatus === 'none') &&
      (p.paymentStatus === 'paid' || p.paymentStatus === 'active' || p.paymentStatus === 'succeeded') &&
      getRemainingTime(p)
    );

    // Map to unified format compatible with frontend
    function mapPayment(payment: any) {
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
        isActive: payment.paymentStatus === 'paid' || payment.paymentStatus === 'succeeded' || payment.paymentStatus === 'active',
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
    }

    // IDs of the 4-key items to avoid duplicates
    const keyIds = new Set([
      ...classEnrollments.map((p: any) => String(p._id)),
      ...subscriptionPlans.map((p: any) => String(p._id)),
    ]);

    // All payments, mapped
    const allPaymentsMapped = payments.map(mapPayment);
    // Filter out the ones already shown as key items
    const restPayments = allPaymentsMapped.filter(p => !keyIds.has(String(p.id)));

    // Show the 4 key items first, then the rest
    const purchaseHistory = [
      ...classEnrollments.map(mapPayment),
      ...subscriptionPlans.map(mapPayment),
      ...restPayments,
    ];

    // Summary stats
    const totalSpent = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
    const totalPurchases = payments.length;
    const activeClasses = classEnrollments.length;
    const activeSubscriptions = subscriptionPlans.length;
    const activeClassNames = classEnrollments.map((p: any) => p.className || p.itemDetails?.className || p.firstName).filter(Boolean);
    const activeSubscriptionNames = subscriptionPlans.map((p: any) => p.planName || p.itemDetails?.planName || p.firstName).filter(Boolean);

    return NextResponse.json({
      success: true,
      summary: {
        totalSpent,
        totalPurchases,
        activeClasses,
        activeSubscriptions,
        activeClassNames,
        activeSubscriptionNames,
      },
      purchaseHistory,
    });
  } catch (error: any) {
    console.error("❌ Purchase history fetch error:", error);
    return NextResponse.json({
      error: error.message || "Failed to fetch purchase history"
    }, { status: 500 });
  }
} 