import { NextResponse } from "next/server";
import connectMongoDB from "@/lib/mongodb";
import Trainer from "@/models/Trainer";
import ApprovedTrainer from "@/models/ApprovedTrainer";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  await connectMongoDB();
  const trainer = await Trainer.findById(params.id);
  if (!trainer) return NextResponse.json({ error: "Trainer not found" }, { status: 404 });

  await ApprovedTrainer.create(trainer.toObject());
  await trainer.deleteOne();

  return NextResponse.json({ message: "Trainer approved" });
}
