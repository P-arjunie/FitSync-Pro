import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import VirtualSession from '@/models/VirtualSession';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await connectToDatabase();

    if (!body.trainer || !body.sessionType || !body.duration || !body.date || !body.onlineLink) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newSession = new VirtualSession({
      trainer: body.trainer,
      sessionType: body.sessionType,
      duration: body.duration,
      date: body.date,
      comments: body.comments || '',
      onlineLink: body.onlineLink,
    });

    await newSession.save();

    return NextResponse.json({ message: 'Session created!', session: newSession }, { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);
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
