// Seed script for MongoDB: Adds one ApprovedTrainer and one Member for chat testing
require("dotenv").config();
const mongoose = require("mongoose");
const ApprovedTrainer = require("../app/models/ApprovedTrainer");
const Member = require("../app/models/member");

const MONGODB_URI = process.env.MONGODB_URI;

async function seed() {
  await mongoose.connect(MONGODB_URI, { dbName: "fit-sync" });

  // Create a sample trainer
  const trainer = new ApprovedTrainer({
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah.johnson@example.com",
    phone: "1234567890",
    dob: "1980-01-01",
    gender: "Female",
    address: "123 Main St",
    specialization: "Yoga",
    certifications: ["Certified Yoga Instructor"],
    preferredTrainingHours: "Morning",
    yearsOfExperience: "10",
    availability: "Weekdays",
    pricingPlan: "Standard",
    emergencyName: "Anna Johnson",
    emergencyPhone: "0987654321",
    relationship: "Sister",
    termsAccepted: true,
    profileImage: "",
    submittedAt: new Date(),
    biography: "Experienced yoga trainer.",
    skills: [{ name: "Yoga", level: 90 }],
  });

  // Create a sample member
  const member = new Member({
    firstName: "John",
    lastName: "Smith",
    dob: "1990-05-10",
    gender: "Male",
    nic: "900510123V",
    address: "456 Elm St",
    contactNumber: "5551234567",
    email: "john.smith@example.com",
    emergencyContact: {
      name: "Jane Smith",
      relationship: "Wife",
      phone: "5559876543",
    },
    membershipInfo: {
      plan: "Gold",
      startDate: "2024-01-01",
      paymentPlan: "Monthly",
    },
    image: "",
    currentWeight: 75,
    height: 180,
    bmi: 23.1,
    goalWeight: 70,
    status: "approved",
    role: "member",
  });

  await ApprovedTrainer.deleteMany({ email: "sarah.johnson@example.com" });
  await Member.deleteMany({ email: "john.smith@example.com" });
  await trainer.save();
  await member.save();

  console.log("✅ Seeded sample trainer and member.");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("❌ Seed error:", err);
  process.exit(1);
}); 