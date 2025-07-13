import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import mongoose from "mongoose";
import Payment from "../../models/Payment";
import Order from "../../models/order";
import Enrollment from "../../models/enrollment";

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
    const { paymentMethodId, userId, paymentFor } = body;

    if (!paymentMethodId || !userId || !paymentFor) {
      return NextResponse.json(
        { error: "Missing paymentMethodId, userId or paymentFor" },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid User ID format" }, { status: 400 });
    }

    await connectToDB();

    const userObjectId = new mongoose.Types.ObjectId(userId);

    let paymentSubject = null;
    let amount = 0;
    let title = "";

    if (paymentFor === "enrollment") {
      // Find latest pending enrollment for user
      paymentSubject = await Enrollment.findOne({ userId: userObjectId, status: "pending" }).sort({ createdAt: -1 });

      if (!paymentSubject) {
        return NextResponse.json(
          { error: "No pending enrollment found for user" },
          { status: 404 }
        );
      }

      amount = Math.round(paymentSubject.totalAmount * 100);
      title = paymentSubject.className;

    } else if (paymentFor === "order") {
      // Find latest pending order for user
      paymentSubject = await Order.findOne({ user: userObjectId, status: "pending" }).sort({ createdAt: -1 });

      if (!paymentSubject) {
        return NextResponse.json(
          { error: "No pending order found for user" },
          { status: 404 }
        );
      }

      amount = Math.round(paymentSubject.totalAmount * 100);
      title = paymentSubject.orderItems?.[0]?.title || "Order";

    } else {
      return NextResponse.json(
        { error: `Unsupported paymentFor type: ${paymentFor}` },
        { status: 400 }
      );
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      payment_method: paymentMethodId,
      confirm: true,
      return_url: `${req.nextUrl.origin}/payment/complete`,
      automatic_payment_methods: { enabled: true },
    });

    if (paymentIntent.status === "succeeded") {
      const paymentData: any = {
        firstName: title,
        lastName: userObjectId.toString(),
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
          street: "456 Real Street",
        },
        userId: userObjectId.toString(),
        paymentFor,
      };

      if (paymentFor === "enrollment") {
        paymentData.relatedEnrollmentId = paymentSubject._id.toString();
      } else if (paymentFor === "order") {
        paymentData.relatedOrderId = paymentSubject._id.toString();
      }

      const payment = new Payment(paymentData);
      await payment.save();

      if (paymentFor === "enrollment") {
        await Enrollment.findByIdAndUpdate(paymentSubject._id, { status: "success" });
      } else if (paymentFor === "order") {
        await Order.findByIdAndUpdate(paymentSubject._id, { status: "paid" });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: `Unhandled payment status: ${paymentIntent.status}` },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
