import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Payment from '@/models/Payment';

const connectToDB = async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!, { dbName: 'fit-sync' });
  }
};

export async function POST(req: NextRequest) {
  try {
    await connectToDB();
    const body = await req.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'No payment object provided' }, { status: 400 });
    }
    // Insert the raw object (let Mongoose handle defaults, _id, etc.)
    const payment = await Payment.create(body);
    return NextResponse.json({ success: true, payment });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to insert payment' }, { status: 500 });
  }
} 