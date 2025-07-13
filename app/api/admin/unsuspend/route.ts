// app/api/admin/unsuspend/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from "@/lib/mongodb";
import Member from '@/models/member';
import ApprovedTrainer from '@/models/ApprovedTrainer';

export async function PUT(req: Request) {
  try {
    const { id, role, status = 'active' } = await req.json();

    if (!id || !role) {
      return NextResponse.json(
        { error: "ID and role are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    let updatedUser;
    if (role === 'member') {
      updatedUser = await Member.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );
    } else if (role === 'trainer') {
      updatedUser = await ApprovedTrainer.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );
    } else {
      return NextResponse.json(
        { error: "Invalid role specified" },
        { status: 400 }
      );
    }

    if (!updatedUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: `User unsuspended successfully`,
      user: updatedUser
    });

  } catch (error) {
    console.error("Unsuspend error:", error);
    return NextResponse.json(
      { error: "Failed to unsuspend user" },
      { status: 500 }
    );
  }
}