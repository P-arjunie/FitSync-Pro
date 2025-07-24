import { NextRequest, NextResponse } from "next/server"; // Import Next.js types for request and response
import { connectToDatabase } from "@/lib/mongodb"; // ✅ Import database connection utility

import PendingMember from "@/models/pendingMember"; // Import the PendingMember model (MongoDB schema)
import { sendEmail } from '@/lib/sendEmail';
import dedent from 'dedent';

// Define the DELETE function to handle member rejection by ID
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Establish a connection to MongoDB
    await connectToDatabase();

    // Await the params to get the ID
    const { id } = await params;

    // Fetch the member's email before deletion if needed
    const pending = await PendingMember.findById(id);
    const email = pending?.email;
    const firstName = pending?.firstName || '';

    // Delete the pending member with the given ID from the database
    await PendingMember.findByIdAndDelete(id);

    if (email) {
      try {
        await sendEmail({
          to: email,
          subject: '❌ Your FitSync Pro Membership Application',
          html: dedent`
            <div style="background:#e53935;padding:24px 0 0 0;text-align:center;border-radius:8px 8px 0 0;">
              <h1 style="color:#fff;margin:0;font-size:2rem;font-family:sans-serif;">FitSync Pro</h1>
            </div>
            <div style="background:#fff;padding:32px 32px 24px 32px;border-radius:0 0 8px 8px;font-family:sans-serif;max-width:600px;margin:auto;">
              <h2 style="color:#e53935;margin-top:0;">Membership Application Update</h2>
              <p>Dear ${firstName},</p>
              <p>We regret to inform you that your membership application was not approved at this time. You are welcome to reapply or contact us for more information.</p>
              <br/>
              <p>Thank you for your interest,<br/>FitSync Pro Team</p>
            </div>
          `
        });
      } catch (err) {
        console.error('Failed to send rejection email to member:', err);
      }
    }

    // Respond with a success message
    return NextResponse.json({ message: "Member declined and deleted" });
  } catch (error) {
    // Respond with an error if something goes wrong
    return NextResponse.json({ message: "Error declining member", error }, { status: 500 });
  }
}
