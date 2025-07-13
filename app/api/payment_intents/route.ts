import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import mongoose from "mongoose";
import Payment from "../../models/Payment"; // Adjust to correct path
import Order from "../../models/order"; // Adjust to correct pathnp

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

const connectToDB = async () => {
  if (mongoose.connections[0].readyState === 0) {
    console.log("Connecting to DB...");
    try {
      await mongoose.connect(process.env.MONGODB_URI!);
      console.log("Connected to DB");
    } catch (error) {
      console.error("Error connecting to DB:", error);
      throw new Error("Failed to connect to the database");
    }
  }
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { paymentMethodId, userId } = body;

    console.log("Received userId:", userId); // Log the userId for debugging

    if (!paymentMethodId || !userId) {
      return NextResponse.json({ error: "Missing paymentMethodId or userId" }, { status: 400 });
    }

    // Connect to DB
    await connectToDB();

    // Ensure userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log("Invalid User ID format:", userId);
      return NextResponse.json({ error: "Invalid User ID format" }, { status: 400 });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId); // Convert to ObjectId if valid

    // Query the user's most recent order
    let latestOrder = await Order.findOne({ user: userObjectId }).sort({ createdAt: -1 });

    // Handle missing orders gracefully
    if (!latestOrder) {
      latestOrder = {
        user: userObjectId, // Assign the user as ObjectId if order doesn't exist
        orderItems: [
          {
            product: "dummy_product_id",  // Example of dummy data
            title: "Dummy Plan",          // Dummy title
            image: "/dummy.jpg",          // Dummy image
            price: 19.99,                 // Dummy price
            quantity: 1,                  // Dummy quantity
            category: "general"           // Dummy category
          }
        ],
        totalAmount: 19.99               // Total price for the dummy order
      };
    }

    const amount = Math.round(latestOrder.totalAmount * 100);  // Convert the amount to cents

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      payment_method: paymentMethodId,
      confirm: true,
      return_url: `${req.nextUrl.origin}/payment/complete`,
      automatic_payment_methods: { enabled: true },
    });

    if (paymentIntent.status === "succeeded") {
      const payment = new Payment({
        firstName: latestOrder?.orderItems?.[0]?.title || "N/A",
        lastName: userObjectId,
        email: "placeholder@example.com",
        company: "FitSyncPro",
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        paymentStatus: paymentIntent.status,
        paymentMethodId,
        billingAddress: {
          zip: "10100",
          country: "USA",
          city: "New York",
          street: "456 Real Street"
        },
        userId: userObjectId
      });

      await payment.save();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: `Unhandled status: ${paymentIntent.status}` }, { status: 400 });
  } catch (error: any) {
    console.error("Stripe error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
