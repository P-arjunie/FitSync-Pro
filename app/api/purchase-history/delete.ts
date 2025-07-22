import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Payment from '@/models/Payment';

const connectToDB = async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!);
  }
};

export async function POST(req: NextRequest) {
  try {
    await connectToDB();
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Missing purchase ID' }, { status: 400 });
    }
    const updated = await Payment.findByIdAndUpdate(id, { hiddenForUser: true });
    if (!updated) {
      return NextResponse.json({ error: 'Purchase record not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to hide purchase record' }, { status: 500 });
  }
} 