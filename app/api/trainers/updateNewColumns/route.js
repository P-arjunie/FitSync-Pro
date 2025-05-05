import { NextResponse } from "next/server";
import {connectToDatabase} from "../../../lib/mongodb";
import Trainer from "@/models/Trainer";

export async function PUT(req) {
  try {
    await connectToDatabase();
    const body = await req.json();
    console.log("Incoming PUT payload:", body); // <-- DEBUG

    const { _id, biography, skills, certifications } = body;

    const updatedTrainer = await Trainer.findByIdAndUpdate(
      _id,
      { biography, skills, certifications },
      { new: true }
    );

    if (!updatedTrainer) {
      return NextResponse.json({ message: "Trainer not found." }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Trainer updated successfully", trainer: updatedTrainer },
      { status: 200 }
    );
  } catch (error) {
    console.error("🔥 Update trainer error:", error); // <-- DEBUG
    return NextResponse.json({ message: "Failed to update trainer." }, { status: 500 });
  }
}
