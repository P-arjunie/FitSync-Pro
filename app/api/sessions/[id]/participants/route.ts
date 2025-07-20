import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from "../../../../lib/mongodb";
import SessionParticipant from "@/models/SessionParticipant";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    
    // Get all participants for this session with status
    const participants = await SessionParticipant.find({ sessionId: id })
      .sort({ joinedAt: 1 }); // Sort by join date
    
    // Group participants by status
    const pendingParticipants = participants.filter(p => p.status === 'pending');
    const approvedParticipants = participants.filter(p => p.status === 'approved');
    const rejectedParticipants = participants.filter(p => p.status === 'rejected');
    
    return NextResponse.json({
      all: participants,
      pending: pendingParticipants,
      approved: approvedParticipants,
      rejected: rejectedParticipants,
      counts: {
        total: participants.length,
        pending: pendingParticipants.length,
        approved: approvedParticipants.length,
        rejected: rejectedParticipants.length
      }
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching participants:", error);
    return NextResponse.json({ error: "Failed to fetch participants" }, { status: 500 });
  }
}
