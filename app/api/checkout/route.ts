/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { connectToDatabase } from "../../lib/mongodb";
import Order from "../../models/order";
import Product from "../../models/product";

export async function POST(request: Request) {
  await connectToDatabase();
  try {
    const body = await request.json();
    const { userId, items, totalAmount } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 401 });
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Create order items from cart items
    const orderItems = items.map((item: any) => ({
      product: item._id,
      title: item.title,
      image: item.image,
      price: item.price,
      quantity: item.quantity,
      category: item.category
    }));

    const count = await Order.countDocuments();
    const orderNumber = `ORD-${Date.now()}-${count + 1}`;

    // Create the order
    const newOrder = await Order.create({
    user: userId,
    orderItems,
    totalAmount: totalAmount || items.reduce(
        (sum: number, item: any) => sum + (item.price * item.quantity),
        0
    ),
    status: 'pending',
    orderNumber // manually include this to avoid the validation error
    });

    // Update inventory quantities
    for (const item of items) {
      const product = await Product.findById(item._id);
      if (product) {
        // Check if we have enough stock
        if (product.countInStock < item.quantity) {
          // If not enough stock, delete the order and return error
          await Order.findByIdAndDelete(newOrder._id);
          return NextResponse.json({ 
            error: `Insufficient stock for ${item.title}. Available: ${product.countInStock}, Requested: ${item.quantity}` 
          }, { status: 400 });
        }
        
        // Reduce the stock
        product.countInStock -= item.quantity;
        await product.save();
      }
    }

    // Return the created order
    return NextResponse.json({
      success: true,
      message: "Order created successfully",
      order: {
        _id: newOrder._id,
        orderNumber: newOrder.orderNumber,
        totalAmount: newOrder.totalAmount,
        status: newOrder.status,
        createdAt: newOrder.createdAt
      }
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to create order" 
    }, { status: 500 });
  }
}