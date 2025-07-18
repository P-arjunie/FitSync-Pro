// app/api/stripe-webhooks/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { connectToDatabase } from "@/lib/mongodb";
import PricingPlanPurchase from "@/models/PricingPlanPurchase";
import Payment from "@/models/Payment";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
 

  const payload = await req.text();
  const sig = req.headers.get("stripe-signature")!;
  let event: Stripe.Event;

  
  try {
    event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
  } catch (err: any) {
    console.error("⚠️ Webhook signature verification failed.", err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  console.log("💥 Received event type:", event.type);

  await connectToDatabase();

  switch (event.type) {
    case "invoice.payment_succeeded": {
      // Cast invoice as any to avoid property errors
      const invoice = event.data.object as any;

      const userId = invoice.metadata?.userId || "unknown";
      const amount = invoice.amount_paid / 100;

      // Use any to access payment_intent safely
      const paymentIntentId =
        typeof invoice.payment_intent === "string"
          ? invoice.payment_intent
          : (invoice.payment_intent?.id as string) || "unknown";

      // Access first line item's price nickname with any
      const lineItem = invoice.lines?.data?.[0] as any;
      const planName = lineItem?.price?.nickname || "Unknown";

      if (!userId || !paymentIntentId) {
        console.warn("Missing userId or paymentIntentId, skipping DB updates.");
        break;
      }

      // Update pricing_plan status
      await PricingPlanPurchase.updateOne(
        { userId, planName },
        { $set: { status: "paid", updatedAt: new Date() } }
      );

      // Insert payment record
      await Payment.create({
        firstName: "Subscription",
        lastName: "User",
        email: "subscription@fitsync.pro",
        company: "FitSync Pro",
        amount,
        currency: "usd",
        paymentStatus: "paid",
        paymentMethodId: "stripe-subscription",
        billingAddress: {
          zip: "00000",
          country: "US",
          city: "N/A",
          street: "N/A",
        },
        userId,
        paymentFor: "pricing-plan",
        stripePaymentIntentId: paymentIntentId,
      });

      console.log(`✅ Subscription payment recorded for user ${userId}`);
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as any;
      const subscriptionId =
        typeof invoice.subscription === "string"
          ? invoice.subscription
          : invoice.subscription?.id;

      console.log(`❌ Invoice payment failed for subscription ${subscriptionId}`);
      break;
    }

    default:
      console.log(`ℹ️ Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
