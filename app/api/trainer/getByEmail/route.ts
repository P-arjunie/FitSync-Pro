import { connectToDatabase } from '@/lib/mongodb'; // Import function to connect to MongoDB
import ApprovedTrainer from '@/models/ApprovedTrainer'; // Import Mongoose model for approved trainers
import { NextRequest, NextResponse } from 'next/server'; // Import Next.js request and response utilities

// Handle GET request to fetch a specific approved trainer by email
export async function GET(req: NextRequest) {
  try {
    // Connect to MongoDB
    await connectToDatabase();

    // Extract query parameters from the request URL
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email'); // Get 'email' from query string

    // If email is not provided, return a 400 Bad Request response
    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    // Search for a trainer with the matching email in the ApprovedTrainer collection
    const trainer = await ApprovedTrainer.findOne({ email });

    // If no trainer is found, return a 404 Not Found response
    if (!trainer) {
      return NextResponse.json({ message: 'Trainer not found' }, { status: 404 });
    }

    // If found, return the trainer data with a 200 OK response
    return NextResponse.json({ data: trainer }, { status: 200 });
  } catch (error) {
    // Handle any unexpected server errors
    console.error('Error fetching trainer by email:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
