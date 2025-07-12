import { NextResponse } from "next/server";
import {connectToDatabase} from "../../../lib/mongodb";
import Review from "../../../models/Review.js";
export async function POST(req) {
  try {
    const { trainer, sessionType, date, comments, rating } = await req.json();
  
   
    if (!trainer || !sessionType || !date || !comments || !rating) {
      return NextResponse.json({ message: "All fields are required." }, { status: 400 });
    }

    // Connect to MongoDB
    await connectToDatabase();

    // Create new review using Mongoose model
    const newReview = new Review({
      trainer,
      sessionType,
      date,
      comments,
      rating,
      createdAt: new Date(),
    });

    await newReview.save();//Stores in MongoDB

    return NextResponse.json({ message: "Review submitted successfully!" }, { status: 200 });
  } catch (error) {
    console.error("Error submitting review:", error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}