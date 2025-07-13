import mongoose, { Schema, Document } from "mongoose";

// Define the Payment schema interface
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
  userId: string; // userId as string (per your original)
  
  paymentFor?: "order" | "enrollment"; // optional new field
  relatedOrderId?: string; // optional ref to Order _id as string
  relatedEnrollmentId?: string; // optional ref to Enrollment _id as string
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
    userId: { type: String, required: true }, // string as before
    
    paymentFor: { type: String, enum: ["order", "enrollment"], default: "order" },
    relatedOrderId: { type: String, default: null },
    relatedEnrollmentId: { type: String, default: null }
  },
  { timestamps: true }
);

// Keep collection name as your original "kalana_paymentsses"
const Payment = mongoose.models.kalana_paymentsses || mongoose.model<IPayment>("kalana_paymentsses", paymentSchema);

export default Payment;
