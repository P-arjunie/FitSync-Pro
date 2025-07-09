import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from "@/lib/mongodb"; // Import function to connect to MongoDB
import ApprovedTrainer from '@/models/ApprovedTrainer';
import Member from '@/models/member';

export async function PUT(req: NextRequest) {
  await connectToDatabase();

  const { role, data } = await req.json();

  try {
    if (!data._id) {
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
    }

    if (role === 'member') {
      await Member.findByIdAndUpdate(data._id, data, { new: true });
    } else if (role === 'trainer') {
      await ApprovedTrainer.findByIdAndUpdate(data._id, data, { new: true });
    } else {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PUT /api/admin/edit:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
