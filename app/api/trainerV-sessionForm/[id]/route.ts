import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import VirtualSession from '@/models/VirtualSession';

// GET: Fetch a single virtual session by its ID
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const session = await VirtualSession.findById(params.id);

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json(session, { status: 200 });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}

// PUT: Update a virtual session by its ID
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    await connectToDatabase();

    const requiredFields = [
      'title',
      'trainer',
      'date',
      'startTime',
      'endTime',
      'onlineLink',
      'maxParticipants'
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing field: ${field}` }, { status: 400 });
      }
    }

    const updated = await VirtualSession.findByIdAndUpdate(
      params.id,
      {
        title: body.title,
        trainer: body.trainer,
        date: body.date,
        startTime: body.startTime,
        endTime: body.endTime,
        maxParticipants: body.maxParticipants,
        description: body.description || '',
        onlineLink: body.onlineLink,
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}

// DELETE: Remove a virtual session by its ID
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const deleted = await VirtualSession.findByIdAndDelete(params.id);

    if (!deleted) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Session deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}
