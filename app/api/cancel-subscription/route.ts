import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import mongoose from "mongoose";
import PricingPlanPurchase from "@/models/PricingPlanPurchase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

const connectToDB = async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("✅ MongoDB connected (cancel subscription)");
  }
};

export async function POST(req: NextRequest) {
  try {
    await connectToDB();

    const body = await req.json();
    const { userId, planName } = body;

    if (!userId || !planName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Find the pricing plan purchase
    const plan = await PricingPlanPurchase.findOne({ 
      userId, 
      planName,
      status: "paid"
    });

    if (!plan) {
      return NextResponse.json({ error: "Active subscription not found" }, { status: 404 });
    }

    // Update the plan status in database
    await PricingPlanPurchase.findByIdAndUpdate(plan._id, {
      status: "cancelled",
      cancelledAt: new Date(),
    });

    return NextResponse.json({ 
      success: true, 
      message: "Subscription cancelled successfully"
    });

  } catch (error: any) {
    console.error("❌ Cancel subscription error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to cancel subscription" 
    }, { status: 500 });
  }
} 