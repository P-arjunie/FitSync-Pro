import { connectToDatabase } from '@/lib/mongodb'; // Import database connection utility
import ApprovedTrainer from '@/models/ApprovedTrainer'; // Import Mongoose model for approved trainers
import { NextRequest, NextResponse } from 'next/server'; // Import Next.js request/response types

// Handle PUT request to update an approved trainer's profile
export async function PUT(req: NextRequest) {
  try {
    // Connect to MongoDB
    await connectToDatabase();

    // Extract query parameters from the request URL
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email'); // Get 'email' from query string

    // If email is missing, return a 400 Bad Request response
    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    // Parse the updated trainer data from the request body
    const updatedData = await req.json();

    // Find and update the trainer document that matches the given email
    const updatedTrainer = await ApprovedTrainer.findOneAndUpdate(
      { email },             // Search criteria
      { $set: updatedData }, // Apply updated fields
      { new: true }          // Return the updated document
    );

    // If no trainer is found, return a 404 Not Found response
    if (!updatedTrainer) {
      return NextResponse.json({ message: 'Trainer not found' }, { status: 404 });
    }

    // Return the updated trainer data with a 200 OK response
    return NextResponse.json({ data: updatedTrainer }, { status: 200 });
  } catch (error) {
    // Log and return a 500 Internal Server Error if something goes wrong
    console.error('Error updating trainer profile:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
