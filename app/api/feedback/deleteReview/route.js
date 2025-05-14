// app/api/feedback/deleteReview/route.js
import {connectToDatabase} from "../../../lib/mongodb";
import Review from '../../../models/Review';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { reviewId, _method } = body;
    
    // Check if this is a DELETE request via POST method
    if (_method !== 'DELETE') {
      return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
    }
    
    await connectToDatabase();
    
    if (!reviewId) {
      return NextResponse.json({ message: 'Review ID is required' }, { status: 400 });
    }
    
    // Check if the ID is valid (if using MongoDB)
    if (!/^[0-9a-fA-F]{24}$/.test(reviewId)) {
      return NextResponse.json({ message: 'Invalid review ID format' }, { status: 400 });
    }
    
    const deletedReview = await Review.findByIdAndDelete(reviewId);
    
    if (!deletedReview) {
      return NextResponse.json({ message: 'Review not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, message: 'Review deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message || 'Unknown error' 
    }, { status: 500 });
  }
}

// Optionally, you can also define a DELETE method handler
export async function DELETE(request) {
  // Extract reviewId from URL or request body
  const url = new URL(request.url);
  const reviewId = url.searchParams.get('reviewId');
  
  try {
    await connectToDatabase();
    
    if (!reviewId) {
      return NextResponse.json({ message: 'Review ID is required' }, { status: 400 });
    }
    
    // Check if the ID is valid (if using MongoDB)
    if (!/^[0-9a-fA-F]{24}$/.test(reviewId)) {
      return NextResponse.json({ message: 'Invalid review ID format' }, { status: 400 });
    }
    
    const deletedReview = await Review.findByIdAndDelete(reviewId);
    
    if (!deletedReview) {
      return NextResponse.json({ message: 'Review not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, message: 'Review deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message || 'Unknown error' 
    }, { status: 500 });
  }
}