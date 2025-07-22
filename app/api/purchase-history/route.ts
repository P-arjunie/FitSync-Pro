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

    // Fetch orders
    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
    // Fetch enrollments
    const enrollments = await Enrollment.find({ userId }).sort({ createdAt: -1 });
    // Fetch pricing plans
    const pricingPlans = await PricingPlanPurchase.find({ userId }).sort({ createdAt: -1 });
    // Fetch summary/payments
    const payments = await Payment.find({ userId, hiddenForUser: { $ne: true } }).sort({ createdAt: -1 });

    // Helper: find refund status for order/enrollment from Payment
    function getRefundStatusFor(type: string, id: string) {
      const match = payments.find(p => {
        if (type === 'order') return p.relatedOrderId && p.relatedOrderId.toString() === id.toString();
        if (type === 'enrollment') return p.relatedEnrollmentId && p.relatedEnrollmentId.toString() === id.toString();
        return false;
      });
      return match ? (match.refundStatus || 'none') : 'none';
    }
    function getRefundAmountFor(type: string, amount: number) {
      // Example: 25% refund for all types (customize as needed)
      return Math.round(amount * 0.25 * 100) / 100;
    }
    // Build purchase history array
    const purchaseHistory = [
      ...orders.map(order => {
        const refundStatus = getRefundStatusFor('order', order._id);
        return {
          id: order._id,
          paymentId: order._id,
          amount: order.totalAmount,
          currency: 'usd',
          status: order.status,
          paymentFor: 'order',
          itemType: 'Store Purchase',
          itemDetails: {
            title: order.orderItems?.[0]?.title || 'Store Purchase',
            ...order,
          },
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          canRefund: false,
          refundAmount: 0,
          isActive: order.status === 'paid' || order.status === 'completed',
          refundStatus,
        };
      }),
      ...enrollments.map(enrollment => {
        const refundStatus = getRefundStatusFor('enrollment', enrollment._id);
        return {
          id: enrollment._id,
          paymentId: enrollment._id,
          amount: enrollment.totalAmount,
          currency: 'usd',
          status: enrollment.status,
          paymentFor: 'enrollment',
          itemType: 'Class Enrollment',
          itemDetails: {
            title: enrollment.className,
            ...enrollment,
          },
          createdAt: enrollment.createdAt,
          updatedAt: enrollment.updatedAt,
          canRefund: refundStatus === 'none',
          refundAmount: getRefundAmountFor('enrollment', enrollment.totalAmount),
          isActive: enrollment.status === 'paid' || enrollment.status === 'completed',
          refundStatus,
        };
      }),
      ...payments
        .filter(payment => {
          // Only allow paymentFor 'pricing-plan' or 'monthly-plan'
          const pf = (payment.paymentFor || '').trim().toLowerCase();
          if (pf !== 'pricing-plan' && pf !== 'monthly-plan') return false;
          if ((payment.firstName || '').trim().toLowerCase() === 'purchase') return false;
          return true;
        })
        .map(payment => {
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
            itemType: payment.paymentFor === 'pricing-plan' ? 'Subscription Plan' : 'Monthly Plan',
            itemDetails: {
              title: payment.firstName || (payment.paymentFor === 'pricing-plan' ? 'Subscription Plan' : 'Monthly Plan'),
              planName: payment.paymentFor === 'pricing-plan' ? payment.firstName : undefined,
              ...payment,
            },
            createdAt: payment.createdAt,
            updatedAt: payment.updatedAt,
            canRefund: payment.refundStatus === 'none',
            refundAmount: getRefundAmountFor(payment.paymentFor, payment.amount),
            isActive: payment.paymentStatus === 'paid' || payment.paymentStatus === 'succeeded',
            refundStatus: payment.refundStatus || 'none',
            refundRequestedAt: payment.refundRequestedAt,
            refundProcessedAt: payment.refundProcessedAt,
            refundReason: payment.refundReason,
            remainingTime,
          };
        }),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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