import { NextResponse } from "next/server";
import { connectToDatabase } from "../../../lib/mongodb";
import ApprovedTrainer from "@/models/ApprovedTrainer";

export async function GET() {
  try {
    await connectToDatabase();

    const trainers = await ApprovedTrainer.find({}, "firstName lastName");

    const names = trainers.map((trainer) => ({
      name: `${trainer.firstName} ${trainer.lastName}`,
    }));

    return NextResponse.json({ trainers: names }, { status: 200 });
  } catch (error) {
    console.error("Error fetching trainer names:", error);
    return NextResponse.json(
      { message: "Failed to load trainers." },
      { status: 500 }
    );
  }
}