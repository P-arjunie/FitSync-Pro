import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import VirtualSession from '@/models/VirtualSession';
import { sendEmail } from '@/lib/sendEmail';
import dedent from 'dedent'; // <-- keep your original imports

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("🔥 Incoming request body:", body);

    await connectToDatabase();
    console.log("✅ Connected to MongoDB");

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
        console.log(`❌ Missing field: ${field}`);
        return NextResponse.json({ error: `Missing field: ${field}` }, { status: 400 });
      }
    }

    // Add participants field here with fallback to empty array
    const newSession = new VirtualSession({
      title: body.title,
      trainer: body.trainer,
      date: body.date,
      startTime: body.startTime,
      endTime: body.endTime,
      maxParticipants: body.maxParticipants,
      description: body.description || '',
      onlineLink: body.onlineLink,
      participants: body.participants || [],  // <-- NEW addition here
    });

    console.log("📦 Prepared to save:", newSession);
    await newSession.save();
    console.log("✅ Session saved!");

    if (body.trainer?.email) {
      await sendEmail({
        to: body.trainer.email,
        subject: `📅 New Virtual Session Created: ${body.title}`,
        text: `Hi ${body.trainer.name || 'Trainer'}, your session "${body.title}" is scheduled on ${body.date} from ${body.startTime} to ${body.endTime}. Meeting link: ${body.onlineLink}`,
        html: dedent`
          <p>Hello ${body.trainer.name || 'Trainer'},</p>
          <p>Your new session <strong>${body.title}</strong> has been scheduled for <strong>${body.date}</strong> from <strong>${body.startTime}</strong> to <strong>${body.endTime}</strong>.</p>
          <p>Meeting Link: <a href="${body.onlineLink}" target="_blank">${body.onlineLink}</a></p>
          <p>Max Participants: ${body.maxParticipants}</p>
          <br/>
          <p>Thank you,<br/>FitSync Pro Team</p>
        `
      });
    } else {
      console.warn("⚠️ Trainer email missing. Email not sent.");
    }

    return NextResponse.json({ message: 'Session created & email sent!', session: newSession }, { status: 201 });
  } catch (error) {
    console.error('❌ Error creating session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
