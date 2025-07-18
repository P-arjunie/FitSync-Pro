import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from "../../../../lib/mongodb";
import Session from "@/models/Session";
import SessionParticipant from "@/models/SessionParticipant";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    
    // Get user info from request (you'll need to pass this from frontend)
    const { userId, userName } = await request.json();
    
    if (!userId || !userName) {
      return NextResponse.json({ error: "User information required" }, { status: 400 });
    }

    // Check if session exists and is not full
    const session = await Session.findById(id);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.currentParticipants >= session.maxParticipants) {
      return NextResponse.json({ error: "Session is full" }, { status: 409 });
    }

    // Check if user already joined
    const existingParticipant = await SessionParticipant.findOne({
      sessionId: id,
      userId: userId
    });

    if (existingParticipant) {
      return NextResponse.json({ error: "Already joined this session" }, { status: 409 });
    }

    // Add participant
    await SessionParticipant.create({
      sessionId: id,
      userId: userId,
      userName: userName
    });

    // Update session participant count
    await Session.findByIdAndUpdate(id, {
      $inc: { currentParticipants: 1 }
    });

    return NextResponse.json({ message: "Successfully joined session" }, { status: 200 });
  } catch (error) {
    console.error("Error joining session:", error);
    return NextResponse.json({ error: "Failed to join session" }, { status: 500 });
  }
}
