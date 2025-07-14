// app/api/pricing-plan-purchase/route.ts
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import PricingPlanPurchase from '@/models/PricingPlanPurchase';

const connectToDB = async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!);
  }
};

export async function POST(req: NextRequest) {
  try {
    await connectToDB();
    const { userId, planName, amount } = await req.json();

    if (!userId || !planName || !amount) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const plan = new PricingPlanPurchase({
      userId,
      planName,
      amount,
      status: 'pending',
    });

    await plan.save();

    return NextResponse.json({ success: true, planId: plan._id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
