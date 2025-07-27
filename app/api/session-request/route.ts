import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import SessionRequest from '@/models/SessionRequest';
import nodemailer from 'nodemailer';
import { sendEmail } from '@/lib/sendEmail';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const trainerId = searchParams.get('trainerId');
  if (!trainerId) {
    return new Response(JSON.stringify({ requests: [] }), { status: 200 });
  }
  await connectToDatabase();
  const requests = await SessionRequest.find({ trainerId }).sort({ createdAt: -1 });
  const safeRequests = requests.map(r => ({
    ...r.toObject(),
    id: r._id.toString(),
    _id: undefined,
    __v: undefined,
  }));
  return new Response(JSON.stringify({ requests: safeRequests }), { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { trainerEmail, memberEmail, requestDetails } = body;

    await connectToDatabase();
    const newRequest = new SessionRequest({
      ...requestDetails,
      status: 'pending',
      createdAt: new Date(),
    });

    try {
      await newRequest.save();
      console.log('Inserted request:', newRequest._id);
    } catch (err) {
      let message = 'Unknown error';
      if (err instanceof Error) message = err.message;
      else if (typeof err === 'object' && err && 'message' in err) message = (err as any).message;
      console.error('❌ Failed to save session request:', err);
      return new Response(JSON.stringify({ error: 'Failed to save session request', details: message }), { status: 500 });
    }

    // Use BASE_URL from environment for dashboard link
    const dashboardLink = `${process.env.BASE_URL}/communication-and-notifications/session-request?highlight=${newRequest._id}`;

    // Email templates (FitSync Pro branded)
    const trainerHtml = `
      <div style="background:#e53935;padding:24px 0 0 0;text-align:center;border-radius:8px 8px 0 0;">
        <h1 style="color:#fff;margin:0;font-size:2rem;font-family:sans-serif;">FitSync Pro</h1>
      </div>
      <div style="background:#fff;padding:32px 32px 24px 32px;border-radius:0 0 8px 8px;font-family:sans-serif;max-width:600px;margin:auto;">
        <h2 style="color:#e53935;margin-top:0;">New Session Request</h2>
        <p>You have a new session request from <b>${requestDetails.memberName}</b> (<a href="mailto:${requestDetails.memberEmail}">${requestDetails.memberEmail}</a>).</p>
        <ul style="padding-left:20px;text-align:left;">
          <li><b>Session Name:</b> ${requestDetails.sessionName}</li>
          <li><b>Session Type:</b> ${requestDetails.sessionType}</li>
          <li><b>Date:</b> ${requestDetails.preferredDate}</li>
          <li><b>Time:</b> ${requestDetails.preferredTime}</li>
          <li><b>Pricing Plan:</b> ${requestDetails.pricingPlan}</li>
          ${requestDetails.notes ? `<li><b>Notes:</b> ${requestDetails.notes}</li>` : ''}
        </ul>
        <a href="${dashboardLink}" style="color:#e53935;text-decoration:none;display:inline-block;margin-top:16px;">
          <button style="background:#e53935;color:#fff;padding:10px 28px;border-radius:5px;border:none;font-weight:bold;font-size:1rem;">Review Request</button>
        </a>
      </div>
    `;

    const memberHtml = `
      <div style="background:#e53935;padding:24px 0 0 0;text-align:center;border-radius:8px 8px 0 0;">
        <h1 style="color:#fff;margin:0;font-size:2rem;font-family:sans-serif;">FitSync Pro</h1>
      </div>
      <div style="background:#fff;padding:32px 32px 24px 32px;border-radius:0 0 8px 8px;font-family:sans-serif;max-width:600px;margin:auto;">
        <h2 style="color:#e53935;margin-top:0;">Session Request Submitted</h2>
        <p>Your request for <b>${requestDetails.sessionName}</b> with ${requestDetails.trainerName} has been submitted and is pending approval.</p>
        <ul style="padding-left:20px;text-align:left;">
          <li><b>Date:</b> ${requestDetails.preferredDate}</li>
          <li><b>Time:</b> ${requestDetails.preferredTime}</li>
          <li><b>Session Type:</b> ${requestDetails.sessionType}</li>
          <li><b>Pricing Plan:</b> ${requestDetails.pricingPlan}</li>
        </ul>
        <p>You will receive an email when your request is approved or rejected.</p>
      </div>
    `;

    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Add detailed logging for debugging
    console.log('SessionRequest API: Attempting to send email to trainer:', trainerEmail);
    try {
      await transporter.sendMail({
        to: trainerEmail,
        subject: '📩 New Session Request',
        html: trainerHtml,
      });
      console.log('SessionRequest API: Sent email to trainer:', trainerEmail);
    } catch (err) {
      console.error('SessionRequest API: Email error (trainer):', err);
    }

    console.log('SessionRequest API: Attempting to send email to member:', memberEmail);
    try {
      await transporter.sendMail({
        to: memberEmail,
        subject: '📩 Session Request Submitted',
        html: memberHtml,
      });
      console.log('SessionRequest API: Sent email to member:', memberEmail);
    } catch (err) {
      console.error('SessionRequest API: Email error (member):', err);
    }

    return new Response(JSON.stringify({ success: true, id: newRequest._id }), { status: 200 });
  } catch (error) {
    let message = 'Unknown error';
    if (error instanceof Error) message = error.message;
    else if (typeof error === 'object' && error && 'message' in error) message = (error as any).message;
    console.error('❌ Error in POST /api/session-request:', error);
    return new Response(JSON.stringify({ error: 'Internal server error', details: message }), { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  console.log('API: PUT /api/session-request called');
  const body = await req.json();
  const { id, action, memberEmail, trainerEmail, trainerName, sessionName, sessionType, preferredDate, startTime, endTime, pricingPlan, place, meetingLink, rejectionReason, description } = body;

  await connectToDatabase();
  const update: any = { status: action };
  if (action === 'approved') {
    if (sessionType === 'Physical') update.place = place;
    else update.meetingLink = meetingLink;
    update.startTime = startTime;
    update.endTime = endTime;
    update.description = description;
  } else if (action === 'rejected' || action === 'cancelled') {
    update.rejectionReason = rejectionReason;
  }
  await SessionRequest.updateOne({ _id: id }, { $set: update });
  console.log('Updated request status:', id, action, update);

  let memberSubject = '';
  let memberHtml = '';
  let trainerSubject = '';
  let trainerHtml = '';

  if (action === 'approved') {
    memberSubject = '✅ Session Request Approved';
    memberHtml = `
      <div style="background:#e53935;padding:24px 0 0 0;text-align:center;border-radius:8px 8px 0 0;">
        <h1 style="color:#fff;margin:0;font-size:2rem;font-family:sans-serif;">FitSync Pro</h1>
      </div>
      <div style="background:#fff;padding:32px 32px 24px 32px;border-radius:0 0 8px 8px;font-family:sans-serif;max-width:600px;margin:auto;">
        <h2 style="color:#e53935;margin-top:0;">Your Session Request Was Approved!</h2>
        <p>Your request for <b>${sessionName}</b> with ${trainerName} has been approved.</p>
        <ul style="padding-left:20px;text-align:left;">
          <li><b>Date:</b> ${preferredDate}</li>
          <li><b>Start Time:</b> ${startTime || ''}</li>
          <li><b>End Time:</b> ${endTime || ''}</li>
          <li><b>Session Type:</b> ${sessionType}</li>
          <li><b>Pricing Plan:</b> ${pricingPlan}</li>
          ${sessionType === 'Physical' ? `<li><b>Place:</b> ${place}</li>` : `<li><b>Meeting Link:</b><br><a href="${meetingLink}" style="color:#e53935;text-decoration:none;display:inline-block;margin-top:8px;"><button style='background:#e53935;color:#fff;padding:10px 28px;border-radius:5px;border:none;font-weight:bold;font-size:1rem;'>Join Meeting</button></a></li>`}
          ${description ? `<li><b>Description:</b> ${description}</li>` : ''}
        </ul>
      </div>
    `;
    trainerSubject = '✅ Session Request Approved (Confirmation)';
    trainerHtml = `
      <div style="background:#e53935;padding:24px 0 0 0;text-align:center;border-radius:8px 8px 0 0;">
        <h1 style="color:#fff;margin:0;font-size:2rem;font-family:sans-serif;">FitSync Pro</h1>
      </div>
      <div style="background:#fff;padding:32px 32px 24px 32px;border-radius:0 0 8px 8px;font-family:sans-serif;max-width:600px;margin:auto;">
        <h2 style="color:#e53935;margin-top:0;">You Approved a Session Request</h2>
        <p>You have approved the request for <b>${sessionName}</b> with your member.</p>
        <ul style="padding-left:20px;text-align:left;">
          <li><b>Date:</b> ${preferredDate}</li>
          <li><b>Start Time:</b> ${startTime || ''}</li>
          <li><b>End Time:</b> ${endTime || ''}</li>
          <li><b>Session Type:</b> ${sessionType}</li>
          <li><b>Pricing Plan:</b> ${pricingPlan}</li>
          ${sessionType === 'Physical' ? `<li><b>Place:</b> ${place}</li>` : `<li><b>Meeting Link:</b><br><a href="${meetingLink}" style="color:#e53935;text-decoration:none;display:inline-block;margin-top:8px;"><button style='background:#e53935;color:#fff;padding:10px 28px;border-radius:5px;border:none;font-weight:bold;font-size:1rem;'>Join Meeting</button></a></li>`}
          ${description ? `<li><b>Description:</b> ${description}</li>` : ''}
        </ul>
      </div>
    `;
  } else {
    memberSubject = '❌ Session Request Rejected';
    memberHtml = `
      <div style="background:#e53935;padding:24px 0 0 0;text-align:center;border-radius:8px 8px 0 0;">
        <h1 style="color:#fff;margin:0;font-size:2rem;font-family:sans-serif;">FitSync Pro</h1>
      </div>
      <div style="background:#fff;padding:32px 32px 24px 32px;border-radius:0 0 8px 8px;font-family:sans-serif;max-width:600px;margin:auto;">
        <h2 style="color:#e53935;margin-top:0;">Your Session Request Was Rejected</h2>
        <p>Unfortunately, your request for <b>${sessionName}</b> with ${trainerName} was rejected.</p>
        <p><b>Reason:</b> ${rejectionReason || 'No reason provided.'}</p>
        <p>You may contact the trainer for more information or submit a new request.</p>
      </div>
    `;
    trainerSubject = '❌ Session Request Rejected (Confirmation)';
    trainerHtml = `
      <div style="background:#e53935;padding:24px 0 0 0;text-align:center;border-radius:8px 8px 0 0;">
        <h1 style="color:#fff;margin:0;font-size:2rem;font-family:sans-serif;">FitSync Pro</h1>
      </div>
      <div style="background:#fff;padding:32px 32px 24px 32px;border-radius:0 0 8px 8px;font-family:sans-serif;max-width:600px;margin:auto;">
        <h2 style="color:#e53935;margin-top:0;">You Rejected a Session Request</h2>
        <p>You have rejected the request for <b>${sessionName}</b> with your member.</p>
        <p><b>Reason:</b> ${rejectionReason || 'No reason provided.'}</p>
      </div>
    `;
  }

  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Send to member
  try {
    await transporter.sendMail({
      to: memberEmail,
      subject: memberSubject,
      html: memberHtml,
    });
    console.log('Sent email to member:', memberEmail);
  } catch (err) {
    console.error('Email error (member):', err);
  }
  // Send to trainer
  if (trainerEmail) {
    try {
      await transporter.sendMail({
        to: trainerEmail,
        subject: trainerSubject,
        html: trainerHtml,
      });
      console.log('Sent email to trainer:', trainerEmail);
    } catch (err) {
      console.error('Email error (trainer):', err);
    }
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
} 