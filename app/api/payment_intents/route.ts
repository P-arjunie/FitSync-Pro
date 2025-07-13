// app/api/payment_intents/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import mongoose from "mongoose";
import Payment from "@/models/Payment";
import Order from "@/models/order";
import Enrollment from "@/models/enrollment";
import PricingPlanPurchase from "@/models/PricingPlanPurchase";

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

      amount = Math.round(plan.amount * 100);
      itemTitle = plan.planName || "Pricing Plan";

    } else {
      return NextResponse.json({ error: "Invalid paymentFor value" }, { status: 400 });
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      payment_method: paymentMethodId,
      confirm: true,
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
    });

    if (paymentIntent.status === "succeeded") {
      // Save payment in kalana_paymentsses collection
      const newPayment = new Payment({
        firstName: itemTitle,
        lastName: userId.toString(),
        email: "placeholder@example.com",
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

      // Update respective document status
      if (paymentFor === "pricing_plan") {
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
