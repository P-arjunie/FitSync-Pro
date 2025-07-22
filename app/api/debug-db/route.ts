import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
export async function GET() {
  await mongoose.connect(process.env.MONGODB_URI!);
  if (!mongoose.connection.db) return NextResponse.json({ error: "No DB" }, { status: 500 });
  return NextResponse.json({ dbName: mongoose.connection.db.databaseName });
} 