import { NextResponse } from "next/server";
import connectMongoDB from "@/lib/mongodb";
import PendingMember from "@/models/pendingMember";

export async function GET() {
  try {
    await connectMongoDB();
    const pendingMembers = await PendingMember.find();
    return NextResponse.json(pendingMembers);
  } catch (error) {
    return NextResponse.json(
      { message: "Error fetching pending members", error },
      { status: 500 }
    );
  }
}
