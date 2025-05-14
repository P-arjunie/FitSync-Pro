// app/api/sessions/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {connectToDatabase} from "../../../lib/mongodb";

import Session from '@/models/Session';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const session = await Session.findById(params.id);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(session, { status: 200 });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    await connectToDatabase();
    
    // Validate the incoming data
    if (!body.title || !body.trainerName || !body.start || !body.end || !body.location || !body.maxParticipants) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if end time is after start time
    const startTime = new Date(body.start);
    const endTime = new Date(body.end);
    
    if (endTime <= startTime) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      );
    }

    // Check for scheduling conflicts (excluding this session)
    const conflictingSession = await Session.findOne({
      _id: { $ne: params.id },
      trainerName: body.trainerName,
      $or: [
        // Session starts during an existing session
        {
          start: { $lte: startTime },
          end: { $gt: startTime }
        },
        // Session ends during an existing session
        {
          start: { $lt: endTime },
          end: { $gte: endTime }
        },
        // Session completely contains an existing session
        {
          start: { $gte: startTime },
          end: { $lte: endTime }
        }
      ]
    });

    if (conflictingSession) {
      return NextResponse.json(
        { error: 'Scheduling conflict: The trainer is already booked during this time' },
        { status: 409 }
      );
    }

    // Update the session
    const updatedSession = await Session.findByIdAndUpdate(
      params.id,
      {
        ...body,
        maxParticipants: Number(body.maxParticipants),
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedSession, { status: 200 });
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const deletedSession = await Session.findByIdAndDelete(params.id);
    
    if (!deletedSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Session deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}