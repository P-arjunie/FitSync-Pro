import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import VirtualSession from '@/models/VirtualSession';

// GET: Fetch a single virtual session by its ID
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Connect to MongoDB
    await connectToDatabase();

    // Find the session by ID
    const session = await VirtualSession.findById(params.id);

    // If session not found, return 404
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Return the session data
    return NextResponse.json(session, { status: 200 });
  } catch (error) {
    // Log and return server error
    console.error('Error fetching session:', error);
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}

// PUT: Update a virtual session by its ID
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Parse the request body
    const body = await req.json();

    // Connect to MongoDB
    await connectToDatabase();

    // Validate required fields
    if (!body.trainer || !body.sessionType || !body.duration || !body.date || !body.onlineLink) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Update the session in the database
    const updated = await VirtualSession.findByIdAndUpdate(
      params.id,
      {
        trainer: body.trainer,
        sessionType: body.sessionType,
        duration: body.duration,
        date: body.date,
        comments: body.comments,
        onlineLink: body.onlineLink,
      },
      { new: true } // Return the updated document
    );

    // If session not found, return 404
    if (!updated) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Return the updated session
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    // Log and return server error
    console.error('Error updating virtual session:', error);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}

// DELETE: Remove a virtual session by its ID
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Connect to MongoDB
    await connectToDatabase();

    // Delete the session from the database
    const deleted = await VirtualSession.findByIdAndDelete(params.id);

    // If session not found, return 404
    if (!deleted) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Return success message
    return NextResponse.json({ message: 'Session deleted successfully' }, { status: 200 });
  } catch (error) {
    // Log and return server error
    console.error('Error deleting session:', error);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}
