import { NextResponse } from "next/server";
import connectMongoDB from "@/lib/mongodb";
import Trainer from "@/models/Trainer";

export async function GET() {
  await connectMongoDB();
  const trainers = await Trainer.find();
  return NextResponse.json(trainers);
}
