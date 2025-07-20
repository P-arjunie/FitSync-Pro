import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from "../../../lib/mongodb";
import Session from "@/models/Session";
import SessionParticipant from "@/models/SessionParticipant";
import { sendEmail } from '@/lib/sendEmail';
import dedent from 'dedent';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const { hoursBefore = 24 } = await request.json(); // Default to 24 hours before

    const now = new Date();
    const reminderTime = new Date(now.getTime() + hoursBefore * 60 * 60 * 1000);

    // Find sessions that start within the reminder window
    const upcomingSessions = await Session.find({
      start: {
        $gte: now,
        $lte: reminderTime
      }
    });

    console.log(`📧 Found ${upcomingSessions.length} sessions for reminder notifications`);

    let totalRemindersSent = 0;
    let totalErrors = 0;

    for (const session of upcomingSessions) {
      try {
        // Get approved participants for this session
        const approvedParticipants = await SessionParticipant.find({
          sessionId: session._id,
          status: 'approved'
        });

        console.log(`📧 Sending reminders for session "${session.title}" to ${approvedParticipants.length} participants`);

        for (const participant of approvedParticipants) {
          if (participant.userEmail) {
            try {
              await sendEmail({
                to: participant.userEmail,
                subject: `⏰ Session Reminder: ${session.title} in ${hoursBefore} hours`,
                text: `Reminder: Your session "${session.title}" starts in ${hoursBefore} hours.`,
                html: dedent`
                  <p>Hi ${participant.userName},</p>
                  <p>This is a friendly reminder about your upcoming session!</p>
                  <p><strong>Session:</strong> ${session.title}<br/>
                  <strong>Date:</strong> ${new Date(session.start).toLocaleDateString()}<br/>
                  <strong>Time:</strong> ${new Date(session.start).toLocaleTimeString()} - ${new Date(session.end).toLocaleTimeString()}<br/>
                  <strong>Location:</strong> ${session.location}<br/>
                  <strong>Trainer:</strong> ${session.trainerName}</p>
                  <p>Please arrive 10 minutes before the session starts. Don't forget to bring your workout gear!</p>
                  <br/>
                  <p>See you there!<br/>FitSync Pro Team</p>
                `
              });
              totalRemindersSent++;
              console.log(`✅ Reminder sent to ${participant.userEmail}`);
            } catch (emailError) {
              totalErrors++;
              console.error(`❌ Failed to send reminder to ${participant.userEmail}:`, emailError);
            }
          }
        }
      } catch (sessionError) {
        console.error(`❌ Error processing session ${session._id}:`, sessionError);
        totalErrors++;
      }
    }

    return NextResponse.json({
      message: "Reminder notifications processed",
      summary: {
        sessionsProcessed: upcomingSessions.length,
        remindersSent: totalRemindersSent,
        errors: totalErrors
      }
    }, { status: 200 });
  } catch (error) {
    console.error("Error sending reminders:", error);
    return NextResponse.json({ error: "Failed to send reminders" }, { status: 500 });
  }
}

// GET endpoint to manually trigger reminders (for testing)
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const hoursBefore = parseInt(searchParams.get('hoursBefore') || '24');

    const now = new Date();
    const reminderTime = new Date(now.getTime() + hoursBefore * 60 * 60 * 1000);

    // Find sessions that start within the reminder window
    const upcomingSessions = await Session.find({
      start: {
        $gte: now,
        $lte: reminderTime
      }
    }).populate('trainerName');

    // Get participant counts for each session
    const sessionsWithParticipants = await Promise.all(
      upcomingSessions.map(async (session) => {
        const approvedCount = await SessionParticipant.countDocuments({
          sessionId: session._id,
          status: 'approved'
        });
        return {
          ...session.toObject(),
          approvedParticipants: approvedCount
        };
      })
    );

    return NextResponse.json({
      message: "Upcoming sessions for reminders",
      hoursBefore,
      sessions: sessionsWithParticipants
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching upcoming sessions:", error);
    return NextResponse.json({ error: "Failed to fetch upcoming sessions" }, { status: 500 });
  }
} 