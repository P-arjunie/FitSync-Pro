import { NextResponse } from "next/server"; // Import Next.js response utility
import { connectToDatabase } from "@/lib/mongodb"; // ✅ Import database connection utility
import Trainer from "@/models/Trainer"; // Import the Trainer model (pending trainers)
import { sendEmail } from '@/lib/sendEmail';
import dedent from 'dedent';

// Define the DELETE route handler for declining a trainer by ID
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  // Establish a connection to MongoDB
  await connectToDatabase();

  // Await the params to get the ID
  const { id } = await params;

  // Fetch the trainer's email before deletion if needed
  const trainer = await Trainer.findById(id);
  const email = trainer?.email;
  const firstName = trainer?.firstName || '';

  // Delete the trainer document with the provided ID from the Trainer (pending) collection
  await Trainer.findByIdAndDelete(id);

  if (email) {
    try {
      await sendEmail({
        to: email,
        subject: '❌ Your FitSync Pro Trainer Application',
        html: dedent`
          <div style="background:#e53935;padding:24px 0 0 0;text-align:center;border-radius:8px 8px 0 0;">
            <h1 style="color:#fff;margin:0;font-size:2rem;font-family:sans-serif;">FitSync Pro</h1>
          </div>
          <div style="background:#fff;padding:32px 32px 24px 32px;border-radius:0 0 8px 8px;font-family:sans-serif;max-width:600px;margin:auto;">
            <h2 style="color:#e53935;margin-top:0;">Trainer Application Update</h2>
            <p>Dear ${firstName},</p>
            <p>We regret to inform you that your trainer application was not approved at this time. You are welcome to reapply or contact us for more information.</p>
            <br/>
            <p>Thank you for your interest,<br/>FitSync Pro Team</p>
          </div>
        `
      });
    } catch (err) {
      console.error('Failed to send rejection email to trainer:', err);
    }
  }

  // Return a success message after deletion
  return NextResponse.json({ message: "Trainer declined" });
}
