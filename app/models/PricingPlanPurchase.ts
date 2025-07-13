// models/PricingPlanPurchase.ts
import mongoose from 'mongoose';

const PricingPlanPurchaseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  planName: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, default: 'pending' },
}, {
  timestamps: true,
  collection: 'pricing_plan',   // 👈 custom collection name you created manually
});

export default mongoose.models.PricingPlanPurchase ||
  mongoose.model('PricingPlanPurchase', PricingPlanPurchaseSchema);
