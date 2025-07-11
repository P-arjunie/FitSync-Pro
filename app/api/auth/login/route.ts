import { NextResponse } from "next/server"; // Import Next.js Response helper
import { connectToDatabase } from "@/lib/mongodb"; // Import MongoDB connection utility
import User from "@/models/User"; // Import User model
import bcrypt from "bcryptjs"; // Import bcryptjs for password hashing and comparison

// Define the POST handler function for login
export async function POST(req: Request) {
  try {
    // Extract email and password from the request body
    const { email, password } = await req.json();

    // Basic input validation: ensure both fields are provided
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    // Establish a connection to the MongoDB database
    await connectToDatabase();

    // Look up the user by email in the database
    const user = await User.findOne({ email });
    if (!user) {
      // If user is not found, return an unauthorized error
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // ❗️Block login if account is suspended
    if (user.status === "suspended") {
      return NextResponse.json(
        { error: "Your account is suspended. Please contact the admin." },
        { status: 403 }
      );
    }

    // Compare the provided password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // If password doesn't match, return an unauthorized error
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // If login is successful, return user details (excluding password)
    return NextResponse.json(
      {
        message: "Login successful",
        user: {
          id: user._id,
          name: user.name,
          role: user.role,
          email: user.email,
          image: user.image, // Profile image URL
        },
      },
      { status: 200 }
    );
  } catch (error) {
    // Handle unexpected errors and return server error response
    console.error("Login Error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}
