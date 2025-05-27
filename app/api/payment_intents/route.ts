// app/api/payment_intents/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import mongoose from "mongoose";
import Checkout from "../../models/Checkout"; // Your Checkout schema
import Order from "../../models/order"; // Needed to query orders

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

const connectToDB = async () => {
  if (mongoose.connections[0].readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!);
  }
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { paymentMethodId, userId } = body;

    if (!paymentMethodId || !userId) {
      return NextResponse.json({ error: "Missing paymentMethodId or userId" }, { status: 400 });
    }

    await connectToDB();

    // Try to find user's most recent order
    let latestOrder = null;

// Only attempt to query DB if userId is a valid ObjectId
if (mongoose.Types.ObjectId.isValid(userId)) {
  latestOrder = await Order.findOne({ user: userId }).sort({ createdAt: -1 });
}


    // If no real order found, use dummy order fallback
    let isDummyOrder = false;

    if (!latestOrder) {
      isDummyOrder = true;
      latestOrder = {
        user: userId,
        orderItems: [
          {
            product: "dummy_product_id",
            title: "Dummy Plan",
            image: "/dummy.jpg",
            price: 19.99,
            quantity: 1,
            category: "general"
          }
        ],
        totalAmount: 19.99
      };
    }

    const amount = Math.round(latestOrder.totalAmount * 100); // Convert to cents

    // Step 1: Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      payment_method: paymentMethodId,
      confirmation_method: "manual",
      confirm: true,
      return_url: `${req.nextUrl.origin}/payment/complete`,
    });

    // Step 2: Handle 3D Secure or redirect if needed
    if (
      paymentIntent.status === "requires_action" &&
      paymentIntent.next_action?.type === "redirect_to_url"
    ) {
      return NextResponse.json({
        requiresAction: true,
        clientSecret: paymentIntent.client_secret,
        nextAction: paymentIntent.next_action,
      });
    }

    // Step 3: Save payment in DB if succeeded
    if (paymentIntent.status === "succeeded") {
      const checkout = new Checkout({
        firstName: isDummyOrder
          ? "Dummy"
          : latestOrder?.orderItems?.[0]?.title || "N/A",
        lastName: userId,
        email: isDummyOrder ? "dummy@example.com" : "placeholder@example.com",
        company: "FitSyncPro",
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        paymentStatus: paymentIntent.status,
        paymentMethodId,
        billingAddress: {
          zip: isDummyOrder ? "00000" : "10100",
          country: isDummyOrder ? "Nowhere" : "USA",
          city: isDummyOrder ? "Nulltown" : "New York",
          street: isDummyOrder ? "123 Dummy Lane" : "456 Real Street",
        },
        userId: userId || "dummy_user",
      });

      await checkout.save();

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: `Unhandled status: ${paymentIntent.status}` },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Stripe error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
