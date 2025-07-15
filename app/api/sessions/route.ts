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
    const publicOnly = searchParams.get("public") === "true";
    
    console.log("API: Fetching sessions with trainerId:", trainerId, "publicOnly:", publicOnly);
    
    const query: any = {};
    if (trainerId) {
      // Only use ApprovedTrainer model for consistency
      const ApprovedTrainer = (await import('@/models/ApprovedTrainer')).default;
      
      // Find the trainer in ApprovedTrainer model
      let approvedTrainer = await ApprovedTrainer.findById(trainerId);
      if (approvedTrainer) {
        const fullName = `${approvedTrainer.firstName} ${approvedTrainer.lastName}`;
        console.log("API: Found trainer in ApprovedTrainer model:", fullName);
        query.trainerName = fullName;
      } else {
        console.log("API: Trainer not found in ApprovedTrainer model, using trainerId directly");
        query.trainerId = trainerId;
      }
    }
    
    console.log("API: Final query:", query);
    
    const sessions = await Session.find(query).sort({ start: 1 });
    console.log("API: Found sessions count:", sessions.length);
    console.log("API: Sessions:", sessions.map(s => ({ id: s._id, title: s.title, trainerId: s.trainerId, trainerName: s.trainerName })));
    
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

    await connectToDatabase();

    // If trainerId is provided, verify it's from ApprovedTrainer model
    let verifiedTrainerId = body.trainerId;
    if (body.trainerId) {
      const ApprovedTrainer = (await import('@/models/ApprovedTrainer')).default;
      const approvedTrainer = await ApprovedTrainer.findById(body.trainerId);
      
      if (approvedTrainer) {
        console.log("Session creation: Using ApprovedTrainer ID:", body.trainerId);
        verifiedTrainerId = body.trainerId;
      } else {
        console.log("Session creation: Trainer not found in ApprovedTrainer, using provided ID");
      }
    }

    // Check for scheduling conflicts for the same trainer
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

    // Create the new session with verified trainer ID
    const session = await Session.create({
      ...body,
      trainerId: verifiedTrainerId,
      maxParticipants: Number(body.maxParticipants),
    });
    
    console.log("Session created successfully:", {
      id: session._id,
      title: session.title,
      trainerId: session.trainerId,
      trainerName: session.trainerName
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