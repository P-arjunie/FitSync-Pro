// scripts/migratePricingPlanPayments.js
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Dynamic imports to avoid path issues
const Payment = require('../models/Payment');
const PricingPlanPurchase = require('../models/PricingPlanPurchase');

async function migrate() {
  try {
    console.log('Starting migration...');
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not found in .env file');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const payments = await Payment.find({
      paymentFor: 'pricing-plan',
      relatedOrderId: { $exists: false }
    });

    console.log(`Found ${payments.length} payments to migrate`);

    for (const payment of payments) {
      const purchase = await PricingPlanPurchase.findOne({
        userId: payment.userId,
        createdAt: {
          $gte: new Date(payment.createdAt - 60000),
          $lte: new Date(payment.createdAt + 60000)
        }
      });

      if (purchase) {
        payment.relatedOrderId = purchase._id;
        await payment.save();
        console.log(`Linked payment ${payment._id} to purchase ${purchase._id}`);
      }
    }

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();