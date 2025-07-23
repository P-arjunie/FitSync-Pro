import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

export async function POST(req: NextRequest) {
  try {
    const { priceId, userId, planName, planId, email } = await req.json();

    if (!priceId || !userId || !email) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Create or retrieve customer
    const customers = await stripe.customers.list({ email });
    let customer = customers.data[0];
    if (!customer) {
      customer = await stripe.customers.create({
        email,
        metadata: { userId },
      });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        metadata: { userId, planId, planName },
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/fitness-activities-and-orders/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/fitness-activities-and-orders/pricing_page`,
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (err: any) {
    console.error("Error creating checkout session:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
