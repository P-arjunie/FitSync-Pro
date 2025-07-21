import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import MonthlyPlan from "@/models/MonthlyPlan";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const monthlyPlans = await MonthlyPlan.find({ userId }).sort({ createdAt: -1 });
    
    return NextResponse.json({ monthlyPlans });
  } catch (error: any) {
    console.error("❌ Error fetching monthly plans:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to fetch monthly plans" 
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await req.json();
    const { 
      userId, 
      planName, 
      planType, 
      className, 
      amount, 
      startDate, 
      endDate, 
      nextRenewalDate,
      stripeCustomerId,
      stripeSubscriptionId 
    } = body;

    if (!userId || !planName || !planType || !amount || !startDate || !endDate || !nextRenewalDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const monthlyPlan = new MonthlyPlan({
      userId,
      planName,
      planType,
      className,
      amount,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      nextRenewalDate: new Date(nextRenewalDate),
      stripeCustomerId,
      stripeSubscriptionId,
      status: 'active',
      autoRenew: true
    });

    await monthlyPlan.save();
    
    return NextResponse.json({ 
      success: true, 
      monthlyPlan 
    });
  } catch (error: any) {
    console.error("❌ Error creating monthly plan:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to create monthly plan" 
    }, { status: 500 });
  }
} 