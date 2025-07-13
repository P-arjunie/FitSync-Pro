// app/api/enrollments/route.ts

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Enrollment from '@/models/enrollment';

const connectToDB = async () => {
  if (mongoose.connections[0].readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!);
  }
};

/* -------- POST /api/enrollments -------- */
export async function POST(req: NextRequest) {
  try {
    const { userId, className, totalAmount } = await req.json();
    if (!userId || !className || totalAmount == null) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    await connectToDB();

    const enrollment = await Enrollment.create({
      userId,
      className,
      totalAmount,
      status: 'pending'
    });

    /* ⭐  Return the doc so the client gets _id */
    return NextResponse.json(enrollment);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
