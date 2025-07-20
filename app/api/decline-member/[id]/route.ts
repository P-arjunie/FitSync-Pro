import { NextRequest, NextResponse } from "next/server"; // Import Next.js types for request and response
import { connectToDatabase } from "@/lib/mongodb"; // ✅ Import database connection utility

import PendingMember from "@/models/pendingMember"; // Import the PendingMember model (MongoDB schema)

// Define the DELETE function to handle member rejection by ID
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Establish a connection to MongoDB
    await connectToDatabase();

    // Await the params to get the ID
    const { id } = await params;

    // Delete the pending member with the given ID from the database
    await PendingMember.findByIdAndDelete(id);

    // Respond with a success message
    return NextResponse.json({ message: "Member declined and deleted" });
  } catch (error) {
    // Respond with an error if something goes wrong
    return NextResponse.json({ message: "Error declining member", error }, { status: 500 });
  }
}
