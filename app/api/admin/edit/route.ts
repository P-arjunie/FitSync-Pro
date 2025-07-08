// app/api/admin/edit/route.ts
import { NextResponse } from 'next/server'; // Importing Next.js Response helper
import { connectToDatabase } from '@/lib/mongodb'; // Function to establish MongoDB connection
import Member from '@/models/member'; // Mongoose model for approved members
import ApprovedTrainer from '@/models/ApprovedTrainer'; // Mongoose model for approved trainers

// PUT handler to update user data (either a member or trainer)
export async function PUT(req: Request) {
  // Extract data from the incoming JSON request body
  const { email, role, updatedData } = await req.json();
  
  // Connect to MongoDB database
  await connectToDatabase();

  try {
    let updatedUser;

    // If the role is 'member', update the corresponding member document
    if (role === 'member') {
      updatedUser = await Member.findOneAndUpdate(
        { email },         // Find the member by email
        updatedData,       // Apply the new data
        {
          new: true,       // Return the updated document
          runValidators: true, // Run schema validators on the updated data
        }
      );
    } 
    // If the role is 'trainer', update the corresponding trainer document
    else if (role === 'trainer') {
      updatedUser = await ApprovedTrainer.findOneAndUpdate(
        { email }, 
        updatedData, 
        {
          new: true,
          runValidators: true,
        }
      );
    } 
    // If role is neither 'member' nor 'trainer', return a 400 error
    else {
      return NextResponse.json({ message: 'Invalid role' }, { status: 400 });
    }

    // If no user was found with the provided email, return a 404 error
    if (!updatedUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Successful update response
    return NextResponse.json({ message: 'User updated successfully', user: updatedUser });
  } catch (error) {
    // Log the error for debugging
    console.error('Update error:', error);
    
    // Return a generic server error response
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}


