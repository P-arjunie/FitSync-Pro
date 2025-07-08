// /app/api/admin/remove/route.ts

import { NextResponse } from 'next/server'; // Import Next.js response helper
import { connectToDatabase } from "@/lib/mongodb"; // Import function to connect to MongoDB
import Member from '@/models/member'; // Import the Member model
import ApprovedTrainer from '@/models/ApprovedTrainer'; // Import the ApprovedTrainer model

// DELETE handler to remove a user (either a member or trainer) based on role and ID
export async function DELETE(req: Request) {
  // Parse the JSON request body to get the user ID and role
  const { id, role } = await req.json();

  // Establish a connection to the MongoDB database
  await connectToDatabase();

  try {
    // If the role is 'member', delete the member by ID
    if (role === 'member') {
      await Member.findByIdAndDelete(id);
    } 
    // If the role is 'trainer', delete the trainer by ID
    else if (role === 'trainer') {
      await ApprovedTrainer.findByIdAndDelete(id);
    } 
    // Return a 400 error if the role is invalid
    else {
      return NextResponse.json({ message: 'Invalid role' }, { status: 400 });
    }

    // Return a success response if deletion is successful
    return NextResponse.json({ message: 'User removed successfully' });
  } catch (error) {
    // Return a 500 error response if deletion fails
    return NextResponse.json({ error: 'Failed to remove user' }, { status: 500 });
  }
}
