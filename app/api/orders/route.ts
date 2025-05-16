/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import { connectToDatabase } from "../../lib/mongodb";
import Order from "../../models/order";
import { headers } from "next/headers";

// GET - Fetch all orders for a user
export async function GET(request: Request) {
  await connectToDatabase();
  try {
    const headersList = await headers();
    const userId = headersList.get("userId");

    // Check if userId is provided
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 401 });
    }

    // Find all orders for the user
    const orders = await Order.find({ user: userId });

    // Return the orders
    return NextResponse.json(orders, { status: 200 });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

// POST - Create a new order
export async function POST(request: Request) {
  await connectToDatabase();
  try {
    const body = await request.json();
    const { userId, orderItems, totalAmount } = body;

    // Validate required fields
    if (!userId || !orderItems || orderItems.length === 0 || !totalAmount) {
      return NextResponse.json({ 
        error: "Missing required fields: userId, orderItems, or totalAmount" 
      }, { status: 400 });
    }

    // Create the order
    const newOrder = await Order.create({
      user: userId,
      orderItems: orderItems.map((item: any) => ({
        product: item._id,
        title: item.title,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
        category: item.category
      })),
      totalAmount,
      status: 'pending'
    });

    // Return the created order
    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}