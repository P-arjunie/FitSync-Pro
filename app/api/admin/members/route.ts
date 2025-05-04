// app/api/admin/members/route.ts
import { connectToDatabase } from "@/lib/mongodb";
import Member from "@/models/member";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectToDatabase();

    const members = await Member.find({ status: "pending" });
    return NextResponse.json(members);
  } catch (error) {
    console.error("Failed to fetch members:", error);
    return NextResponse.json({ error: "Failed to load members" }, { status: 500 });
  }
}
