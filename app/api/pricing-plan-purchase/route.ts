import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Stripe from 'stripe';
import PricingPlanPurchase from '@/models/PricingPlanPurchase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

const connectToDB = async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!);
  }
};

export async function POST(req: NextRequest) {
  try {
    await connectToDB();
    const { userId, planName, amount, priceId, email } = await req.json();

    if (!userId || !planName || !amount || !priceId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Create or retrieve Stripe customer
    let stripeCustomerId = null;
    if (email) {
      const customers = await stripe.customers.list({ email });
      let customer = customers.data[0];
      if (!customer) {
        customer = await stripe.customers.create({
          email,
          metadata: { userId },
        });
      }
      stripeCustomerId = customer.id;
    }

    const plan = new PricingPlanPurchase({
      userId,
      planName,
      amount,
      priceId,
      status: 'pending',
      stripeCustomerId,
    });

    await plan.save();

    return NextResponse.json({ success: true, planId: plan._id });
  } catch (err: any) {
    console.error('Pricing plan purchase error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
