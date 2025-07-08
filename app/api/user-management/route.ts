import { NextResponse } from "next/server";
import { connectToDatabase } from "../../lib/mongodb"; // ✅ Correct for named export

import Trainer from "@/models/Trainer";

export async function GET() {
  // Connect to the MongoDB database
  await connectToDatabase();

  // Fetch all trainer documents from the Trainer (pending trainers) collection
  const trainers = await Trainer.find();

  // Return the list of trainers as a JSON response
  return NextResponse.json(trainers);
}
