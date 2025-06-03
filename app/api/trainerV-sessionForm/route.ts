import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import VirtualSession from '@/models/VirtualSession';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();

    if (!body.title || !body.trainerName || !body.start || !body.end || !body.platform || !body.meetingLink || !body.maxParticipants) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const startTime = new Date(body.start);
    const endTime = new Date(body.end);

    if (endTime <= startTime) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
    }

    // Optional: check for time conflicts like physical session

    const newSession = await VirtualSession.create({
      ...body,
      maxParticipants: Number(body.maxParticipants),
    });

    return NextResponse.json(newSession, { status: 201 });
  } catch (error) {
    console.error('Error creating virtual session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectToDatabase();
    const sessions = await VirtualSession.find();
    return NextResponse.json(sessions, { status: 200 });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}
