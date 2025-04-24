import { NextResponse } from "next/server";
import connectMongoDB from "@/lib/mongodb";
import Trainer from "@/models/Trainer";

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await connectMongoDB();
  await Trainer.findByIdAndDelete(params.id);
  return NextResponse.json({ message: "Trainer declined" });
}
