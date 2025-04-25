import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Member from "@/models/member";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const email = req.nextUrl.searchParams.get("email");
    if (!email) {
      return NextResponse.json({ success: false, message: "Email is required" }, { status: 400 });
    }

    const member = await Member.findOne({ email });

    if (!member) {
      return NextResponse.json({ success: false, message: "Member not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: member }, { status: 200 });
  } catch (error) {
    console.error("Error fetching member by email:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
