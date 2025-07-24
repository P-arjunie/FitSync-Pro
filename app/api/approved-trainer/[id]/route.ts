import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import ApprovedTrainer from "@/models/ApprovedTrainer";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } // Make params Promise-based
) {
  await connectToDatabase();

  const { id } = await context.params; // ✅ Await the params

  const trainer = await ApprovedTrainer.findById(id);
  if (!trainer) {
    return NextResponse.json({ error: "Trainer not found" }, { status: 404 });
  }

  return NextResponse.json(trainer);
}
