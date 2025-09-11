import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Trainer from '@/models/Trainer';

export async function POST(req) {
  try {
    const body = await req.json(); // Parse JSON from request
    await connectToDatabase();

    const newTrainer = new Trainer(body);
    await newTrainer.save();

    return NextResponse.json({ message: 'Trainer added successfully!' }, { status: 201 });
  } catch (error) {
    console.error('Error adding trainer:', error);
    return NextResponse.json({ message: 'Failed to add trainer.' }, { status: 500 });
  }
}
