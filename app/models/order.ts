
// app/models/order.ts
import mongoose, { Schema, Document } from "mongoose";

interface IOrder extends Document {
  user: mongoose.Types.ObjectId;
  orderItems: {
    product: string;
    title: string;
    image: string;
    price: number;
    quantity: number;
    category: string;
  }[];
  totalAmount: number;
  orderNumber: string;
  status: "pending" | "paid" | "shipped" | "completed" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    orderItems: [
      {
        product: { type: String, required: true },
        title: { type: String, required: true },
        image: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        category: { type: String, required: true },
      },
    ],
    totalAmount: { type: Number, required: true },
    orderNumber: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ["pending", "paid", "shipped", "completed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Order = mongoose.models.Order || mongoose.model<IOrder>("Order", orderSchema);
export default Order;
