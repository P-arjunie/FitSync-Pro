
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("❌ MONGODB_URI not defined in environment variables");
}

let isConnected = false;

export const connectToDatabase = async () => {
  if (mongoose.connections[0].readyState === 0) {
    console.log("Connecting to DB...");
    try {
      await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/fit-sync");
      console.log("Connected to DB");
    } catch (error) {
      console.error("Error connecting to DB:", error);
      throw new Error("Failed to connect to the database");
    }
  }
};

export const connectDB = async () => { ... }

