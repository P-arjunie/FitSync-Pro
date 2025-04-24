import { NextRequest, NextResponse } from "next/server";
import connectMongoDB from "@/lib/mongodb";
import PendingMember from "@/models/pendingMember";
import Member from "@/models/member";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectMongoDB();

    const pending = await PendingMember.findById(params.id);
    if (!pending) {
      return NextResponse.json({ message: "Member not found" }, { status: 404 });
    }

    const approvedMember = new Member(pending.toObject());
    await approvedMember.save();

    await PendingMember.findByIdAndDelete(params.id);

    return NextResponse.json({ message: "Member approved" });
  } catch (error) {
    return NextResponse.json({ message: "Error approving member", error }, { status: 500 });
  }
}
