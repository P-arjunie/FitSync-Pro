import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import VirtualSession from '@/models/VirtualSession';
import { sendEmail } from '@/lib/sendEmail';
import dedent from 'dedent';
import Member from '@/models/member';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("🔥 Incoming request body:", body);

    try {
      await connectToDatabase();
      console.log("✅ Connected to MongoDB");
    } catch (dbError) {
      console.error("❌ Database connection failed:", dbError);
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

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

    // Create session document
    const newSession = new VirtualSession({
      title: body.title,
      trainer: body.trainer,
      date: new Date(body.date), // Convert string to Date object
      startTime: body.startTime,
      endTime: body.endTime,
      maxParticipants: body.maxParticipants,
      description: body.description || '',
      onlineLink: body.onlineLink,
      participants: body.participants || [],
    });

    console.log("📦 Prepared to save:", newSession);
    await newSession.save();
    console.log("✅ Session saved!");

    // Send email to trainer using correct email and name
    console.log("📧 Sending email to trainer:", body.trainer.email);
    try {
      await sendEmail({
        to: body.trainer.email,
        subject: `📅 New Virtual Session Created: ${body.title}`,
        text: `Trainer "${body.trainer.name}" scheduled a session on ${body.date} from ${body.startTime} to ${body.endTime}.`,
        html: dedent`
          <p>Trainer <strong>${body.trainer.name}</strong> has scheduled a new session.</p>
          <p><strong>Date:</strong> ${body.date}<br/>
          <strong>Time:</strong> ${body.startTime} - ${body.endTime}<br/>
          <strong>Link:</strong> <a href="${body.onlineLink}" target="_blank">${body.onlineLink}</a><br/>
          <strong>Max Participants:</strong> ${body.maxParticipants}</p>
          <p>Thanks,<br/>FitSync Pro</p>
        `
      });
      console.log("✅ Trainer email sent successfully!");
    } catch (trainerEmailError) {
      console.error("❌ Failed to send trainer email:", trainerEmailError);
    }

    // Send emails to all approved members (like physical session)
    try {
      const approvedMembers = await Member.find({ status: "approved", email: { $exists: true, $ne: "" } });
      console.log(`📧 Sending emails to ${approvedMembers.length} approved members...`);
      for (const member of approvedMembers) {
        if (member.email) {
          // Validate email format and domain
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          const isValidEmail = emailRegex.test(member.email);
          const isNotExampleDomain = !member.email.includes('@example.com') && !member.email.includes('@test.com');
          if (!isValidEmail || !isNotExampleDomain) {
            console.warn(`⚠️ Invalid email address, skipping member: ${member.email}`);
            continue;
          }
          try {
            await sendEmail({
              to: member.email,
              subject: `📅 New Virtual Session Available: ${body.title}`,
              text: `Hi ${member.firstName || 'Member'},\n\nA new virtual session "${body.title}" has been scheduled on ${body.date} from ${body.startTime} to ${body.endTime}. Join here: ${body.onlineLink}`,
              html: dedent`
                <p>Hi ${member.firstName || 'Member'},</p>
                <p>A new virtual session <strong>${body.title}</strong> has been scheduled!</p>
                <p><strong>Date:</strong> ${body.date}<br/>
                <strong>Time:</strong> ${body.startTime} - ${body.endTime}<br/>
                <strong>Link:</strong> <a href="${body.onlineLink}" target="_blank">${body.onlineLink}</a><br/>
                <strong>Trainer:</strong> ${body.trainer.name}<br/>
                <strong>Max Participants:</strong> ${body.maxParticipants}</p>
                <p>Log in to your FitSync Pro account to join this session!</p>
                <br/>
                <p>Thank you,<br/>FitSync Pro Team</p>
              `
            });
            console.log(`✅ Email sent to member: ${member.email}`);
          } catch (memberEmailError) {
            console.error(`❌ Failed to send email to member ${member.email}:`, memberEmailError);
          }
        }
      }
    } catch (membersEmailError) {
      console.error("❌ Failed to send member emails:", membersEmailError);
    }

    // Send emails to each participant
    if (Array.isArray(body.participants) && body.participants.length > 0) {
      console.log(`📧 Sending emails to ${body.participants.length} participants...`);
      for (const participant of body.participants) {
        if (participant.email) {
          // Validate email format and domain
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          const isValidEmail = emailRegex.test(participant.email);
          const isNotExampleDomain = !participant.email.includes('@example.com') && !participant.email.includes('@test.com');
          
          if (!isValidEmail || !isNotExampleDomain) {
            console.warn(`⚠️ Invalid email address, skipping participant: ${participant.email}`);
            continue;
          }
          
          try {
            await sendEmail({
              to: participant.email,
              subject: `📅 You're invited: ${body.title} virtual session`,
              text: `Hi ${participant.firstName || 'Participant'},\n\nYou have been invited to the session "${body.title}" scheduled on ${body.date} from ${body.startTime} to ${body.endTime}. Join here: ${body.onlineLink}`,
              html: dedent`
                <p>Hi ${participant.firstName || 'Participant'},</p>
                <p>You have been invited to the virtual session <strong>${body.title}</strong> scheduled for <strong>${body.date}</strong> from <strong>${body.startTime}</strong> to <strong>${body.endTime}</strong>.</p>
                <p>Join the session using the link: <a href="${body.onlineLink}" target="_blank">${body.onlineLink}</a></p>
                <br/>
                <p>Thank you,<br/>FitSync Pro Team</p>
              `
            });
            console.log(`✅ Email sent to participant: ${participant.email}`);
          } catch (emailError) {
            console.error(`❌ Failed to send email to ${participant.email}:`, emailError);
          }
        } else {
          console.warn(`⚠️ Participant email missing, skipping participant:`, participant);
        }
      }
    }

    return NextResponse.json(
      { message: 'Session created & emails sent!', session: newSession },
      { status: 201 }
    );

  } catch (error) {
    console.error('❌ Error creating session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
