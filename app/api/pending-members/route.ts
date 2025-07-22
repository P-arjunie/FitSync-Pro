import { NextResponse } from "next/server"; // Import Next.js server response utility
import { connectToDatabase } from "../../lib/mongodb"; // Import function to connect to MongoDB
import PendingMember from "@/models/pendingMember"; // Import Mongoose model for pending member registrations

// Handles GET requests to fetch all pending members
export async function GET() {
  try {
    // Connect to the MongoDB database
    await connectToDatabase();

    // Retrieve all pending members, selecting only specific fields for preview/list
    const pendingMembers = await PendingMember.find().select("firstName lastName image role membershipInfo");
    
    // Return the list of pending members as JSON
    return NextResponse.json(pendingMembers);
  } catch (error) {
    // Return an error response if something goes wrong
    return NextResponse.json(
      { message: "Error fetching pending members", error },
      { status: 500 }
    );
  }
}

// Handles POST requests to register a new pending member
export async function POST(req: Request) {
  try {
    // Parse the incoming request body as JSON
    const body = await req.json();
    
    // Destructure the required fields from the request body
    const {
      userId,
      firstName,
      lastName,
      email,
      nic,
      gender,
      dob,
      contactNumber,
      address,
      emergencyContact,
      membershipPlan,
      profileImage,
      currentWeight,
      height,
      bmi,
      goalWeight,
    } = body;
    
    // Connect to the MongoDB database
    await connectToDatabase();

    // Create a new pending member document using the extracted data
    const newPendingMember = new PendingMember({
      userId,
      firstName,
      lastName,
      email,
      nic,
      gender,
      dob,
      contactNumber,
      address,
      emergencyContact,
      membershipPlan,
      image: profileImage, // Assign profile image to the `image` field
      status: "pending", // Set status to pending for admin approval
      role: "member", // Set role as member
      createdAt: new Date(), // Set creation date
      currentWeight,
      height,
      bmi,
      goalWeight,
    });

    // Save the pending member document to the database
    await newPendingMember.save();

    // Return a success response with the inserted document ID
    return NextResponse.json({ success: true, insertedId: newPendingMember._id });
  } catch (error) {
    // Log the error and return a generic internal server error response
    console.error("Error registering member:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
