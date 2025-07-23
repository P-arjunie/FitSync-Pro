/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// app/api/sessions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from "../../lib/mongodb";
import Session from '@/models/Session';
import VirtualSession from '@/models/VirtualSession';
import Member from '@/models/member';
import ApprovedTrainer from '@/models/ApprovedTrainer';
import { sendEmail } from '@/lib/sendEmail';
import dedent from 'dedent';
// import bcrypt from 'bcrypt';
import bcrypt from 'bcryptjs';
import SessionParticipant from '@/models/SessionParticipant';


// Cache to store sessions with timestamp
let sessionsCache: {
  data: any[];
  timestamp: number;
} | null = null;

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 300000;

export async function GET(request: NextRequest) {
  try {
    // Check if we have a valid cache
    const now = Date.now();
    // Only use cache if not filtering by joinedUserId
    const { searchParams } = new URL(request.url);
    const joinedUserId = searchParams.get("joinedUserId");
    if (!joinedUserId && sessionsCache && (now - sessionsCache.timestamp < CACHE_TTL)) {
      // Set cache control headers
      const headers = new Headers();
      headers.set('Cache-Control', 'public, max-age=300'); // 5 minutes
      headers.set('X-Data-Source', 'cache');
      return NextResponse.json(sessionsCache.data, { 
        status: 200,
        headers
      });
    }
    // Cache miss or expired, fetch from database
    await connectToDatabase();
    // --- ADDED: filter by trainerId or joinedUserId if present ---
    const trainerId = searchParams.get("trainerId");
    const publicOnly = searchParams.get("public") === "true";
    let sessions = [];
    let query: any = undefined;
    if (joinedUserId) {
      // Find all sessionIds the user has joined (status approved or pending)
      const joined = await SessionParticipant.find({ userId: joinedUserId, status: { $in: ["approved", "pending"] } });
      const sessionIds = joined.map((p: any) => p.sessionId);
      sessions = await Session.find({ _id: { $in: sessionIds } }).sort({ start: 1 });
    } else {
      query = {};
      if (trainerId) {
        query.trainerId = trainerId;
      }
      if (!searchParams.get("includeCanceled")) {
        query.canceled = { $ne: true };
      }
      sessions = await Session.find(query).sort({ start: 1 });
      // Update cache only if not filtering by joinedUserId
      sessionsCache = {
        data: sessions,
        timestamp: now
      };
    }
    
    if (query) {
      console.log("API: Final query:", query);
      console.log("API: Found physical sessions count:", sessions.length);
    }
    // Fetch physical sessions
    const physicalSessions = await Session.find(query).sort({ start: 1 });
    console.log("API: Found physical sessions count:", physicalSessions.length);
    
    // Fetch virtual sessions
    const virtualSessionsQuery: any = {};
    if (trainerId) {
      // For virtual sessions, we need to match by trainer name
      const ApprovedTrainer = (await import('@/models/ApprovedTrainer')).default;
      let approvedTrainer = await ApprovedTrainer.findById(trainerId);
      if (approvedTrainer) {
        const fullName = `${approvedTrainer.firstName} ${approvedTrainer.lastName}`;
        virtualSessionsQuery['trainer.name'] = fullName;
      }
    }
    
    const virtualSessions = await VirtualSession.find(virtualSessionsQuery).sort({ date: 1 });
    console.log("API: Found virtual sessions count:", virtualSessions.length);
    
    // Transform virtual sessions to match physical session format
    const transformedVirtualSessions = virtualSessions.map(vs => ({
      _id: vs._id,
      title: vs.title,
      trainerName: vs.trainer?.name || "Unknown Trainer",
      trainerId: null, // Virtual sessions don't have trainerId
      start: new Date(`${vs.date.toISOString().split('T')[0]}T${vs.startTime}`),
      end: new Date(`${vs.date.toISOString().split('T')[0]}T${vs.endTime}`),
      location: 'Virtual Session',
      maxParticipants: vs.maxParticipants,
      description: vs.description,
      currentParticipants: vs.participants?.length || 0,
      onlineLink: vs.onlineLink,
      sessionType: 'virtual'
    }));
    
    // Transform physical sessions to include sessionType
    const transformedPhysicalSessions = physicalSessions.map(ps => ({
      ...ps.toObject(),
      status: ps.status,
      sessionType: 'physical'
    }));
    
    // Combine both session types
    const allSessions = [...transformedPhysicalSessions, ...transformedVirtualSessions];
    
    console.log("API: Total sessions count:", allSessions.length);
    console.log("API: Sessions:", allSessions.map(s => ({ 
      id: s._id, 
      title: s.title, 
      trainerName: s.trainerName, 
      sessionType: s.sessionType 
    })));
    
    // Update cache
    sessionsCache = {
      data: allSessions,
      timestamp: now
    };
    
    // Set cache control headers
    const headers = new Headers();
    headers.set('Cache-Control', 'public, max-age=300'); // 5 minutes
    headers.set('X-Data-Source', 'database');
    
    return NextResponse.json(allSessions, { 
      status: 200,
      headers
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

// Rest of your POST method remains the same...
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Received body in POST /api/sessions:", body); // <-- Add this line
    
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

    await connectToDatabase();

    // If trainerId is provided, verify it's from ApprovedTrainer model
    let verifiedTrainerId = body.trainerId;
    if (body.trainerId) {
      const ApprovedTrainer = (await import('@/models/ApprovedTrainer')).default;
      const approvedTrainer = await ApprovedTrainer.findById(body.trainerId);
      
      if (approvedTrainer) {
        console.log("Session creation: Using ApprovedTrainer ID:", body.trainerId);
        verifiedTrainerId = body.trainerId;
      } else {
        console.log("Session creation: Trainer not found in ApprovedTrainer, using provided ID");
      }
    }

    // Check for scheduling conflicts for the same trainer
    const conflictingSession = await Session.findOne({
      trainerName: body.trainerName,
      $or: [
        // New session starts during an existing session
        {
          start: { $lte: startTime },
          end: { $gt: startTime }
        },
        // New session ends during an existing session
        {
          start: { $lt: endTime },
          end: { $gte: endTime }
        },
        // New session completely contains an existing session
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

    // Create the new session with verified trainer ID
    const session = await Session.create({
      ...body,
      trainerId: verifiedTrainerId,
      maxParticipants: Number(body.maxParticipants),
    });
    
    console.log("Session created successfully:", {
      id: session._id,
      title: session.title,
      trainerId: session.trainerId,
      trainerName: session.trainerName
    });

    // Send email to trainer
    try {
      const sendTrainerEmail = process.env.SEND_TRAINER_EMAILS !== 'false'; // Default to true
      
      if (sendTrainerEmail) {
        const trainer = await ApprovedTrainer.findById(verifiedTrainerId);
        if (trainer && trainer.email) {
          await sendEmail({
            to: trainer.email,
            subject: `📅 New Physical Session Created: ${body.title}`,
            text: `Trainer "${body.trainerName}" scheduled a physical session on ${new Date(body.start).toLocaleDateString()} from ${new Date(body.start).toLocaleTimeString()} to ${new Date(body.end).toLocaleTimeString()}.`,
            html: dedent`
              <p>Trainer <strong>${body.trainerName}</strong> has scheduled a new physical session.</p>
              <p><strong>Date:</strong> ${new Date(body.start).toLocaleDateString()}<br/>
              <strong>Time:</strong> ${new Date(body.start).toLocaleTimeString()} - ${new Date(body.end).toLocaleTimeString()}<br/>
              <strong>Location:</strong> ${body.location}<br/>
              <strong>Max Participants:</strong> ${body.maxParticipants}</p>
              <p>Thanks,<br/>FitSync Pro</p>
            `
          });
          console.log("✅ Trainer email sent successfully!");
        }
      } else {
        console.log("📧 Trainer email notifications are disabled");
      }
    } catch (trainerEmailError) {
      console.error("❌ Failed to send trainer email:", trainerEmailError);
    }

    // Send emails to all approved members
    try {
      // Check if email notifications are enabled (you can make this configurable)
      const sendMemberEmails = process.env.SEND_SESSION_EMAILS !== 'false'; // Default to true
      
      if (sendMemberEmails) {
        // Build query for approved members
        const memberQuery: any = { 
          status: "approved",
          email: { $exists: true, $ne: "" }
        };

        // Optional: Filter by membership plan if specified in session
        if (body.targetMembershipPlan) {
          memberQuery['membershipInfo.plan'] = body.targetMembershipPlan;
        }

        // Optional: Filter by specific member IDs if provided
        if (body.targetMemberIds && Array.isArray(body.targetMemberIds) && body.targetMemberIds.length > 0) {
          memberQuery._id = { $in: body.targetMemberIds };
        }

        const approvedMembers = await Member.find(memberQuery);

        console.log(`📧 Sending emails to ${approvedMembers.length} approved members...`);
        
        let successCount = 0;
        let errorCount = 0;
        
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
              // Add a small delay to prevent overwhelming the email service
              if (successCount > 0 && successCount % 10 === 0) {
                await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay every 10 emails
              }

              await sendEmail({
                to: member.email,
                subject: `📅 New Physical Session Available: ${body.title}`,
                text: `Hi ${member.firstName || 'Member'},\n\nA new physical session "${body.title}" has been scheduled on ${new Date(body.start).toLocaleDateString()} from ${new Date(body.start).toLocaleTimeString()} to ${new Date(body.end).toLocaleTimeString()} at ${body.location}.`,
                html: dedent`
                  <p>Hi ${member.firstName || 'Member'},</p>
                  <p>A new physical session <strong>${body.title}</strong> has been scheduled!</p>
                  <p><strong>Date:</strong> ${new Date(body.start).toLocaleDateString()}<br/>
                  <strong>Time:</strong> ${new Date(body.start).toLocaleTimeString()} - ${new Date(body.end).toLocaleTimeString()}<br/>
                  <strong>Location:</strong> ${body.location}<br/>
                  <strong>Trainer:</strong> ${body.trainerName}<br/>
                  <strong>Max Participants:</strong> ${body.maxParticipants}</p>
                  <p>Log in to your FitSync Pro account to join this session!</p>
                  <br/>
                  <p>Thank you,<br/>FitSync Pro Team</p>
                `
              });
              successCount++;
              console.log(`✅ Email sent to member: ${member.email}`);
            } catch (memberEmailError) {
              errorCount++;
              console.error(`❌ Failed to send email to member ${member.email}:`, memberEmailError);
            }
          }
        }
        console.log(`✅ Email summary: ${successCount} sent successfully, ${errorCount} failed`);
      } else {
        console.log("📧 Member email notifications are disabled");
      }
    } catch (membersEmailError) {
      console.error("❌ Failed to send member emails:", membersEmailError);
    }
    
    // Invalidate the cache after creating a new session
    sessionsCache = null;
    
    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}