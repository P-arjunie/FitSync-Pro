// lib/mongodb.ts
import { MongoClient } from "mongodb";

// Use non-null assertion to ensure MONGODB_URI is a string
const uri = process.env.MONGODB_URI!;  // Force TypeScript to treat it as a string

if (!uri) {
  throw new Error("MONGODB_URI is not defined in the environment variables.");
}

const dbName = "your-db-name"; // Replace with your actual database name

let cachedClient: MongoClient | null = null;
let cachedDb: any = null;

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(uri);  // MongoClient expects a string URI
  await client.connect();
  const db = client.db(dbName);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}
