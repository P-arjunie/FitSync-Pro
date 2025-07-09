import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import VirtualSession from '@/models/VirtualSession';

// POST: Create a new virtual session
export async function POST(req: NextRequest) {
  try {
    // Parse the request body as JSON
    const body = await req.json();

    // Connect to the MongoDB database
    await connectToDatabase();

    // Validate required fields
    if (!body.trainer || !body.sessionType || !body.duration || !body.date || !body.onlineLink) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create a new VirtualSession instance
    const newSession = new VirtualSession({
      trainer: body.trainer,
      sessionType: body.sessionType,
      duration: body.duration,
      date: body.date,
      comments: body.comments || '', // Optional comments field
      onlineLink: body.onlineLink,
    });

    // Save the session to the database
    await newSession.save();

    // Respond with success and the created session
    return NextResponse.json({ message: 'Session created!', session: newSession }, { status: 201 });
  } catch (error) {
    // Log and respond with an error if anything goes wrong
    console.error('Error creating session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}

// GET: Fetch all virtual sessions
export async function GET() {
  try {
    // Connect to the MongoDB database
    await connectToDatabase();

    // Retrieve all sessions from the database
    const sessions = await VirtualSession.find();

    // Respond with the list of sessions
    return NextResponse.json(sessions, { status: 200 });
  } catch (error) {
    // Log and respond with an error if fetching fails
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}
