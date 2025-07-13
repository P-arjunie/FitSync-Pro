import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import mongoose from 'mongoose';
import Payment from '../../models/Payment';
import Order from '../../models/order';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',
});

const connectToDB = async () => {
  if (mongoose.connections[0].readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!);
  }
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { paymentMethodId, userId, orderId } = body;

    if (!paymentMethodId || !userId) {
      return NextResponse.json(
        { error: 'Missing paymentMethodId or userId' },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Invalid User ID format' }, { status: 400 });
    }

    await connectToDB();

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // 🔍 Find latest or given pending order
    let order: any = null;

    if (orderId && mongoose.Types.ObjectId.isValid(orderId)) {
      order = await Order.findOne({
        _id: orderId,
        user: userObjectId,
        status: 'pending',
      });
    } else {
      order = await Order.findOne({
        user: userObjectId,
        status: 'pending',
      }).sort({ createdAt: -1 });
    }

    if (!order) {
      return NextResponse.json({ error: 'No pending order found' }, { status: 404 });
    }

    const amount = Math.round(order.totalAmount * 100);
    const title = order.orderItems?.[0]?.title || 'Order';

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      payment_method: paymentMethodId,
      confirm: true,
      return_url: `${req.nextUrl.origin}/payment/complete`,
      automatic_payment_methods: { enabled: true },
    });

    if (paymentIntent.status === 'succeeded') {
      const paymentData = {
        firstName: title,
        lastName: userObjectId.toString(),
        email: 'placeholder@example.com',
        company: 'FitSyncPro',
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        paymentStatus: paymentIntent.status,
        paymentMethodId,
        billingAddress: {
          zip: '10100',
          country: 'USA',
          city: 'New York',
          street: '456 Real Street',
        },
        userId: userObjectId.toString(),
        paymentFor: 'order',
        relatedOrderId: order._id.toString(),
        relatedEnrollmentId: null,
      };

      await Order.findByIdAndUpdate(order._id, { status: 'paid' });

      const payment = new Payment(paymentData);
      await payment.save();

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: `Unhandled payment status: ${paymentIntent.status}` },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Payment intent error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
