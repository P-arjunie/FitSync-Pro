// models/PricingPlanPurchase.ts

import mongoose from 'mongoose';

const PricingPlanPurchaseSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    planName: { type: String, required: true },
    priceId: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, default: 'pending' },
    stripeCustomerId: { type: String }, // For subscription support
}, {
  timestamps: true,
  collection: 'pricing_plan',   // 👈 custom collection name you created manually
});

export default mongoose.models.PricingPlanPurchase ||
  mongoose.model('PricingPlanPurchase', PricingPlanPurchaseSchema);
