import { NextResponse } from "next/server";
import { connectToDatabase } from "../../../lib/mongodb";
import Trainer from "@/models/Trainer";
import Review from "@/models/Review";

export async function GET(request, { params }) {
  try {
    console.log('API: Starting trainer fetch for ID:', params.id);
    
    await connectToDatabase();
    console.log('API: Database connected');
    
    const { id } = params;
    console.log('API: Looking for trainer with ID:', id);
    
    // Find the trainer by ID
    const trainer = await Trainer.findById(id);
    console.log('API: Trainer found:', trainer ? 'Yes' : 'No');
    
    if (!trainer) {
      console.log('API: Trainer not found in database');
      return NextResponse.json({ message: "Trainer not found" }, { status: 404 });
    }
    
    // Check if trainer is approved
    if (trainer.status !== "approved") {
      console.log('API: Trainer not approved, status:', trainer.status);
      return NextResponse.json({ message: "Trainer not available" }, { status: 403 });
    }
    
    // Get trainer's full name
    const fullName = `${trainer.firstName} ${trainer.lastName}`;
    console.log('API: Trainer full name:', fullName);
    
    // Fetch reviews for this trainer
    const reviews = await Review.find({ trainer: fullName });
    console.log('API: Reviews found:', reviews.length);
    
    // Calculate average rating
    const averageRating = reviews.length > 0 
      ? (reviews.reduce((acc, cur) => acc + cur.rating, 0) / reviews.length).toFixed(1)
      : "0.0";
    
    // Prepare trainer data
    const trainerData = {
      _id: trainer._id,
      name: fullName,
      email: trainer.email,
      phone: trainer.phone || "",
      location: trainer.location || "",
      specialization: trainer.specialization || "",
      experience: trainer.experience || "",
      bio: trainer.bio || "",
      rating: parseFloat(averageRating),
      sessionsCount: trainer.sessionsCount || 0,
      // Add any additional fields that might be needed
      certifications: trainer.certifications || [],
      skills: trainer.skills || [],
      preferredTrainingHours: trainer.preferredTrainingHours || ""
    };
    
    console.log('API: Returning trainer data:', trainerData);
    return NextResponse.json(trainerData, { status: 200 });
    
  } catch (error) {
    console.error("API error in getTrainerById:", error);
    return NextResponse.json({ message: "Failed to load trainer details." }, { status: 500 });
  }
} 