import { NextRequest, NextResponse } from "next/server"; // Import types from Next.js for request and response handling
import { connectToDatabase } from "@/lib/mongodb"; // Import MongoDB connection utility
import Member from "@/models/member"; // Import the Mongoose model for the 'Member' collection

// Defines an asynchronous PUT handler to update a member's profile using their email address
export async function PUT(req: NextRequest) {
  try {
    // Connect to the MongoDB database
    await connectToDatabase();

    // Retrieve the 'email' query parameter from the request URL
    const email = req.nextUrl.searchParams.get("email");

    // If no email is provided, return a 400 Bad Request response
    if (!email) {
      return NextResponse.json({ success: false, message: "Email is required" }, { status: 400 });
    }

    // Parse the JSON body from the request to get updated member data
    const memberData = await req.json();

    // Find the member by email and update their data with the provided info
    // The 'new: true' option ensures the updated document is returned
    const updatedMember = await Member.findOneAndUpdate({ email }, memberData, { new: true });

    // If no matching member is found, return a 404 Not Found response
    if (!updatedMember) {
      return NextResponse.json({ success: false, message: "Member not found" }, { status: 404 });
    }

    // Return the updated member data with a 200 OK response
    return NextResponse.json({ success: true, data: updatedMember }, { status: 200 });
  } catch (error) {
    // Log and return a 500 Internal Server Error response if something goes wrong
    console.error("Error updating member profile:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

