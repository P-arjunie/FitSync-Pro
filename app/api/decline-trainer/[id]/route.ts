import { NextResponse } from "next/server"; // Import Next.js response utility
import { connectToDatabase } from "@/lib/mongodb"; // ✅ Import database connection utility
import Trainer from "@/models/Trainer"; // Import the Trainer model (pending trainers)

// Define the DELETE route handler for declining a trainer by ID
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  // Establish a connection to MongoDB
  await connectToDatabase();

  // Delete the trainer document with the provided ID from the Trainer (pending) collection
  await Trainer.findByIdAndDelete(params.id);

  // Return a success message after deletion
  return NextResponse.json({ message: "Trainer declined" });
}
