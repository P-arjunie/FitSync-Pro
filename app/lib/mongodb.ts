import mongoose from "mongoose";
import type { Db } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) {
  throw new Error("❌ MONGODB_URI not defined in environment variables");
}

console.log("DEBUG MONGODB_URI:", process.env.MONGODB_URI);

let isConnected = false;

export const connectToDatabase = async (): Promise<{ db: Db }> => {
  if (isConnected) {
    console.log("✅ Already connected to DB");
    return { db: mongoose.connection.db as unknown as Db };
  }

  if (mongoose.connections[0].readyState !== 1) {
    console.log("Connecting to DB...");
    try {
      await mongoose.connect(MONGODB_URI, { dbName: "fit-sync" });
      isConnected = true;
      console.log("✅ Connected to DB", mongoose.connection.name);
      return { db: mongoose.connection.db as unknown as Db };
    } catch (error) {
      console.error("❌ Error connecting to DB:", error);
      throw new Error("Failed to connect to the database");
    }
  } else {
    isConnected = true;
    console.log("✅ Already connected (mongoose readyState 1)");
    return { db: mongoose.connection.db as unknown as Db };
  }
};

export const connectDB = connectToDatabase;

