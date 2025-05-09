// /app/api/admin/remove/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from "@/lib/mongodb";
import Member from '@/models/member';
import ApprovedTrainer from '@/models/ApprovedTrainer';

export async function DELETE(req: Request) {
  const { id, role } = await req.json();
  await connectToDatabase();

  try {
    if (role === 'member') {
      await Member.findByIdAndDelete(id);
    } else if (role === 'trainer') {
      await ApprovedTrainer.findByIdAndDelete(id);
    } else {
      return NextResponse.json({ message: 'Invalid role' }, { status: 400 });
    }

    return NextResponse.json({ message: 'User removed successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to remove user' }, { status: 500 });
  }
}
