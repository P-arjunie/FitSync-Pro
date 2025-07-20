// models/MonthlyPlan.ts

import mongoose from 'mongoose';

const MonthlyPlanSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    planName: { type: String, required: true },
    planType: { type: String, required: true }, // 'class' or 'membership'
    className: { type: String }, // for class-specific monthly plans
    amount: { type: Number, required: true },
    status: { type: String, default: 'active' }, // 'active', 'cancelled', 'expired'
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    nextRenewalDate: { type: Date, required: true },
    stripeCustomerId: { type: String }, // For subscription support
    stripeSubscriptionId: { type: String }, // For subscription support
    autoRenew: { type: Boolean, default: true },
}, {
  timestamps: true,
  collection: 'monthly_plans',
});

export default mongoose.models.MonthlyPlan ||
  mongoose.model('MonthlyPlan', MonthlyPlanSchema); 