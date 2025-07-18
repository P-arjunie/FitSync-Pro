import { NextResponse } from 'next/server';
import { connectToDatabase } from "../../../lib/mongodb";
import Session from '@/models/Session';

export async function GET() {
  try {
    await connectToDatabase();
    
    // Get all sessions
    const allSessions = await Session.find({}).sort({ start: 1 });
    
    // Get unique trainer IDs
    const uniqueTrainerIds = [...new Set(allSessions.map(s => s.trainerId))];
    const uniqueTrainerNames = [...new Set(allSessions.map(s => s.trainerName))];
    
    return NextResponse.json({
      totalSessions: allSessions.length,
      sessions: allSessions.map(s => ({
        id: s._id,
        title: s.title,
        trainerId: s.trainerId,
        trainerName: s.trainerName,
        start: s.start,
        end: s.end
      })),
      uniqueTrainerIds,
      uniqueTrainerNames
    });
    
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json({ error: 'Failed to fetch debug data' }, { status: 500 });
  }
} 