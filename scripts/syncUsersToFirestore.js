const { MongoClient } = require("mongodb");
const admin = require("firebase-admin");
const path = require("path");
require('dotenv').config();

// 1. Initialize Firebase Admin
const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const firestore = admin.firestore();

// 2. Connect to MongoDB
const MONGO_URI = "mongodb+srv://fit-sync:fitsync123@cluster0.cq14a.mongodb.net/";
const client = new MongoClient(MONGO_URI);

async function sync() {
  await client.connect();
  const db = client.db("fit-sync"); // Use your actual DB name

  // Sync Trainers
  const trainers = await db.collection("approvedtrainers").find({ status: "approved" }).toArray();
  for (const t of trainers) {
    await firestore.collection("trainers").doc(t._id.toString()).set({
      name: `${t.firstName} ${t.lastName}`,
      specialty: t.specialization || "General",
      profileImage: t.profileImage || "",
      isOnline: false,
      unreadCount: 0,
    });
    console.log("Synced trainer:", t.email);
  }

  // Sync Members
  const members = await db.collection("members").find({ status: "approved" }).toArray();
  for (const m of members) {
    await firestore.collection("members").doc(m._id.toString()).set({
      name: `${m.firstName} ${m.lastName}`,
      profileImage: m.image || "",
      isOnline: false,
      unreadCount: 0,
    });
    console.log("Synced member:", m.email);
  }

  await client.close();
  console.log("Sync complete!");
}

sync().catch(console.error); 