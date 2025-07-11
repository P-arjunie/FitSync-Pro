import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from "../../../../lib/mongodb";
import SessionParticipant from "@/models/SessionParticipant";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    
    // Get all participants for this session
    const participants = await SessionParticipant.find({ sessionId: id })
      .sort({ joinedAt: 1 }); // Sort by join date
    
    return NextResponse.json(participants, { status: 200 });
  } catch (error) {
    console.error("Error fetching participants:", error);
    return NextResponse.json({ error: "Failed to fetch participants" }, { status: 500 });
  }
}
