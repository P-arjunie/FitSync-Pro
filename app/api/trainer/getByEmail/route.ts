import { connectToDatabase } from '@/lib/mongodb';

import ApprovedTrainer from '@/models/ApprovedTrainer';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();


    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    const trainer = await ApprovedTrainer.findOne({ email });

    if (!trainer) {
      return NextResponse.json({ message: 'Trainer not found' }, { status: 404 });
    }

    return NextResponse.json({ data: trainer }, { status: 200 });
  } catch (error) {
    console.error('Error fetching trainer by email:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
