// app/api/admin/edit/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Member from '@/models/member';
import ApprovedTrainer from '@/models/ApprovedTrainer';

export async function PUT(req: Request) {
  const { email, role, updatedData } = await req.json();
  await connectToDatabase();

  try {
    let updatedUser;

    if (role === 'member') {
      updatedUser = await Member.findOneAndUpdate({ email }, updatedData, {
        new: true,
        runValidators: true,
      });
    } else if (role === 'trainer') {
      updatedUser = await ApprovedTrainer.findOneAndUpdate({ email }, updatedData, {
        new: true,
        runValidators: true,
      });
    } else {
      return NextResponse.json({ message: 'Invalid role' }, { status: 400 });
    }

    if (!updatedUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}


