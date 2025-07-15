import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

// A helper function to call the logging API without waiting for it to finish.
// It constructs the full URL to ensure it works in all environments (dev, prod).
const logAttempt = (data: object) => {
  const url = new URL("/api/analytics/log-login-attempt", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
  fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).catch(error => {
    // Log fetch errors, but don't let them crash the main application
    console.error("Fire-and-forget log failed:", error);
  });
};

export async function POST(req: Request) {
  const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("remote-addr");
  const userAgent = req.headers.get("user-agent");

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    await connectToDatabase();
    const user = await User.findOne({ email });

    // Handle invalid credentials
    if (!user || !(await bcrypt.compare(password, user.password))) {
      // "Fire-and-forget" the log for the failed attempt
      logAttempt({ email, status: "failure", reason: "invalid_credentials", ipAddress, userAgent });
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    // Handle suspended account
    if (user.status === "suspended") {
      // "Fire-and-forget" the log for the suspended attempt
      logAttempt({ userId: user._id, email, status: "failure", reason: "suspended_account", ipAddress, userAgent });
      return NextResponse.json({ error: "Your account is suspended." }, { status: 403 });
    }

    // Handle successful login
    // "Fire-and-forget" the log for the successful attempt
    logAttempt({ userId: user._id, email, status: "success", ipAddress, userAgent });

    // Return the successful response to the user immediately
    return NextResponse.json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        email: user.email,
        image: user.image,
      },
    }, { status: 200 });

  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}