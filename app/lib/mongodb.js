
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("❌ MONGODB_URI not defined in environment variables");
}

let isConnected = false;

export const connectToDatabase = async () => {
  if (isConnected) return;

  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: "fit-sync", 
    });

    isConnected = true;
    console.log("✅ MongoDB connected via Mongoose");
  } catch (error) {
    console.error("❌ Mongoose connection error:", error);
    throw error;
  }
};
