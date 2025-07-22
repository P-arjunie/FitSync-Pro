import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  await mongoose.connect(process.env.MONGODB_URI!);
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "No userId" }, { status: 400 });
  let objectId;
  try {
    objectId = new mongoose.Types.ObjectId(userId);
  } catch {
    return NextResponse.json({ error: "Invalid ObjectId" }, { status: 400 });
  }
  if (!mongoose.connection.db) {
    return NextResponse.json({ error: "MongoDB connection is not established." }, { status: 500 });
  }
  const user = await mongoose.connection.db.collection("members").findOne({ _id: objectId });
  return NextResponse.json({ found: !!user, user });
} 