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
  }
};

export async function POST(req: NextRequest) {
  try {
    await connectToDB();

    const body = await req.json();
    const { paymentMethodId, userId, paymentFor, enrollmentId, pricingPlanId, email } = body;

    if (!paymentMethodId || !userId || !paymentFor) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Trust the userId and email from the frontend
    if (!email) {
      return NextResponse.json({ error: "Missing user email" }, { status: 400 });
    }

    if (!mongoose.connection.db) {
      return NextResponse.json({ error: "MongoDB connection is not established." }, { status: 500 });
    }

    let amount = 0;
    let itemTitle = "";
    let relatedOrderId = null;
    let relatedEnrollmentId = null;

    if (paymentFor === "order") {
      const order = await Order.findOne({ user: userId }).sort({ createdAt: -1 });
      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
      amount = Math.round(order.totalAmount * 100);
      itemTitle = order.orderItems?.[0]?.title || "Order";
      relatedOrderId = order._id;
    } else if (paymentFor === "enrollment") {
      if (!enrollmentId) {
        return NextResponse.json({ error: "Missing enrollmentId" }, { status: 400 });
      }
      const enrollment = await Enrollment.findById(enrollmentId);
      if (!enrollment) {
        return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
      }
      amount = Math.round(enrollment.totalAmount * 100);
      itemTitle = enrollment.className;
      relatedEnrollmentId = enrollment._id;
    } else if (paymentFor === "pricing-plan") {
      if (!pricingPlanId) {
        return NextResponse.json({ error: "Missing pricingPlanId" }, { status: 400 });
      }
      const plan = await PricingPlanPurchase.findById(pricingPlanId);
      if (!plan) {
        return NextResponse.json({ error: "Pricing plan not found" }, { status: 404 });
      }
      amount = Math.round(plan.amount * 100);
      itemTitle = plan.planName;
    } else {
      return NextResponse.json({ error: "Invalid paymentFor value" }, { status: 400 });
    }

    // Create or retrieve Stripe customer for enrollment and order payments
    const customers = await stripe.customers.list({ email });
    let customer = customers.data[0];
    if (!customer) {
      customer = await stripe.customers.create({
        email: email,
        metadata: { userId },
      });
    }

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
      // Save payment record in kalana_paymentsses
      const newPayment = new Payment({
        firstName: itemTitle,
        lastName: userId.toString(),
        email: email,
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
      console.log('✅ Payment record saved in kalana_paymentsses:', newPayment._id);

      // Update pricing plan status if relevant
      if (paymentFor === "pricing-plan" && pricingPlanId) {
        await PricingPlanPurchase.findByIdAndUpdate(pricingPlanId, { status: "paid" });
        console.log('✅ Pricing plan status updated to paid:', pricingPlanId);
      }

      // Update order status if relevant
      if (relatedOrderId) {
        const result = await mongoose.connection.db.collection("orders").updateOne(
          { _id: relatedOrderId },
          { $set: { status: "paid" } }
        );
        console.log('✅ Order status update result:', result);
      }

      // Update enrollment status if relevant
      if (relatedEnrollmentId) {
        const result = await mongoose.connection.db.collection("enrollments").updateOne(
          { _id: relatedEnrollmentId },
          { $set: { status: "paid" } }
        );
        console.log('✅ Enrollment status update result:', result);
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