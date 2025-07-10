import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import VirtualSession from '@/models/VirtualSession';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("🔥 Incoming request body:", body); // log 1

    await connectToDatabase();
    console.log("✅ Connected to MongoDB"); // log 2

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
        console.log(`❌ Missing field: ${field}`); // log 3
        return NextResponse.json({ error: `Missing field: ${field}` }, { status: 400 });
      }
    }

    const newSession = new VirtualSession({
      title: body.title,
      trainer: body.trainer,
      date: body.date,
      startTime: body.startTime,
      endTime: body.endTime,
      maxParticipants: body.maxParticipants,
      description: body.description || '',
      onlineLink: body.onlineLink,
    });

    console.log("📦 Prepared to save:", newSession); // log 4

    await newSession.save();

    console.log("✅ Session saved!"); // log 5
    return NextResponse.json({ message: 'Session created!', session: newSession }, { status: 201 });
  } catch (error) {
    console.error('❌ Error creating session:', error); // log 6
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
