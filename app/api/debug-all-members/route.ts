import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET() {
  await mongoose.connect(process.env.MONGODB_URI!);
  if (!mongoose.connection.db) return NextResponse.json({ error: "No DB" }, { status: 500 });
  const members = await mongoose.connection.db.collection("members").find({}, { projection: { _id: 1, email: 1 } }).limit(10).toArray();
  return NextResponse.json({ members });
} 