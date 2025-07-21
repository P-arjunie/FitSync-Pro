import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Payment from "@/models/Payment";
import Order from "@/models/order";
import Enrollment from "@/models/enrollment";
import PricingPlanPurchase from "@/models/PricingPlanPurchase";
import MonthlyPlan from "@/models/MonthlyPlan";

const connectToDB = async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("✅ MongoDB connected (purchase history)");
  }
};

export async function GET(req: NextRequest) {
  try {
    await connectToDB();

    const userId = req.nextUrl.searchParams.get("userId");
    const userEmail = req.nextUrl.searchParams.get("userEmail");
    
    if (!userId && !userEmail) {
      return NextResponse.json({ error: "User ID or email is required" }, { status: 400 });
    }

    // Fetch all payments for the user by userId
    let payments = [];
    if (userId) {
      payments = await Payment.find({ userId }).sort({ createdAt: -1 });
    }

    // If no payments found and email is provided, try by email (legacy support)
    if (payments.length === 0 && userEmail) {
      payments = await Payment.find({ email: userEmail }).sort({ createdAt: -1 });
    }

    // Fetch additional details for each payment
    const purchaseHistory = await Promise.all(
      payments.map(async (payment) => {
        const paymentDoc = payment.toObject();
        let itemDetails = null;
        let itemType = "";
        let remainingTime = null;
        let canRefund = false;
        let refundAmount = 0;
        let isActive = false;

        if (payment.paymentFor === "order" && payment.relatedOrderId) {
          const order = await Order.findById(payment.relatedOrderId);
          if (order) {
            itemDetails = {
              title: order.orderItems?.[0]?.title || "Store Purchase",
              items: order.orderItems,
              orderNumber: order.orderNumber,
            };
            itemType = "Store Purchase";
            // Store purchases cannot be refunded - only email notification
            canRefund = false;
            refundAmount = 0;
          }
        } else if (payment.paymentFor === "enrollment" && payment.relatedEnrollmentId) {
          const enrollment = await Enrollment.findById(payment.relatedEnrollmentId);
          if (enrollment) {
            itemDetails = {
              title: enrollment.className,
              className: enrollment.className,
            };
            itemType = "Class Enrollment";
            
            // Calculate remaining time for class enrollment (30 days from purchase)
            const purchaseDate = new Date(paymentDoc.createdAt || new Date());
            const endDate = new Date(purchaseDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days
            const now = new Date();
            
            if (now < endDate) {
              isActive = true;
              const remainingMs = endDate.getTime() - now.getTime();
              const remainingDays = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
              const remainingHours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
              remainingTime = { days: remainingDays, hours: remainingHours };
              
              // Can refund within first 7 days of purchase
              const daysSincePurchase = Math.floor((now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
              canRefund = daysSincePurchase <= 7;
              refundAmount = canRefund ? payment.amount * 0.25 : 0; // 25% refund for class enrollments
            }
          }
        } else if (payment.paymentFor === "pricing-plan") {
          console.log(`🔍 Processing pricing plan payment: ${payment._id}`);
          
          // Find pricing plan by matching userId and amount, or by stripeCustomerId
          const plan = await PricingPlanPurchase.findOne({ 
            userId: payment.userId,
            $or: [
              { stripeCustomerId: { $exists: true } },
              { amount: payment.amount }
            ]
          }).sort({ createdAt: -1 });
          
          console.log(`📋 Found plan:`, plan ? plan.planName : 'No plan found');
          
          if (plan) {
            itemDetails = {
              title: plan.planName,
              planName: plan.planName,
              status: plan.status,
            };
            itemType = "Subscription Plan";
            isActive = plan.status === "paid" || plan.status === "active";
            // No refunds for subscription plans
            canRefund = false;
            refundAmount = 0;
          } else {
            // If no plan found, create basic details from payment
            console.log(`⚠️ No plan found for payment, creating basic details`);
            itemDetails = {
              title: "Subscription Plan",
              planName: "Subscription Plan",
              status: payment.paymentStatus,
            };
            itemType = "Subscription Plan";
            isActive = payment.paymentStatus === "succeeded" || payment.paymentStatus === "paid";
            canRefund = false;
            refundAmount = 0;
          }
        } else if (payment.paymentFor === "monthly-plan") {
          const monthlyPlan = await MonthlyPlan.findOne({ 
            userId: payment.userId,
            status: "active"
          }).sort({ createdAt: -1 });
          
          if (monthlyPlan) {
            const now = new Date();
            const nextRenewal = new Date(monthlyPlan.nextRenewalDate);
            const timeUntilRenewal = nextRenewal.getTime() - now.getTime();
            
            if (timeUntilRenewal > 0) {
              const daysUntilRenewal = Math.floor(timeUntilRenewal / (1000 * 60 * 60 * 24));
              const hoursUntilRenewal = Math.floor((timeUntilRenewal % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
              
              remainingTime = { days: daysUntilRenewal, hours: hoursUntilRenewal };
              isActive = true;
            }
            
            itemDetails = {
              title: monthlyPlan.planName,
              planName: monthlyPlan.planName,
              planType: monthlyPlan.planType,
              className: monthlyPlan.className,
              status: monthlyPlan.status,
              nextRenewalDate: monthlyPlan.nextRenewalDate,
            };
            itemType = "Monthly Plan";
            
            // Monthly plans can be cancelled but not refunded
            canRefund = false;
            refundAmount = 0;
          }
        }

        return {
          id: payment._id,
          paymentId: payment.stripePaymentIntentId,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.paymentStatus,
          paymentFor: payment.paymentFor,
          itemType,
          itemDetails,
          createdAt: paymentDoc.createdAt?.toISOString() || new Date().toISOString(),
          updatedAt: paymentDoc.updatedAt?.toISOString() || new Date().toISOString(),
          remainingTime,
          canRefund: canRefund && payment.refundStatus === 'none',
          refundAmount,
          isActive,
          refundStatus: payment.refundStatus || 'none',
          refundRequestedAt: payment.refundRequestedAt ? payment.refundRequestedAt.toISOString() : undefined,
          refundProcessedAt: payment.refundProcessedAt ? payment.refundProcessedAt.toISOString() : undefined,
          refundReason: payment.refundReason,
        };
      })
    );

    // Filter out items with null details and add debugging
    const filteredHistory = purchaseHistory.filter(item => item.itemDetails !== null);
    
    console.log(`📊 Purchase History Summary:`);
    console.log(`- Total payments found: ${payments.length}`);
    console.log(`- Processed items: ${filteredHistory.length}`);
    console.log(`- Payment types:`, payments.map(p => p.paymentFor));
    
    return NextResponse.json({ 
      success: true, 
      purchaseHistory: filteredHistory
    });

  } catch (error: any) {
    console.error("❌ Purchase history fetch error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to fetch purchase history" 
    }, { status: 500 });
  }
} 