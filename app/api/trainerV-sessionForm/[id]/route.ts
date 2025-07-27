import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import VirtualSession from '@/models/VirtualSession';
import { sendEmail } from '@/lib/sendEmail';
import dedent from 'dedent';
import Member from '@/models/member';

// GET: Fetch a single virtual session by its ID
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const session = await VirtualSession.findById(params.id);

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json(session, { status: 200 });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}

// PUT: Update a virtual session by its ID
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    await connectToDatabase();

    const requiredFields = [
      'title',
      'trainer',
      'date',
      'startTime',
      'endTime',
      'onlineLink',
      'maxParticipants'
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing field: ${field}` }, { status: 400 });
      }
    }

    // Validate that end time is after start time
    if (body.startTime && body.endTime) {
      const startTime = new Date(`2000-01-01T${body.startTime}`);
      const endTime = new Date(`2000-01-01T${body.endTime}`);
      
      if (endTime <= startTime) {
        return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
      }
    }

    // Check for duplicate zoom links on the same date (excluding current session)
    const existingSession = await VirtualSession.findOne({
      date: new Date(body.date),
      onlineLink: body.onlineLink,
      _id: { $ne: params.id }
    });

    if (existingSession) {
      return NextResponse.json({ 
        error: 'This zoom link is already being used for another session on the same date. Please use a different link.' 
      }, { status: 409 });
    }

    const updated = await VirtualSession.findByIdAndUpdate(
      params.id,
      {
        title: body.title,
        trainer: body.trainer,
        date: body.date,
        startTime: body.startTime,
        endTime: body.endTime,
        maxParticipants: body.maxParticipants,
        description: body.description || '',
        onlineLink: body.onlineLink,
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Send reschedule email to all participants and trainer
    const allParticipants = updated.participants || [];
    const emails = [body.trainer.email, ...allParticipants.map((p: any) => p.email)].filter(Boolean);
    for (const email of emails) {
      try {
        await sendEmail({
          to: email,
          subject: `🔄 Session Rescheduled: ${updated.title}`,
          html: dedent`
            <div style="background:#e53935;padding:24px 0 0 0;text-align:center;border-radius:8px 8px 0 0;">
              <h1 style="color:#fff;margin:0;font-size:2rem;font-family:sans-serif;">FitSync Pro</h1>
            </div>
            <div style="background:#fff;padding:32px 32px 24px 32px;border-radius:0 0 8px 8px;font-family:sans-serif;max-width:600px;margin:auto;">
              <h2 style="color:#e53935;margin-top:0;">Virtual Session Rescheduled</h2>
              <p>The session <b>${updated.title}</b> has been rescheduled.</p>
              <ul style="padding-left:20px;text-align:left;">
                <li><b>Date:</b> ${new Date(updated.date).toLocaleDateString()}</li>
                <li><b>Start Time:</b> ${updated.startTime}</li>
                <li><b>End Time:</b> ${updated.endTime}</li>
                <li><b>Meeting Link:</b> <a href="${updated.onlineLink}">${updated.onlineLink}</a></li>
                <li><b>Description:</b> ${updated.description || ''}</li>
              </ul>
            </div>
          `
        });
      } catch (err) {
        console.error('Failed to send reschedule email to', email, err);
      }
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}

// DELETE: Remove a virtual session by its ID
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const deleted = await VirtualSession.findByIdAndDelete(params.id);

    if (!deleted) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Send cancellation email to all participants and trainer
    const allParticipants = deleted.participants || [];
    const emails = [deleted.trainer.email, ...allParticipants.map((p: any) => p.email)].filter(Boolean);
    for (const email of emails) {
      try {
        await sendEmail({
          to: email,
          subject: `❌ Session Cancelled: ${deleted.title}`,
          html: dedent`
            <div style="background:#e53935;padding:24px 0 0 0;text-align:center;border-radius:8px 8px 0 0;">
              <h1 style="color:#fff;margin:0;font-size:2rem;font-family:sans-serif;">FitSync Pro</h1>
            </div>
            <div style="background:#fff;padding:32px 32px 24px 32px;border-radius:0 0 8px 8px;font-family:sans-serif;max-width:600px;margin:auto;">
              <h2 style="color:#e53935;margin-top:0;">Virtual Session Cancelled</h2>
              <p>The session <b>${deleted.title}</b> has been cancelled.</p>
            </div>
          `
        });
      } catch (err) {
        console.error('Failed to send cancellation email to', email, err);
      }
    }

    return NextResponse.json({ message: 'Session deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}
