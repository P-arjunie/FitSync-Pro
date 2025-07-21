import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/mongodb';
import Session from '@/models/Session';

export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
  try {
    const body = await request.json();
    await connectToDatabase();
    const id = context.params.id;
    if (!body.cancellationReason || body.cancellationReason.trim() === "") {
      return NextResponse.json({ error: 'Cancellation reason is required' }, { status: 400 });
    }
    const updatedSession = await Session.findByIdAndUpdate(
      id,
      {
        canceled: true,
        cancellationReason: body.cancellationReason
      },
      { new: true, runValidators: true }
    );
    if (!updatedSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    return NextResponse.json(updatedSession, { status: 200 });
  } catch (error) {
    console.error('Error canceling session:', error);
    return NextResponse.json({ error: 'Failed to cancel session' }, { status: 500 });
  }
} 