import { NextRequest, NextResponse } from "next/server"; 
import { connectToDatabase } from "@/lib/mongodb"; 
import Member from "@/models/member"; 

// ✅ ✅ ✅ ADD THIS GET HANDLER (fetch all members)
export async function GET() {
  try {
    await connectToDatabase();
    const members = await Member.find({ status: "approved" }); // only approved members
    return NextResponse.json(members);
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json({ message: "Failed to fetch members" }, { status: 500 });
  }
}

// ✅ YOUR EXISTING PUT HANDLER BELOW — UNTOUCHED
export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    const email = req.nextUrl.searchParams.get("email");

    if (!email) {
      return NextResponse.json({ success: false, message: "Email is required" }, { status: 400 });
    }

    const memberData = await req.json();
    const updatedMember = await Member.findOneAndUpdate({ email }, memberData, { new: true });

    if (!updatedMember) {
      return NextResponse.json({ success: false, message: "Member not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedMember }, { status: 200 });
  } catch (error) {
    console.error("Error updating member profile:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
