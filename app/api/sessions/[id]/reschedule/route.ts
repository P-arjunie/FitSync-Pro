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
    const { newStart, newEnd, reason, rescheduledBy } = await request.json();
    
    if (!newStart || !newEnd || !rescheduledBy) {
      return NextResponse.json({ 
        error: "New start time, end time, and rescheduled by information required" 
      }, { status: 400 });
    }

    // Find the session
    const session = await Session.findById(id);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check if session is in the past
    if (new Date() > session.start) {
      return NextResponse.json({ error: "Cannot reschedule past sessions" }, { status: 400 });
    }

    // Validate new times
    const newStartTime = new Date(newStart);
    const newEndTime = new Date(newEnd);
    
    if (newEndTime <= newStartTime) {
      return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
    }

    // Check for scheduling conflicts (excluding this session)
    const conflictingSession = await Session.findOne({
      _id: { $ne: id },
      trainerName: session.trainerName,
      status: 'active',
      $or: [
        // New session starts during an existing session
        {
          start: { $lte: newStartTime },
          end: { $gt: newStartTime }
        },
        // New session ends during an existing session
        {
          start: { $lt: newEndTime },
          end: { $gte: newEndTime }
        },
        // New session completely contains an existing session
        {
          start: { $gte: newStartTime },
          end: { $lte: newEndTime }
        }
      ]
    });

    if (conflictingSession) {
      return NextResponse.json(
        { error: 'Scheduling conflict: The trainer is already booked during this time' },
        { status: 409 }
      );
    }

    // Get all approved participants
    const approvedParticipants = await SessionParticipant.find({
      sessionId: id,
      status: 'approved'
    });

    console.log(`📧 Sending reschedule notifications to ${approvedParticipants.length} participants`);

    // Send reschedule emails to all approved participants
    let emailsSent = 0;
    let emailErrors = 0;

    for (const participant of approvedParticipants) {
      if (participant.userEmail) {
        try {
          await sendEmail({
            to: participant.userEmail,
            subject: `🔄 Session Rescheduled: ${session.title}`,
            text: `The session "${session.title}" has been rescheduled.`,
            html: dedent`
              <p>Hi ${participant.userName},</p>
              <p>The following session has been <strong>RESCHEDULED</strong>:</p>
              <p><strong>Session:</strong> ${session.title}<br/>
              <strong>Trainer:</strong> ${session.trainerName}<br/>
              <strong>Location:</strong> ${session.location}</p>
              
              <p><strong>NEW SCHEDULE:</strong><br/>
              <strong>Date:</strong> ${newStartTime.toLocaleDateString()}<br/>
              <strong>Time:</strong> ${newStartTime.toLocaleTimeString()} - ${newEndTime.toLocaleTimeString()}</p>
              
              ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
              <p>Rescheduled by: ${rescheduledBy}</p>
              <p>Please update your calendar and arrive 10 minutes before the new start time.</p>
              <br/>
              <p>Thank you,<br/>FitSync Pro Team</p>
            `
          });
          emailsSent++;
          console.log(`✅ Reschedule email sent to ${participant.userEmail}`);
        } catch (emailError) {
          emailErrors++;
          console.error(`❌ Failed to send reschedule email to ${participant.userEmail}:`, emailError);
        }
      }
    }

    // Update session with new times
    await Session.findByIdAndUpdate(id, {
      start: newStartTime,
      end: newEndTime,
      rescheduledAt: new Date(),
      rescheduledBy: rescheduledBy,
      rescheduleReason: reason || 'No reason provided'
    });

    console.log(`✅ Session rescheduled successfully. ${emailsSent} emails sent, ${emailErrors} failed`);

    return NextResponse.json({
      message: "Session rescheduled successfully",
      summary: {
        participantsNotified: emailsSent,
        emailErrors: emailErrors,
        totalParticipants: approvedParticipants.length,
        newSchedule: {
          start: newStartTime,
          end: newEndTime
        }
      }
    }, { status: 200 });
  } catch (error) {
    console.error("Error rescheduling session:", error);
    return NextResponse.json({ error: "Failed to reschedule session" }, { status: 500 });
  }
} 