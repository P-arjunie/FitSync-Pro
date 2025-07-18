import { NextResponse } from "next/server";
import {connectToDatabase} from "../../../lib/mongodb";
import Review from "../../../models/Review.js";

export async function POST(req) {
  try {
    // Destructure memberEmail from the request body along with other fields
    const { memberEmail, trainer, sessionType, date, comments, rating } = await req.json();
  
    // Add validation to ensure the member's email is present
    if (!memberEmail || !trainer || !sessionType || !date || !comments || !rating) {
      return NextResponse.json({ message: "All fields, including member authentication, are required." }, { status: 400 });
    }

    // Connect to MongoDB
    await connectToDatabase();

    // Create a new review, now including the memberEmail
    const newReview = new Review({
      memberEmail, // Associate the review with the member's email
      trainer,
      sessionType,
      date,
      comments,
      rating,
      createdAt: new Date(),
    });

    await newReview.save(); // Stores in MongoDB

    return NextResponse.json({ message: "Review submitted successfully!" }, { status: 200 });
  } catch (error) {
    console.error("Error submitting review:", error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}