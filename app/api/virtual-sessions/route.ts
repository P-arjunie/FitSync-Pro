import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import VirtualSession from "@/models/VirtualSession";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const trainerEmail = searchParams.get("trainerEmail");

    if (!trainerEmail) {
      return NextResponse.json({ error: "Missing trainerEmail" }, { status: 400 });
    }

    // Query by trainer.email (assuming it's stored in the document)
    const sessions = await VirtualSession.find({
      "trainer.email": trainerEmail,
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Failed to fetch virtual sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch virtual sessions" },
      { status: 500 }
    );
  }
}
