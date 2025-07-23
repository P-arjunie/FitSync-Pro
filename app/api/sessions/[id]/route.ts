// app/api/sessions/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {connectToDatabase} from "../../../lib/mongodb";

import Session from '@/models/Session';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const session = await Session.findById(context.params.id);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(session, { status: 200 });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const body = await request.json();
    await connectToDatabase();
    
    // Validate the incoming data
    if (!body.title || !body.trainerName || !body.start || !body.end || !body.location || !body.maxParticipants) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if end time is after start time
    const startTime = new Date(body.start);
    const endTime = new Date(body.end);
    
    if (endTime <= startTime) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      );
    }

    // Check for scheduling conflicts (excluding this session)
    const conflictingSession = await Session.findOne({
      _id: { $ne: context.params.id },
      trainerName: body.trainerName,
      $or: [
        // Session starts during an existing session
        {
          start: { $lte: startTime },
          end: { $gt: startTime }
        },
        // Session ends during an existing session
        {
          start: { $lt: endTime },
          end: { $gte: endTime }
        },
        // Session completely contains an existing session
        {
          start: { $gte: startTime },
          end: { $lte: endTime }
        }
      ]
    });

    if (conflictingSession) {
      return NextResponse.json(
        { error: 'Scheduling conflict: The trainer is already booked during this time' },
        { status: 409 }
      );
    }

    // Update the session
    const updatedSession = await Session.findByIdAndUpdate(
      context.params.id,
      {
        ...body,
        maxParticipants: Number(body.maxParticipants),
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedSession, { status: 200 });
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const body = await request.json();
    await connectToDatabase();

    // Handle session cancellation if requested
    if (body.cancel === true) {
      const SessionParticipant = (await import('@/models/SessionParticipant')).default;
      const { sendEmail } = await import('@/lib/sendEmail');
      const dedent = (await import('dedent')).default;
      const session = await Session.findById(context.params.id);
      if (!session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }
      if (new Date() > session.start) {
        return NextResponse.json({ error: 'Cannot cancel past sessions' }, { status: 400 });
      }
      const approvedParticipants = await SessionParticipant.find({
        sessionId: context.params.id,
        status: 'approved'
      });
      let emailsSent = 0;
      let emailErrors = 0;
      for (const participant of approvedParticipants) {
        if (participant.userEmail) {
          try {
            await sendEmail({
              to: participant.userEmail,
              subject: `❌ Session Cancelled: ${session.title}`,
              text: `The session "${session.title}" has been cancelled.`,
              html: dedent`
                <p>Hi ${participant.userName},</p>
                <p>We regret to inform you that the following session has been <strong>CANCELLED</strong>:</p>
                <p><strong>Session:</strong> ${session.title}<br/>
                <strong>Date:</strong> ${new Date(session.start).toLocaleDateString()}<br/>
                <strong>Time:</strong> ${new Date(session.start).toLocaleTimeString()} - ${new Date(session.end).toLocaleTimeString()}<br/>
                <strong>Location:</strong> ${session.location}<br/>
                <strong>Trainer:</strong> ${session.trainerName}</p>
                ${body.cancellationReason ? `<p><strong>Reason:</strong> ${body.cancellationReason}</p>` : ''}
                <p>Cancelled by: ${body.cancelledBy || 'Unknown'}</p>
                <p>Please check our schedule for alternative sessions or contact the trainer for rescheduling options.</p>
                <br/>
                <p>Thank you for your understanding,<br/>FitSync Pro Team</p>
              `
            });
            emailsSent++;
          } catch (emailError) {
            emailErrors++;
            console.error(`❌ Failed to send cancellation email to ${participant.userEmail}:`, emailError);
          }
        }
      }
      await SessionParticipant.updateMany(
        { sessionId: context.params.id },
        {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancellationReason: body.cancellationReason || 'No reason provided'
        }
      );
      await Session.findByIdAndUpdate(context.params.id, {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelledBy: body.cancelledBy || null,
        cancellationReason: body.cancellationReason || 'No reason provided'
      });
      return NextResponse.json({
        message: 'Session cancelled successfully',
        summary: {
          participantsNotified: emailsSent,
          emailErrors: emailErrors,
          totalParticipants: approvedParticipants.length
        }
      }, { status: 200 });
    }

    // Only allow updating certain fields
    const updateFields: any = {};
    if (body.maxParticipants !== undefined) updateFields.maxParticipants = body.maxParticipants;
    if (body.start !== undefined) updateFields.start = body.start;
    if (body.end !== undefined) updateFields.end = body.end;
    if (body.location !== undefined) updateFields.location = body.location;
    if (body.title !== undefined) updateFields.title = body.title;
    if (body.description !== undefined) updateFields.description = body.description;
    // Don't allow updating canceled/cancellationReason here

    // Fetch the original session before update
    const originalSession = await Session.findById(context.params.id);
    if (!originalSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Update the session
    const updatedSession = await Session.findByIdAndUpdate(
      context.params.id,
      updateFields,
      { new: true, runValidators: true }
    );
    if (!updatedSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // If reschedule (start, end, or location changed), notify participants
    const rescheduled = (
      (body.start && body.start !== originalSession.start.toISOString()) ||
      (body.end && body.end !== originalSession.end.toISOString()) ||
      (body.location && body.location !== originalSession.location)
    );
    if (rescheduled) {
      // Fetch all approved participants
      const SessionParticipant = (await import('@/models/SessionParticipant')).default;
      const { sendEmail } = await import('@/lib/sendEmail');
      const dedent = (await import('dedent')).default;
      const approvedParticipants = await SessionParticipant.find({
        sessionId: context.params.id,
        status: 'approved'
      });
      for (const participant of approvedParticipants) {
        if (participant.userEmail) {
          try {
            await sendEmail({
              to: participant.userEmail,
              subject: `Session Rescheduled: ${updatedSession.title}`,
              text: `The session "${updatedSession.title}" has been rescheduled.\nNew Date: ${new Date(updatedSession.start).toLocaleDateString()}\nNew Time: ${new Date(updatedSession.start).toLocaleTimeString()} - ${new Date(updatedSession.end).toLocaleTimeString()}\nLocation: ${updatedSession.location}` + (body.rescheduleReason ? `\nReason: ${body.rescheduleReason}` : ''),
              html: dedent`
                <p>Hi ${participant.userName},</p>
                <p>The following session has been <strong>RESCHEDULED</strong>:</p>
                <p><strong>Session:</strong> ${updatedSession.title}<br/>
                <strong>New Date:</strong> ${new Date(updatedSession.start).toLocaleDateString()}<br/>
                <strong>New Time:</strong> ${new Date(updatedSession.start).toLocaleTimeString()} - ${new Date(updatedSession.end).toLocaleTimeString()}<br/>
                <strong>New Location:</strong> ${updatedSession.location}<br/>
                <strong>Trainer:</strong> ${updatedSession.trainerName}</p>
                ${body.rescheduleReason ? `<p><strong>Reason:</strong> ${body.rescheduleReason}</p>` : ''}
                <p>Please check your schedule for the updated session time.</p>
                <br/>
                <p>Thank you,<br/>FitSync Pro Team</p>
              `
            });
          } catch (emailError) {
            console.error(`❌ Failed to send reschedule email to ${participant.userEmail}:`, emailError);
          }
        }
      }
    }
    return NextResponse.json(updatedSession, { status: 200 });
  } catch (error) {
    console.error('Error patching session:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const deletedSession = await Session.findByIdAndDelete(context.params.id);
    
    if (!deletedSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Session deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}