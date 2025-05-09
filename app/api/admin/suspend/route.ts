// /app/api/admin/suspend/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from "@/lib/mongodb";
import Member from '@/models/member';
import ApprovedTrainer from '@/models/ApprovedTrainer';

export async function PUT(req: Request) {
  const { id, role } = await req.json();
  await connectToDatabase();

  try {
    if (role === 'member') {
      await Member.findByIdAndUpdate(id, { status: 'suspended' });
    } else if (role === 'trainer') {
      await ApprovedTrainer.findByIdAndUpdate(id, { status: 'suspended' });
    } else {
      return NextResponse.json({ message: 'Invalid role' }, { status: 400 });
    }

    return NextResponse.json({ message: 'User suspended successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to suspend user' }, { status: 500 });
  }
}
