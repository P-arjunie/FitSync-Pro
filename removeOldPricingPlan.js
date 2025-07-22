// removeOldPricingPlan.js
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fitsync';

// Minimal ApprovedTrainer model for direct access
const ApprovedTrainerSchema = new mongoose.Schema({}, { strict: false });
const ApprovedTrainer = mongoose.model('ApprovedTrainer', ApprovedTrainerSchema, 'approvedtrainers');

async function main() {
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const result = await ApprovedTrainer.updateMany({}, { $unset: { pricingPlan: "" } });
  console.log('Removed old pricingPlan field from trainers:', result.modifiedCount);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
}); 