import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from "../../../../lib/mongodb";
import Session from "@/models/Session";
import SessionParticipant from "@/models/SessionParticipant";
import Member from "@/models/member";
import { sendEmail } from '@/lib/sendEmail';
import dedent from 'dedent';
import VirtualSession from "@/models/VirtualSession";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    
    // Get user info from request (you'll need to pass this from frontend)
    const { userId, userName } = await request.json();
    
    if (!userId || !userName) {
      return NextResponse.json({ error: "User information required" }, { status: 400 });
    }

    // Get user email from member database
    let userEmail = "";
    try {
      const member = await Member.findById(userId);
      if (member && member.email) {
        userEmail = member.email;
      }
    } catch (error) {
      console.log("Could not fetch member email:", error);
    }

    // Check if session exists and is not full
    let session = await Session.findById(id);
    let isVirtual = false;
    if (!session) {
      session = await VirtualSession.findById(id);
      isVirtual = true;
    }
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Count current participants using SessionParticipant collection
    const approvedCount = await SessionParticipant.countDocuments({
      sessionId: id,
      status: 'approved'
    });
    if (approvedCount >= session.maxParticipants) {
      return NextResponse.json({ error: "Session is full" }, { status: 409 });
    }

    // Check if user already joined
    const existingParticipant = await SessionParticipant.findOne({
      sessionId: id,
      userId: userId
    });

    if (existingParticipant) {
      return NextResponse.json({ error: "Already joined this session" }, { status: 409 });
    }

    // Add participant with pending status
    const newParticipant = await SessionParticipant.create({
      sessionId: id,
      userId: userId,
      userName: userName,
      userEmail: userEmail,
      status: 'pending'
    });

    // Send notification email to trainer about new booking request
    try {
      let trainerName = session.trainerName;
      let trainerId = session.trainerId;
      if (isVirtual) {
        trainerName = session.trainer?.name || "Unknown Trainer";
        trainerId = null; // Update if VirtualSession has a trainerId field
      }
      if (trainerName) {
        // Get trainer email from ApprovedTrainer model
        const ApprovedTrainer = (await import('@/models/ApprovedTrainer')).default;
        let approvedTrainer = null;
        if (trainerId) {
          approvedTrainer = await ApprovedTrainer.findById(trainerId);
        }
        if (approvedTrainer && approvedTrainer.email) {
          await sendEmail({
            to: approvedTrainer.email,
            subject: `📋 New Booking Request: ${session.title}`,
            text: `Member ${userName} has requested to join your session "${session.title}" on ${new Date(session.start).toLocaleDateString()}. Please approve or reject this request.`,
            html: dedent`
              <p>Hi ${trainerName},</p>
              <p>Member <strong>${userName}</strong> has requested to join your session <strong>${session.title}</strong>.</p>
              <p><strong>Session Details:</strong><br/>
              <strong>Date:</strong> ${new Date(session.start).toLocaleDateString()}<br/>
              <strong>Time:</strong> ${new Date(session.start).toLocaleTimeString()} - ${new Date(session.end).toLocaleTimeString()}<br/>
              <strong>Location:</strong> ${session.location}</p>
              <p>Please log in to your dashboard to approve or reject this booking request.</p>
              <br/>
              <p>Thank you,<br/>FitSync Pro Team</p>
            `
          });
          console.log("✅ Trainer notification email sent for booking request");
        }
      }
    } catch (emailError) {
      console.error("❌ Failed to send trainer notification email:", emailError);
    }

    // Send confirmation email to member
    if (userEmail) {
      try {
        let dateStr = isVirtual ? (session.date ? new Date(session.date).toLocaleDateString() : "-") : (session.start ? new Date(session.start).toLocaleDateString() : "-");
        let timeStr = isVirtual ? `${session.startTime} - ${session.endTime}` : (session.start && session.end ? `${new Date(session.start).toLocaleTimeString()} - ${new Date(session.end).toLocaleTimeString()}` : "-");
        let locationStr = isVirtual ? (session.onlineLink ? `Virtual (Join link: <a href='${session.onlineLink}' target='_blank'>${session.onlineLink}</a>)` : "Virtual Session") : (session.location || "-");
        await sendEmail({
          to: userEmail,
          subject: `📋 Booking Request Submitted: ${session.title}`,
          text: `Your booking request for "${session.title}" has been submitted and is pending trainer approval.`,
          html: dedent`
            <p>Hi ${userName},</p>
            <p>Your booking request for <strong>${session.title}</strong> has been submitted successfully!</p>
            <p><strong>Session Details:</strong><br/>
            <strong>Date:</strong> ${dateStr}<br/>
            <strong>Time:</strong> ${timeStr}<br/>
            <strong>Location:</strong> ${locationStr}<br/>
            <strong>Trainer:</strong> ${isVirtual ? (session.trainer?.name || "Unknown Trainer") : session.trainerName}</p>
            <p>Your request is now pending trainer approval. You will receive an email notification once the trainer responds.</p>
            <br/>
            <p>Thank you,<br/>FitSync Pro Team</p>
          `
        });
        console.log("✅ Member confirmation email sent for booking request");
      } catch (memberEmailError) {
        console.error("❌ Failed to send member confirmation email:", memberEmailError);
      }
    }

    return NextResponse.json({ 
      message: "Booking request submitted successfully. Awaiting trainer approval.",
      status: "pending"
    }, { status: 200 });
  } catch (error) {
    console.error("Error joining session:", error);
    return NextResponse.json({ error: "Failed to join session" }, { status: 500 });
  }
}
