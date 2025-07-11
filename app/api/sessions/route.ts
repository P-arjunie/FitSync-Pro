/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// app/api/sessions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from "../../lib/mongodb";
import Session from '@/models/Session';

// Cache to store sessions with timestamp
let sessionsCache: {
  data: any[];
  timestamp: number;
} | null = null;

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 300000;

export async function GET(request: NextRequest) {
  try {
    // Check if we have a valid cache
    const now = Date.now();
    if (sessionsCache && (now - sessionsCache.timestamp < CACHE_TTL)) {
      // Set cache control headers
      const headers = new Headers();
      headers.set('Cache-Control', 'public, max-age=300'); // 5 minutes
      headers.set('X-Data-Source', 'cache');
      
      return NextResponse.json(sessionsCache.data, { 
        status: 200,
        headers
      });
    }
    
    // Cache miss or expired, fetch from database
    await connectToDatabase();

    // --- ADDED: filter by trainerId if present ---
    const { searchParams } = new URL(request.url);
    const trainerId = searchParams.get("trainerId");
    const query: any = {};
    if (trainerId) {
      query.trainerId = trainerId;
    }
    const sessions = await Session.find(query).sort({ start: 1 });
    // --- END ADDED ---

    // Update cache
    sessionsCache = {
      data: sessions,
      timestamp: now
    };
    
    // Set cache control headers
    const headers = new Headers();
    headers.set('Cache-Control', 'public, max-age=300'); // 5 minutes
    headers.set('X-Data-Source', 'database');
    
    return NextResponse.json(sessions, { 
      status: 200,
      headers
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

// Rest of your POST method remains the same...
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Received body in POST /api/sessions:", body); // <-- Add this line
    
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

    // Check for scheduling conflicts for the same trainer
    await connectToDatabase();
    const conflictingSession = await Session.findOne({
      trainerName: body.trainerName,
      $or: [
        // New session starts during an existing session
        {
          start: { $lte: startTime },
          end: { $gt: startTime }
        },
        // New session ends during an existing session
        {
          start: { $lt: endTime },
          end: { $gte: endTime }
        },
        // New session completely contains an existing session
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

    // Create the new session
    const session = await Session.create({
      ...body,
      maxParticipants: Number(body.maxParticipants),
    });
    
    // Invalidate the cache after creating a new session
    sessionsCache = null;
    
    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}