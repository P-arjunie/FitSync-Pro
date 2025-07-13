// app/api/enrollments/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Enrollment from '@/models/enrollment';

const connect = async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!);
  }
};

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid enrollment ID' }, { status: 400 });
    }

    await connect();
    const enrollment = await Enrollment.findById(params.id);
    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    return NextResponse.json(enrollment);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
