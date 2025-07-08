import { NextRequest, NextResponse } from "next/server"; // Imports types from Next.js for handling requests and responses
import { connectToDatabase } from "@/lib/mongodb"; // Imports the function to connect to MongoDB
import Member from "@/models/member"; // Imports the Mongoose model for the 'Member' collection

// Defines an asynchronous GET handler to fetch a member's data by email
export async function GET(req: NextRequest) {
  try {
    // Establish a connection to the MongoDB database
    await connectToDatabase();

    // Retrieve the 'email' parameter from the request's query string
    const email = req.nextUrl.searchParams.get("email");

    // If the email is not provided, respond with a 400 Bad Request
    if (!email) {
      return NextResponse.json({ success: false, message: "Email is required" }, { status: 400 });
    }

    // Search the 'Member' collection for a document matching the given email
    const member = await Member.findOne({ email });

    // If no member is found with that email, respond with a 404 Not Found
    if (!member) {
      return NextResponse.json({ success: false, message: "Member not found" }, { status: 404 });
    }

    // If a member is found, respond with the member data and a 200 OK status
    return NextResponse.json({ success: true, data: member }, { status: 200 });
  } catch (error) {
    // Log any errors and respond with a 500 Internal Server Error
    console.error("Error fetching member by email:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

