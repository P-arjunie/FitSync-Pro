import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import PricingPlanPurchase from "@/models/PricingPlanPurchase";
import Payment from "@/models/Payment";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await req.json();
    const { userId, planId } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    let query: any = { userId };
    if (planId) {
      query = { _id: planId, userId };
    }

    // Find pending pricing plans
    const pendingPlans = await PricingPlanPurchase.find({
      ...query,
      status: "pending"
    });

    console.log(`🔍 Found ${pendingPlans.length} pending pricing plans for user ${userId}`);

    const results = [];

    for (const plan of pendingPlans) {
      try {
        // Check if payment record already exists
        const existingPayment = await Payment.findOne({
          userId: plan.userId,
          paymentFor: "pricing-plan",
          amount: plan.amount
        });

        if (!existingPayment) {
          // Create payment record
          const payment = await Payment.create({
            firstName: "Subscription",
            lastName: "User",
            email: "subscription@fitsync.pro",
            company: "FitSync Pro",
            amount: plan.amount,
            currency: "usd",
            paymentStatus: "paid",
            paymentMethodId: "stripe-subscription",
            billingAddress: {
              zip: "00000",
              country: "US",
              city: "N/A",
              street: "N/A",
            },
            userId: plan.userId,
            paymentFor: "pricing-plan",
            stripePaymentIntentId: `manual_fix_${plan._id}`,
          });

          console.log(`✅ Created payment record for plan ${plan.planName}`);
        }

        // Update plan status to paid
        await PricingPlanPurchase.findByIdAndUpdate(plan._id, {
          status: "paid",
          updatedAt: new Date()
        });

        console.log(`✅ Updated plan ${plan.planName} status to paid`);

        results.push({
          planId: plan._id,
          planName: plan.planName,
          status: "fixed",
          paymentCreated: !existingPayment
        });

      } catch (error: any) {
        console.error(`❌ Error fixing plan ${plan.planName}:`, error);
        results.push({
          planId: plan._id,
          planName: plan.planName,
          status: "error",
          error: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${pendingPlans.length} pending plans`,
      results
    });

  } catch (error: any) {
    console.error("❌ Fix pending pricing plans error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to fix pending pricing plans" 
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const userId = req.nextUrl.searchParams.get("userId");
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Get all pricing plans for the user
    const allPlans = await PricingPlanPurchase.find({ userId });
    const pendingPlans = allPlans.filter(plan => plan.status === "pending");
    const paidPlans = allPlans.filter(plan => plan.status === "paid");

    // Get all payments for the user
    const allPayments = await Payment.find({ userId });
    const pricingPlanPayments = allPayments.filter(payment => payment.paymentFor === "pricing-plan");

    return NextResponse.json({
      success: true,
      summary: {
        totalPlans: allPlans.length,
        pendingPlans: pendingPlans.length,
        paidPlans: paidPlans.length,
        totalPayments: allPayments.length,
        pricingPlanPayments: pricingPlanPayments.length
      },
      pendingPlans: pendingPlans.map(plan => ({
        id: plan._id,
        planName: plan.planName,
        amount: plan.amount,
        status: plan.status,
        createdAt: plan.createdAt
      })),
      paidPlans: paidPlans.map(plan => ({
        id: plan._id,
        planName: plan.planName,
        amount: plan.amount,
        status: plan.status,
        createdAt: plan.createdAt
      })),
      pricingPlanPayments: pricingPlanPayments.map(payment => ({
        id: payment._id,
        amount: payment.amount,
        status: payment.paymentStatus,
        stripePaymentIntentId: payment.stripePaymentIntentId,
        createdAt: payment.createdAt
      }))
    });

  } catch (error: any) {
    console.error("❌ Get pricing plans status error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to get pricing plans status" 
    }, { status: 500 });
  }
} 