import { NextResponse } from "next/server";

export async function GET() {
  // Later, replace this with actual DB logic
  return NextResponse.json({
    userId: "test_user_123",
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    company: "FitSyncPro",
    street: "123 Main St",
    city: "Colombo",
    country: "Sri Lanka",
    zip: "10100"
  });
}
