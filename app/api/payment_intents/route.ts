import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { paymentMethodId } = body;

    if (!paymentMethodId) {
      return NextResponse.json({ error: "Payment method ID is required" }, { status: 400 });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1000, // $10.00
      currency: "usd",
      payment_method: paymentMethodId,
      confirmation_method: "manual",
      confirm: true,
      return_url: `${req.nextUrl.origin}/payment/complete`,
    });

    if (paymentIntent.status === "requires_action" && paymentIntent.next_action?.type === "redirect_to_url") {
      return NextResponse.json({
        requiresAction: true,
        clientSecret: paymentIntent.client_secret,
        nextAction: paymentIntent.next_action,
      });
    }

    if (paymentIntent.status === "succeeded") {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: `Unexpected status: ${paymentIntent.status}` },
      { status: 500 }
    );
  } catch (error: any) {
    console.error("Stripe error:", error);  // Log error on the server
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
