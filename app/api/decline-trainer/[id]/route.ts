import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb"; // ✅ Correct for named export

import Trainer from "@/models/Trainer";

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await connectToDatabase();

  await Trainer.findByIdAndDelete(params.id);
  return NextResponse.json({ message: "Trainer declined" });
}
