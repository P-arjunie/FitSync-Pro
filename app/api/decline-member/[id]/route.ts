import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb"; // ✅ Correct for named export

import PendingMember from "@/models/pendingMember";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();

    await PendingMember.findByIdAndDelete(params.id);
    return NextResponse.json({ message: "Member declined and deleted" });
  } catch (error) {
    return NextResponse.json({ message: "Error declining member", error }, { status: 500 });
  }
}
