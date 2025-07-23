import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "../../../../lib/mongodb"
import Session from "@/models/Session"
import SessionParticipant from "@/models/SessionParticipant"
import { sendEmail } from "@/lib/sendEmail"
import dedent from "dedent"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase()
    const { id } = params
    const { reason, cancelledBy } = await request.json()

    if (!cancelledBy) {
      return NextResponse.json({ error: "Cancelled by information required" }, { status: 400 })
    }

    // Find the session
    const session = await Session.findById(id)
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    // Check if session is in the past
    if (new Date() > session.start) {
      return NextResponse.json({ error: "Cannot cancel past sessions" }, { status: 400 })
    }

    // Get all approved participants
    const approvedParticipants = await SessionParticipant.find({
      sessionId: id,
      status: "approved",
    })

    console.log(`📧 Sending cancellation notifications to ${approvedParticipants.length} participants`)

    // Send cancellation emails to all approved participants
    let emailsSent = 0
    let emailErrors = 0
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
              ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
              <p>Cancelled by: ${cancelledBy}</p>
              <p>Please check our schedule for alternative sessions or contact the trainer for rescheduling options.</p>
              <br/>
              <p>Thank you for your understanding,<br/>FitSync Pro Team</p>
            `,
          })
          emailsSent++
          console.log(`✅ Cancellation email sent to ${participant.userEmail}`)
        } catch (emailError) {
          emailErrors++
          console.error(`❌ Failed to send cancellation email to ${participant.userEmail}:`, emailError)
        }
      }
    }

    // Update all participants to cancelled status
    await SessionParticipant.updateMany(
      { sessionId: id },
      {
        status: "cancelled",
        cancelledAt: new Date(),
        cancellationReason: reason || "No reason provided",
      },
    )

    // Mark session as cancelled
    const updatedSession = await Session.findByIdAndUpdate(
      id,
      {
        status: "cancelled",
        canceled: true,
        cancelledAt: new Date(),
        cancelledBy: cancelledBy,
        cancellationReason: reason || "No reason provided",
      },
      { new: true },
    )

    console.log(`✅ Session cancelled successfully. ${emailsSent} emails sent, ${emailErrors} failed`)
    return NextResponse.json(
      {
        message: "Session cancelled successfully",
        summary: {
          participantsNotified: emailsSent,
          emailErrors: emailErrors,
          totalParticipants: approvedParticipants.length,
        },
        updatedSession, // Return the updated session for client-side state update
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error cancelling session:", error)
    return NextResponse.json({ error: "Failed to cancel session" }, { status: 500 })
  }
}
