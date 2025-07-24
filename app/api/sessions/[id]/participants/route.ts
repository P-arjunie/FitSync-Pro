import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from "../../../../lib/mongodb";
import SessionParticipant from "@/models/SessionParticipant";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("🔍 Participants API called for session:", params.id);
    
    await connectToDatabase();
    const { id } = await params;
    
    console.log("📊 Fetching participants for session ID:", id);
    
    // Get all participants for this session with status
    const participants = await SessionParticipant.find({ sessionId: id })
      .sort({ joinedAt: 1 }); // Sort by join date
    
    console.log("📋 Found participants:", participants.length);
    
    // Group participants by status
    const pendingParticipants = participants.filter(p => p.status === 'pending');
    const approvedParticipants = participants.filter(p => p.status === 'approved');
    const rejectedParticipants = participants.filter(p => p.status === 'rejected');
    const cancelledParticipants = participants.filter(p => p.status === 'cancelled');
    
    const response = {
      all: participants,
      pending: pendingParticipants,
      approved: approvedParticipants,
      rejected: rejectedParticipants,
      cancelled: cancelledParticipants,
      counts: {
        total: participants.length,
        pending: pendingParticipants.length,
        approved: approvedParticipants.length,
        rejected: rejectedParticipants.length,
        cancelled: cancelledParticipants.length
      }
    };
    
    console.log("✅ Participants response:", response.counts);
    
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching participants:", error);
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ 
      error: "Failed to fetch participants",
      details: errorMessage
    }, { status: 500 });
  }
}
