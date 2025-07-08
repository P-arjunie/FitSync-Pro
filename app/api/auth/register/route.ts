import { NextResponse } from "next/server"; // Import helper for creating responses in Next.js API routes
import bcrypt from "bcryptjs"; // Import bcrypt for securely hashing passwords
import User from "@/models/User"; // Import the User model (MongoDB schema)
import { connectToDatabase } from "@/lib/mongodb"; // Import custom MongoDB connection utility

// Define POST method to handle user registration
export async function POST(req: Request) {
  try {
    console.log("📥 Incoming registration request...");

    // Establish a connection to the MongoDB database
    await connectToDatabase(); 
    console.log("✅ Connected to MongoDB");

    // Extract registration data from the incoming request body
    const { name, email, password, role, profileImage } = await req.json();

    // Check if a user with the provided email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // If found, respond with a 400 error indicating duplicate user
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    // Hash the user's password for security before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user instance using the submitted data and hashed password
    const newUser = new User({ name, email, password: hashedPassword, role, profileImage });

    // Save the new user to the database
    await newUser.save();

    // Respond with a success message
    return NextResponse.json({ message: "User registered successfully" }, { status: 201 });

  } catch (error) {
    // Log and return any errors encountered during the process
    console.error("❌ Error during registration:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
