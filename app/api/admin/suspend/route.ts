// /app/api/admin/suspend/route.ts

import { NextResponse } from 'next/server'; // Import Next.js helper for response handling
import { connectToDatabase } from "@/lib/mongodb"; // Import function to connect to MongoDB
import Member from '@/models/member'; // Import Member model
import ApprovedTrainer from '@/models/ApprovedTrainer'; // Import ApprovedTrainer model

// PUT handler to suspend a user (either a member or a trainer)
export async function PUT(req: Request) {
  // Parse the request body to extract user ID and role
  const { id, role } = await req.json();

  // Connect to the MongoDB database
  await connectToDatabase();

  try {
<<<<<<< Updated upstream
    // If role is 'member', update the member's status to 'suspended'
=======
    const { id, role, status = 'suspended' } = await req.json();

    if (!id || !role) {
      return NextResponse.json(
        { error: "ID and role are required" },
        { status: 400 }
      );
    }

    console.log('Suspend request:', { id, role, status });

    await connectToDatabase();

    let updatedUser;
>>>>>>> Stashed changes
    if (role === 'member') {
      await Member.findByIdAndUpdate(id, { status: 'suspended' });
    } 
    // If role is 'trainer', update the trainer's status to 'suspended'
    else if (role === 'trainer') {
      await ApprovedTrainer.findByIdAndUpdate(id, { status: 'suspended' });
    } 
    // Return a 400 error if the role is invalid
    else {
      return NextResponse.json({ message: 'Invalid role' }, { status: 400 });
    }

<<<<<<< Updated upstream
    // Return a success response if the update is successful
    return NextResponse.json({ message: 'User suspended successfully' });
=======
    console.log('Suspend result:', updatedUser);

    if (!updatedUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: `User ${status === 'suspended' ? 'suspended' : 'activated'} successfully`,
      user: updatedUser
    });

>>>>>>> Stashed changes
  } catch (error) {
    // Return a 500 error response if the update operation fails
    return NextResponse.json({ error: 'Failed to suspend user' }, { status: 500 });
  }
}

