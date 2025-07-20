// Script to fix invalid email addresses in the database
require("dotenv").config();
const mongoose = require("mongoose");
const Member = require("./app/models/member");
const ApprovedTrainer = require("./app/models/ApprovedTrainer");

const MONGODB_URI = process.env.MONGODB_URI;

async function fixInvalidEmails() {
  try {
    await mongoose.connect(MONGODB_URI, { dbName: "fit-sync" });
    console.log("✅ Connected to MongoDB");

    // Find and update members with invalid emails
    const invalidMembers = await Member.find({
      email: { $regex: /@example\.com|@test\.com/ }
    });

    console.log(`Found ${invalidMembers.length} members with invalid emails`);

    for (const member of invalidMembers) {
      // Generate a valid email based on their name
      const validEmail = `${member.firstName.toLowerCase()}.${member.lastName.toLowerCase()}@gmail.com`;
      
      await Member.updateOne(
        { _id: member._id },
        { email: validEmail }
      );
      
      console.log(`✅ Updated ${member.firstName} ${member.lastName}: ${member.email} → ${validEmail}`);
    }

    // Find and update trainers with invalid emails
    const invalidTrainers = await ApprovedTrainer.find({
      email: { $regex: /@example\.com|@test\.com/ }
    });

    console.log(`Found ${invalidTrainers.length} trainers with invalid emails`);

    for (const trainer of invalidTrainers) {
      // Generate a valid email based on their name
      const validEmail = `${trainer.firstName.toLowerCase()}.${trainer.lastName.toLowerCase()}@gmail.com`;
      
      await ApprovedTrainer.updateOne(
        { _id: trainer._id },
        { email: validEmail }
      );
      
      console.log(`✅ Updated ${trainer.firstName} ${trainer.lastName}: ${trainer.email} → ${validEmail}`);
    }

    console.log("✅ All invalid emails have been fixed!");
    await mongoose.disconnect();
  } catch (error) {
    console.error("❌ Error fixing emails:", error);
    process.exit(1);
  }
}

fixInvalidEmails(); 