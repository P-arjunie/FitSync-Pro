import mongoose, { Schema, Document } from "mongoose";

// Order schema interface
interface IOrder extends Document {
  user: string; // userId as string
  orderItems: {
    product: string;
    title: string;
    image: string;
    price: number;
    quantity: number;
    category: string;
  }[];
  totalAmount: number;
  orderNumber: string;  // <-- Add this field here
  status: string; // <-- Add this field here
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    user: { type: String, required: true }, // userId as string
    orderItems: [
      {
        product: { type: String, required: true },
        title: { type: String, required: true },
        image: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        category: { type: String, required: true }
      }
    ],
    totalAmount: { type: Number, required: true },

    orderNumber: {  // <-- Add this here
      type: String,
      required: true,
      unique: true
    },
    status: {
      type: String,
      enum: ["pending", "paid", "shipped", "completed", "cancelled"],
      default: "pending"
    }
  },
  { timestamps: true } // Include timestamps for createdAt and updatedAt
);

const Order = mongoose.models.Order || mongoose.model<IOrder>("Order", orderSchema);
export default Order;
