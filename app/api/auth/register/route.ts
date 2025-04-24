import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import User from "@/models/User";
import connectMongoDB from "@/lib/mongodb";

export async function POST(req: Request) {
  try {
    await connectMongoDB();

    const { name, email, password, role, profileImage } = await req.json();

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user with profileImage
    const newUser = new User({ name, email, password: hashedPassword, role, profileImage });
    await newUser.save();

    return NextResponse.json({ message: "User registered successfully" }, { status: 201 });

  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

