import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { Availability } from "../../models/availability"

export async function GET() {
  try {
    // Connect to the database
    await connectToDatabase()

    // Assuming we're getting the availability for the current user
    // In a real app, you'd get the user ID from the session
    const userId = "current-user-id" // Replace with actual user ID from auth

    // Find the availability document for this user
    const availability = await Availability.findOne({ userId })

    if (!availability) {
      return NextResponse.json(null, { status: 404 })
    }

    // Return just the schedule part of the document
    return NextResponse.json(availability.schedule)
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to fetch availability" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // Connect to the database
    await connectToDatabase()

    // Parse the request body
    const scheduleData = await request.json()

    // Assuming we're setting the availability for the current user
    // In a real app, you'd get the user ID from the session
    const userId = "current-user-id" // Replace with actual user ID from auth

    // Update or create the availability document
    await Availability.findOneAndUpdate(
      { userId },
      {
        userId,
        schedule: scheduleData,
        updatedAt: new Date(),
      },
      { upsert: true, new: true },
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to save availability" }, { status: 500 })
  }
}
