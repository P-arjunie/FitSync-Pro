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
    await mongoose.connect(process.env.MONGODB_URI!, { dbName: 'fit-sync' });
    console.log('✅ MongoDB connected (payment-intents)');
    console.log('🔎 [DEBUG] mongoose.connection.name:', mongoose.connection.name);
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
    let relatedPlanId = null;

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
      // Add relatedPlanId for linking
      relatedPlanId = plan._id;
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

    console.log('🔔 paymentFor:', paymentFor, 'pricingPlanId:', pricingPlanId);

    if (paymentIntent.status === "succeeded") {
      // Always create a payment record if not exists
      try {
        let paymentQuery: any = { userId, paymentFor, amount: amount / 100 };
        if (relatedOrderId) paymentQuery["relatedOrderId"] = relatedOrderId;
        if (relatedEnrollmentId) paymentQuery["relatedEnrollmentId"] = relatedEnrollmentId;
        if (relatedPlanId) paymentQuery["relatedPlanId"] = relatedPlanId;
        const existingPayment = await Payment.findOne(paymentQuery);
        let currentPaymentId = null;
        if (!existingPayment) {
          const paymentDoc: any = {
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
            stripePaymentIntentId: paymentIntent.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          if (relatedOrderId) paymentDoc.relatedOrderId = relatedOrderId;
          if (relatedEnrollmentId) paymentDoc.relatedEnrollmentId = relatedEnrollmentId;
          if (relatedPlanId) paymentDoc.relatedPlanId = relatedPlanId;
          const createdPayment = await Payment.create(paymentDoc);
          currentPaymentId = createdPayment._id;
          console.log('✅ Payment record created for', paymentFor, paymentIntent.id);
        } else {
          currentPaymentId = existingPayment._id;
          console.log('ℹ️ Payment record already exists for', paymentFor, paymentIntent.id);
        }
        // Cancel all previous pending payments for this user and paymentFor (except the current one)
        await Payment.updateMany({
          userId,
          paymentFor,
          paymentStatus: 'pending',
          _id: { $ne: currentPaymentId }
        }, {
          $set: { paymentStatus: 'cancelled', updatedAt: new Date() }
        });
      } catch (err) {
        console.error('❌ Failed to create payment record for', paymentFor, err);
      }

      // Update pricing plan status if relevant
      if (paymentFor === "pricing-plan" && pricingPlanId) {
        try {
          const updateResult = await PricingPlanPurchase.findByIdAndUpdate(pricingPlanId, { status: "paid", updatedAt: new Date() }, { new: true });
          if (updateResult) {
            console.log('✅ Pricing plan status updated to paid:', pricingPlanId);
          } else {
            console.log('⚠️ Pricing plan update did not return a document:', pricingPlanId);
          }
        } catch (err) {
          console.error('❌ Failed to update pricing plan status:', err);
        }
      }

      // Update order status if relevant
      if (relatedOrderId) {
        try {
          const result = await Order.findByIdAndUpdate(relatedOrderId, { status: "paid" }, { new: true });
          console.log('✅ Order status updated to paid:', relatedOrderId);
          // Cancel all previous pending orders for this user except the one just paid for
          await Order.updateMany({
            user: userId,
            status: "pending",
            _id: { $ne: relatedOrderId }
          }, {
            $set: { status: "cancelled", updatedAt: new Date() }
          });
        } catch (err) {
          console.error('❌ Failed to update order status:', err);
        }
      }

      // Update enrollment status if relevant
      if (relatedEnrollmentId) {
        try {
          const result = await Enrollment.findByIdAndUpdate(relatedEnrollmentId, { status: "paid" }, { new: true });
          console.log('✅ Enrollment status updated to paid:', relatedEnrollmentId);
        } catch (err) {
          console.error('❌ Failed to update enrollment status:', err);
        }
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