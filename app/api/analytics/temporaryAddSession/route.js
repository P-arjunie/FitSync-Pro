// app/api/analytics/temporaryAddSession/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Session from "@/models/Session"; // This will work with either .js or .ts extension

// GET all sessions
export async function GET(req) {
  try {
    await connectToDatabase();
    
    // Get URL parameters
    const url = new URL(req.url);
    const trainerName = url.searchParams.get('trainerName');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    
    // Build query filter based on parameters
    const filter = {};
    if (trainerName) filter.trainerName = trainerName;
    if (startDate || endDate) {
      filter.start = {};
      if (startDate) filter.start.$gte = new Date(startDate);
      if (endDate) filter.end = { $lte: new Date(endDate) };
    }
    
    // Fetch sessions with filters
    const sessions = await Session.find(filter).sort({ start: 1 });
    
    return NextResponse.json({ sessions }, { status: 200 });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json({ message: "Failed to fetch sessions." }, { status: 500 });
  }
}

// POST a new session
export async function POST(req) {
  try {
    await connectToDatabase();
    
    const body = await req.json();
    console.log("Creating new session:", body);
    
    // Parse date strings to Date objects
    if (body.start) body.start = new Date(body.start);
    if (body.end) body.end = new Date(body.end);
    
    // Validate session time
    if (body.start && body.end && body.start >= body.end) {
      return NextResponse.json({ 
        message: "End time must be after start time." 
      }, { status: 400 });
    }
    
    // Create new session
    const newSession = new Session(body);
    await newSession.save();
    
    return NextResponse.json({
      message: "Session created successfully",
      session: newSession
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating session:", error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json({ 
        message: "Validation failed", 
        errors: validationErrors 
      }, { status: 400 });
    }
    
    return NextResponse.json({ message: "Failed to create session." }, { status: 500 });
  }
}