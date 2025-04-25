import { NextResponse } from 'next/server';
import { connectToDatabase } from "@/lib/mongodb";
import Member from '@/models/member'; // make sure this points to your approved member schema

export const GET = async () => {
  try {
    await connectToDatabase();
    const approvedMembers = await Member.find({ status: 'approved' });
    return NextResponse.json({ success: true, data: approvedMembers });
  } catch (error) {
    console.error('Failed to fetch approved members:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch approved members' }, { status: 500 });
  }
};
