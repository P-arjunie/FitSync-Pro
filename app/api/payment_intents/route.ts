// app/api/payment_intents/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import mongoose from "mongoose";
import Checkout from "../../models/Checkout"; // Import Checkout model

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

// Function to connect to MongoDB
const connectToDB = async () => {
  if (mongoose.connections[0].readyState) {
    return; // Already connected
  }
  await mongoose.connect(process.env.MONGODB_URI!);
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { paymentMethodId, userId } = body;

    if (!paymentMethodId) {
      return NextResponse.json({ error: "Payment method ID is required" }, { status: 400 });
    }

    // Step 1: Create the payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1000, // $10.00
      currency: "usd",
      payment_method: paymentMethodId,
      confirmation_method: "manual",
      confirm: true,
      return_url: `${req.nextUrl.origin}/payment/complete`,
    });

    // Step 2: Handle payment confirmation action (if needed)
    if (paymentIntent.status === "requires_action" && paymentIntent.next_action?.type === "redirect_to_url") {
      return NextResponse.json({
        requiresAction: true,
        clientSecret: paymentIntent.client_secret,
        nextAction: paymentIntent.next_action,
      });
    }

    // Step 3: Save payment information in the database
    if (paymentIntent.status === "succeeded") {
      // Connect to the DB
      await connectToDB();

      // Create a new checkout entry
      const checkout = new Checkout({
        firstName: "John", // Replace with actual user data
        lastName: "Doe", // Replace with actual user data
        email: "john@example.com", // Replace with actual user data
        company: "FitSyncPro",
        amount: paymentIntent.amount / 100, // Convert cents to dollars
        currency: paymentIntent.currency,
        paymentStatus: paymentIntent.status,
        paymentMethodId: paymentMethodId,
      });

      // Save to the database
      await checkout.save();

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: `Unexpected status: ${paymentIntent.status}` },
      { status: 500 }
    );
  } catch (error: any) {
    console.error("Stripe error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
