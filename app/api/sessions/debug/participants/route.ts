import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import SessionParticipant from "@/models/SessionParticipant";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Debug participants API called");
    
    await connectToDatabase();
    console.log("✅ Database connected");
    
    // Test basic query
    const totalParticipants = await SessionParticipant.countDocuments({});
    console.log("📊 Total participants in database:", totalParticipants);
    
    // Get a few sample participants
    const sampleParticipants = await SessionParticipant.find({}).limit(5);
    console.log("📋 Sample participants:", sampleParticipants.length);
    
    return NextResponse.json({ 
      message: "Debug endpoint working",
      totalParticipants,
      sampleParticipants: sampleParticipants.map(p => ({
        id: p._id,
        sessionId: p.sessionId,
        userId: p.userId,
        userName: p.userName,
        status: p.status,
        joinedAt: p.joinedAt
      }))
    }, { status: 200 });
  } catch (error) {
    console.error("❌ Debug endpoint error:", error);
    return NextResponse.json({ 
      error: "Debug endpoint failed",
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
} 