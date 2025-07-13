// app/models/Payment.ts
import mongoose, { Schema, Document } from "mongoose";

interface IPayment extends Document {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  amount: number;
  currency: string;
  paymentStatus: string;
  paymentMethodId: string;
  billingAddress: {
    zip: string;
    country: string;
    city: string;
    street: string;
  };
  userId: mongoose.Types.ObjectId; // Changed to ObjectId for consistency
  
  paymentFor: "order" | "enrollment"; // Made required
  relatedOrderId?: mongoose.Types.ObjectId; // Changed to ObjectId
  relatedEnrollmentId?: mongoose.Types.ObjectId; // Changed to ObjectId
  
  stripePaymentIntentId?: string; // Added for Stripe tracking
}

const paymentSchema = new Schema<IPayment>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    company: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    paymentStatus: { type: String, required: true },
    paymentMethodId: { type: String, required: true },
    billingAddress: {
      zip: { type: String, required: true },
      country: { type: String, required: true },
      city: { type: String, required: true },
      street: { type: String, required: true }
    },
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    
    paymentFor: { type: String, enum: ["order", "enrollment"], required: true },
    relatedOrderId: { type: Schema.Types.ObjectId, ref: "Order", default: null },
    relatedEnrollmentId: { type: Schema.Types.ObjectId, ref: "Enrollment", default: null },
    
    stripePaymentIntentId: { type: String }
  },
  { timestamps: true }
);

// Add indexes for better performance
paymentSchema.index({ userId: 1, paymentFor: 1 });
paymentSchema.index({ relatedEnrollmentId: 1 });
paymentSchema.index({ stripePaymentIntentId: 1 });

const Payment = mongoose.models.kalana_paymentsses || mongoose.model<IPayment>("kalana_paymentsses", paymentSchema);

export default Payment;