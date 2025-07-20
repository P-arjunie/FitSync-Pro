import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from "../../../../lib/mongodb";
import Session from "@/models/Session";
import SessionParticipant from "@/models/SessionParticipant";
import { sendEmail } from '@/lib/sendEmail';
import dedent from 'dedent';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const { participantId } = await request.json();
    
    if (!participantId) {
      return NextResponse.json({ error: "Participant ID required" }, { status: 400 });
    }

    // Find the participant
    const participant = await SessionParticipant.findById(participantId);
    if (!participant) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }

    // Check if this is the correct session
    if (participant.sessionId !== id) {
      return NextResponse.json({ error: "Invalid session" }, { status: 400 });
    }

    // Check if already approved/rejected
    if (participant.status !== 'pending') {
      return NextResponse.json({ error: `Booking already ${participant.status}` }, { status: 409 });
    }

    // Get session details
    const session = await Session.findById(id);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check if session is full
    const approvedParticipants = await SessionParticipant.countDocuments({
      sessionId: id,
      status: 'approved'
    });

    if (approvedParticipants >= session.maxParticipants) {
      return NextResponse.json({ error: "Session is full" }, { status: 409 });
    }

    // Approve the booking
    await SessionParticipant.findByIdAndUpdate(participantId, {
      status: 'approved',
      approvedAt: new Date()
    });

    // Send approval email to member
    if (participant.userEmail) {
      try {
        await sendEmail({
          to: participant.userEmail,
          subject: `✅ Booking Approved: ${session.title}`,
          text: `Your booking request for "${session.title}" has been approved!`,
          html: dedent`
            <p>Hi ${participant.userName},</p>
            <p>Great news! Your booking request for <strong>${session.title}</strong> has been <strong>APPROVED</strong>!</p>
            <p><strong>Session Details:</strong><br/>
            <strong>Date:</strong> ${new Date(session.start).toLocaleDateString()}<br/>
            <strong>Time:</strong> ${new Date(session.start).toLocaleTimeString()} - ${new Date(session.end).toLocaleTimeString()}<br/>
            <strong>Location:</strong> ${session.location}<br/>
            <strong>Trainer:</strong> ${session.trainerName}</p>
            <p>Please arrive 10 minutes before the session starts. We look forward to seeing you!</p>
            <br/>
            <p>Thank you,<br/>FitSync Pro Team</p>
          `
        });
        console.log("✅ Approval email sent to member");
      } catch (emailError) {
        console.error("❌ Failed to send approval email:", emailError);
      }
    }

    return NextResponse.json({ 
      message: "Booking approved successfully",
      status: "approved"
    }, { status: 200 });
  } catch (error) {
    console.error("Error approving booking:", error);
    return NextResponse.json({ error: "Failed to approve booking" }, { status: 500 });
  }
} 