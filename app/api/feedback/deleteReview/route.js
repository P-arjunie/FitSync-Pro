import { NextResponse } from "next/server";
import connectMongoDB from "@/lib/mongodb";
import Review from "@/models/Review";

export async function DELETE(request) {
  try {
    // Connect to MongoDB
    await connectMongoDB();
    
    // Get the review ID from the query parameters
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    
    if (!id) {
      return NextResponse.json(
        { message: "Review ID is required" }, 
        { status: 400 }
      );
    }
    
    // Delete the review
    const result = await Review.findByIdAndDelete(id);
    
    if (!result) {
      return NextResponse.json(
        { message: "Review not found" }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { message: "Review deleted successfully" }, 
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting review:", error);
    return NextResponse.json(
      { message: "Failed to delete review" }, 
      { status: 500 }
    );
  }
}