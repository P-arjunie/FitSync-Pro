import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Payment from "@/models/Payment";
import PricingPlanPurchase from "@/models/PricingPlanPurchase";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const userId = req.nextUrl.searchParams.get("userId");
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Get all payments for the user
    const payments = await Payment.find({ userId }).sort({ createdAt: -1 });
    
    // Get all pricing plan purchases for the user
    const pricingPlans = await PricingPlanPurchase.find({ userId }).sort({ createdAt: -1 });

    // Group payments by type
    const paymentTypes = payments.reduce((acc, payment) => {
      const type = payment.paymentFor;
      if (!acc[type]) acc[type] = [];
      acc[type].push({
        id: payment._id,
        amount: payment.amount,
        status: payment.paymentStatus,
        createdAt: payment.createdAt,
        stripePaymentIntentId: payment.stripePaymentIntentId
      });
      return acc;
    }, {} as any);

    return NextResponse.json({
      success: true,
      debug: {
        totalPayments: payments.length,
        totalPricingPlans: pricingPlans.length,
        paymentTypes,
        pricingPlans: pricingPlans.map(plan => ({
          id: plan._id,
          planName: plan.planName,
          amount: plan.amount,
          status: plan.status,
          stripeCustomerId: plan.stripeCustomerId,
          createdAt: plan.createdAt
        })),
        allPayments: payments.map(payment => ({
          id: payment._id,
          paymentFor: payment.paymentFor,
          amount: payment.amount,
          status: payment.paymentStatus,
          createdAt: payment.createdAt,
          stripePaymentIntentId: payment.stripePaymentIntentId
        }))
      }
    });

  } catch (error: any) {
    console.error("❌ Debug payments error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to debug payments" 
    }, { status: 500 });
  }
} 