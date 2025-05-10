import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb"; // ✅ Correct for named export

import Trainer from "@/models/Trainer";

export async function GET() {
  await connectToDatabase();

  const trainers = await Trainer.find();
  return NextResponse.json(trainers);
}
