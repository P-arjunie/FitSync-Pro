// app/models/Payment.ts
import mongoose, { Schema, Document, model } from 'mongoose';

export interface IPayment extends Document {
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
  userId: string;
  paymentFor: 'order' | 'enrollment' | 'pricing-plan' | 'monthly-plan';
  relatedOrderId?: mongoose.Types.ObjectId | null;
  relatedEnrollmentId?: mongoose.Types.ObjectId | null;
  stripePaymentIntentId?: string;
  refundStatus?: 'none' | 'requested' | 'refunded' | 'denied';
  refundRequestedAt?: Date;
  refundProcessedAt?: Date;
  refundAmount?: number;
  refundReason?: string;
  hiddenForUser: boolean;
  createdAt?: Date;
  updatedAt?: Date;
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
      street: { type: String, required: true },
    },
    userId: { type: String, required: true },
    paymentFor: {
      type: String,
      enum: ['order', 'enrollment', 'pricing-plan', 'monthly-plan'],
      required: true,
    },
    relatedOrderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    relatedEnrollmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Enrollment',
      default: null,
    },
    stripePaymentIntentId: {
      type: String,
    },
    refundStatus: {
      type: String,
      enum: ['none', 'requested', 'refunded', 'denied'],
      default: 'none',
    },
    refundRequestedAt: {
      type: Date,
    },
    refundProcessedAt: {
      type: Date,
    },
    refundAmount: {
      type: Number,
    },
    refundReason: {
      type: String,
    },
    hiddenForUser: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'kalana_paymentsses',
  }
);

delete mongoose.models.Payment;

const Payment = mongoose.models.Payment as mongoose.Model<IPayment> || 
model<IPayment>('Payment', paymentSchema);

export default Payment;
