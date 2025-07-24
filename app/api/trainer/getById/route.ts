import { connectToDatabase } from '@/lib/mongodb';
import ApprovedTrainer from '@/models/ApprovedTrainer';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ message: 'Trainer ID is required' }, { status: 400 });
    }
    const trainer = await ApprovedTrainer.findById(id);
    if (!trainer) {
      return NextResponse.json({ message: 'Trainer not found' }, { status: 404 });
    }
    return NextResponse.json({ trainer }, { status: 200 });
  } catch (error) {
    console.error('Error fetching trainer by ID:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
} 