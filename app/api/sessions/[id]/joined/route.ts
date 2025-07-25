import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/mongodb';
import SessionParticipant from '@/models/SessionParticipant';
import Session from '@/models/Session';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();

    const { id } = await context.params; // ✅ await params

    const participants = await SessionParticipant.find({ userId: id });
    const sessionIds = participants.map((p: any) => p.sessionId);
    const sessions = await Session.find({ _id: { $in: sessionIds } });

    const sessionMap = new Map(sessions.map((s: any) => [String(s._id), s]));

    const result = participants
      .map((p: any) => ({
        session: sessionMap.get(p.sessionId),
        status: p.status
      }))
      .filter(item => item.session); // Only include if session exists

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error('Error fetching joined sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch joined sessions' }, { status: 500 });
  }
}
