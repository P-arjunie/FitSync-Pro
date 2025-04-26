import { connectToDatabase } from '@/lib/mongodb';

import ApprovedTrainer from '@/models/ApprovedTrainer';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();


    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    const updatedData = await req.json();

    const updatedTrainer = await ApprovedTrainer.findOneAndUpdate(
      { email },
      { $set: updatedData },
      { new: true }
    );

    if (!updatedTrainer) {
      return NextResponse.json({ message: 'Trainer not found' }, { status: 404 });
    }

    return NextResponse.json({ data: updatedTrainer }, { status: 200 });
  } catch (error) {
    console.error('Error updating trainer profile:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
