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

export async function GET(req: NextRequest) {
  // Health check endpoint for Stripe webhook
  return NextResponse.json({ status: "ok" });
}

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
    case "checkout.session.completed": {
      const session = event.data.object as any;
      const userId = session.metadata?.userId || session.client_reference_id || "unknown";
      const planName = session.metadata?.planName || session.display_items?.[0]?.custom?.name || "Unknown";
      const planId = session.metadata?.planId;
      const email = session.customer_details?.email || session.customer_email || "subscription@fitsync.pro";
      const amount = session.amount_total ? session.amount_total / 100 : 0;
      const paymentIntentId = session.payment_intent || session.id;
      console.log("[checkout.session.completed]", { userId, planName, planId, email, amount, paymentIntentId });

      // Update pricing plan status if planId is present
      if (planId) {
        await PricingPlanPurchase.findByIdAndUpdate(planId, {
          status: "paid",
          updatedAt: new Date(),
        });
        console.log(`✅ Updated pricing plan ${planId} to paid`);
      } else if (userId && planName) {
        await PricingPlanPurchase.updateOne(
          { userId, planName },
          { $set: { status: "paid", updatedAt: new Date() } }
        );
        console.log(`✅ Updated pricing plan for user ${userId}, plan ${planName} to paid`);
      }

      // Create payment record if not exists
      const existingPayment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });
      if (!existingPayment) {
        await Payment.create({
          firstName: "Subscription",
          lastName: "User",
          email,
          company: "FitSync Pro",
          amount,
          currency: "usd",
          paymentStatus: "paid",
          paymentMethodId: "stripe-checkout",
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
        console.log(`✅ Created payment record for checkout.session.completed`);
      } else {
        console.log(`ℹ️ Payment record already exists for checkout.session.completed`);
      }
      break;
    }
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

      console.log(`🔍 Processing invoice.payment_succeeded:`);
      console.log(`- User ID: ${userId}`);
      console.log(`- Amount: ${amount}`);
      console.log(`- Payment Intent ID: ${paymentIntentId}`);
      console.log(`- Plan Name: ${planName}`);

      if (!userId || !paymentIntentId) {
        console.warn("Missing userId or paymentIntentId, skipping DB updates.");
        break;
      }

      // Find and update pricing plan by multiple criteria
      const pricingPlan = await PricingPlanPurchase.findOne({
        userId,
        $or: [
          { planName: planName },
          { planName: { $regex: planName, $options: 'i' } },
          { amount: amount }
        ]
      });

      if (pricingPlan) {
        console.log(`📋 Found pricing plan: ${pricingPlan.planName}`);
        
        // Update pricing_plan status
        await PricingPlanPurchase.findByIdAndUpdate(
          pricingPlan._id,
          { 
            $set: { 
              status: "paid", 
              updatedAt: new Date() 
            } 
          }
        );
        console.log(`✅ Updated pricing plan status to paid`);

        // Check if payment record already exists
        const existingPayment = await Payment.findOne({ 
          stripePaymentIntentId: paymentIntentId 
        });

        if (!existingPayment) {
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
          console.log(`✅ Created payment record in kalana_paymentsses`);
        } else {
          console.log(`ℹ️ Payment record already exists`);
        }
      } else {
        console.warn(`⚠️ No pricing plan found for user ${userId}, plan ${planName}, amount ${amount}`);
        
        // Still create payment record even if plan not found
        const existingPayment = await Payment.findOne({ 
          stripePaymentIntentId: paymentIntentId 
        });

        if (!existingPayment) {
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
          console.log(`✅ Created payment record without matching plan`);
        }
      }

      console.log(`✅ Subscription payment processed for user ${userId}`);
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
