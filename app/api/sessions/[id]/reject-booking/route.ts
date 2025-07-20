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
    const { participantId, rejectionReason } = await request.json();
    
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

    // Reject the booking
    await SessionParticipant.findByIdAndUpdate(participantId, {
      status: 'rejected',
      rejectedAt: new Date(),
      rejectionReason: rejectionReason || 'No reason provided'
    });

    // Send rejection email to member
    if (participant.userEmail) {
      try {
        await sendEmail({
          to: participant.userEmail,
          subject: `❌ Booking Rejected: ${session.title}`,
          text: `Your booking request for "${session.title}" has been rejected.`,
          html: dedent`
            <p>Hi ${participant.userName},</p>
            <p>We regret to inform you that your booking request for <strong>${session.title}</strong> has been <strong>REJECTED</strong>.</p>
            <p><strong>Session Details:</strong><br/>
            <strong>Date:</strong> ${new Date(session.start).toLocaleDateString()}<br/>
            <strong>Time:</strong> ${new Date(session.start).toLocaleTimeString()} - ${new Date(session.end).toLocaleTimeString()}<br/>
            <strong>Location:</strong> ${session.location}<br/>
            <strong>Trainer:</strong> ${session.trainerName}</p>
            ${rejectionReason ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ''}
            <p>You can browse other available sessions or contact the trainer for more information.</p>
            <br/>
            <p>Thank you,<br/>FitSync Pro Team</p>
          `
        });
        console.log("✅ Rejection email sent to member");
      } catch (emailError) {
        console.error("❌ Failed to send rejection email:", emailError);
      }
    }

    return NextResponse.json({ 
      message: "Booking rejected successfully",
      status: "rejected"
    }, { status: 200 });
  } catch (error) {
    console.error("Error rejecting booking:", error);
    return NextResponse.json({ error: "Failed to reject booking" }, { status: 500 });
  }
} 