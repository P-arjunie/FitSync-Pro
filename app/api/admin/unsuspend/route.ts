// /app/api/admin/unsuspend/route.ts

import { NextResponse } from 'next/server'; // Import Next.js helper for response handling
import { connectToDatabase } from "@/lib/mongodb"; // Import function to connect to MongoDB
import Member from '@/models/member'; // Import Member model
import ApprovedTrainer from '@/models/ApprovedTrainer'; // Import ApprovedTrainer model

// PUT handler to unsuspend a user (either a member or a trainer)
export async function PUT(req: Request) {
  // Parse the request body to extract user ID and role
  const { id, role } = await req.json();

  if (!id || !role) {
    return NextResponse.json(
      { error: "ID and role are required" },
      { status: 400 }
    );
  }

  console.log('Unsuspend request:', { id, role });

  await connectToDatabase();

  let updatedUser;
  try {
    if (role === 'member') {
      updatedUser = await Member.findByIdAndUpdate(id, { status: 'approved' }, { new: true });
    } 
    // If role is 'trainer', update the trainer's status to 'approved'
    else if (role === 'trainer') {
      updatedUser = await ApprovedTrainer.findByIdAndUpdate(id, { status: 'approved' }, { new: true });
    } 
    // Return a 400 error if the role is invalid
    else {
      return NextResponse.json({ message: 'Invalid role' }, { status: 400 });
    }

    console.log('Unsuspend result:', updatedUser);

    if (!updatedUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "User unsuspended successfully",
      user: updatedUser
    });
  } catch (error) {
    // Return a 500 error response if the update operation fails
    return NextResponse.json({ error: 'Failed to unsuspend user' }, { status: 500 });
  }
} 