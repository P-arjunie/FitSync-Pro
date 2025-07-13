import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Trainer from "@/models/Trainer";
import ApprovedTrainer from "@/models/ApprovedTrainer";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;

    // Find the pending trainer and explicitly include the password field
    const trainer = await Trainer.findById(id).select('+password');
    
    if (!trainer) {
      return NextResponse.json({ error: "Trainer not found" }, { status: 404 });
    }

    // Create the approved trainer with ALL fields including password
    await ApprovedTrainer.create({
      // Spread all fields from the original trainer
      ...trainer.toObject(),
      
      // Map nested emergencyContact to flat fields
      emergencyName: trainer.emergencyContact?.name,
      emergencyPhone: trainer.emergencyContact?.phone,
      relationship: trainer.emergencyContact?.relationship,
      
      // Ensure required fields for ApprovedTrainer schema
      role: "trainer",
      status: "approved",
      startDate: new Date()
    });

    // Delete the pending trainer
    await trainer.deleteOne();

    console.log(`✅ Trainer approved: ${trainer.email}`);
    return NextResponse.json({ message: "Trainer approved" });
  } catch (error) {
    console.error("❌ Error approving trainer:", error);
    return NextResponse.json({
      error: "Error approving trainer",
      details: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}