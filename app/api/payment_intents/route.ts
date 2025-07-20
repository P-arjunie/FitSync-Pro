// app/api/payment_intents/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import mongoose from "mongoose";
import Payment from "@/models/Payment";
import Order from "@/models/order";
import Enrollment from "@/models/enrollment";
import PricingPlanPurchase from "@/models/PricingPlanPurchase";
import User from "@/models/User";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

const connectToDB = async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("✅ MongoDB connected (payments)");
  }
};

export async function POST(req: NextRequest) {
  try {
    await connectToDB();

    const body = await req.json();
    const { paymentMethodId, userId, paymentFor, enrollmentId, pricingPlanId } = body;

    if (!paymentMethodId || !userId || !paymentFor) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
    }

    // Get user email for customer creation
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let amount = 0;
    let itemTitle = "";
    let relatedOrderId = null;
    let relatedEnrollmentId = null;

    if (paymentFor === "enrollment") {
      if (!enrollmentId || !mongoose.Types.ObjectId.isValid(enrollmentId)) {
        return NextResponse.json({ error: "Invalid enrollmentId" }, { status: 400 });
      }

      const enrollment = await Enrollment.findById(enrollmentId);
      if (!enrollment) {
        return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
      }

      amount = Math.round(enrollment.totalAmount * 100);
      itemTitle = enrollment.className;
      relatedEnrollmentId = enrollment._id;

    } else if (paymentFor === "order") {
      const latestOrder = await Order.findOne({ user: userId }).sort({ createdAt: -1 });
      if (!latestOrder) {
        return NextResponse.json({ error: "No order found" }, { status: 404 });
      }

      amount = Math.round(latestOrder.totalAmount * 100);
      itemTitle = latestOrder.orderItems?.[0]?.title || "Order";
      relatedOrderId = latestOrder._id;

    } else if (paymentFor === "pricing-plan") {
      if (!pricingPlanId || !mongoose.Types.ObjectId.isValid(pricingPlanId)) {
        return NextResponse.json({ error: "Invalid pricingPlanId" }, { status: 400 });
      }

      const plan = await PricingPlanPurchase.findById(pricingPlanId);
      if (!plan) {
        return NextResponse.json({ error: "Pricing plan not found" }, { status: 404 });
      }

      const priceId = plan.priceId;
      if (!priceId) {
        return NextResponse.json({ error: "Missing priceId in pricing plan" }, { status: 400 });
      }

      if (!plan.stripeCustomerId) {
        return NextResponse.json({ error: "Missing Stripe customer ID in pricing plan" }, { status: 400 });
      }

      // Optional: update status to pending before subscription creation
      await PricingPlanPurchase.findByIdAndUpdate(pricingPlanId, { status: "pending" });

      const subscription = await stripe.subscriptions.create({
        customer: plan.stripeCustomerId,
        items: [{ price: priceId }],
        metadata: {
          userId: userId,
          pricingPlanId: pricingPlanId.toString(),
        },
        payment_behavior: "default_incomplete",
        expand: ["latest_invoice.payment_intent"],
      });

      const invoice = subscription.latest_invoice;
      let paymentIntent = null;
      if (typeof invoice !== "string" && invoice && "payment_intent" in invoice && invoice.payment_intent) {
        paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;
      } else {
        return NextResponse.json({ error: "Invoice.payment_intent missing" }, { status: 500 });
      }

      amount = paymentIntent.amount;
      itemTitle = plan.planName || "Pricing Plan";

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        subscriptionId: subscription.id,
      });
    } else {
      return NextResponse.json({ error: "Invalid paymentFor value" }, { status: 400 });
    }

    // Create or retrieve Stripe customer for enrollment and order payments
    const customers = await stripe.customers.list({ email: user.email });
    let customer = customers.data[0];
    if (!customer) {
      customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId },
      });
    }

    // For enrollment and order, create payment intent with customer
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      customer: customer.id,
      payment_method: paymentMethodId,
      confirm: true,
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      metadata: {
        userId: userId,
        paymentFor: paymentFor,
        itemTitle: itemTitle,
      },
    });

    if (paymentIntent.status === "succeeded") {
      const newPayment = new Payment({
        firstName: itemTitle,
        lastName: userId.toString(),
        email: user.email,
        company: "FitSyncPro",
        amount: amount / 100,
        currency: "usd",
        paymentStatus: "succeeded",
        paymentMethodId,
        billingAddress: {
          zip: "10100",
          country: "USA",
          city: "New York",
          street: "456 Real Street",
        },
        userId,
        paymentFor,
        relatedOrderId,
        relatedEnrollmentId,
        stripePaymentIntentId: paymentIntent.id,
      });

      await newPayment.save();

      if (paymentFor === "pricing-plan") {
        await PricingPlanPurchase.findByIdAndUpdate(pricingPlanId, { status: "paid" });
      }

      if (relatedOrderId) {
        await Order.findByIdAndUpdate(relatedOrderId, { status: "paid" });
      }

      if (relatedEnrollmentId) {
        await Enrollment.findByIdAndUpdate(relatedEnrollmentId, { status: "paid" });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: `Payment failed with status: ${paymentIntent.status}` },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("❌ Payment processing error:", error);
    return NextResponse.json({ error: error.message || "Payment processing failed" }, { status: 500 });
  }
}
