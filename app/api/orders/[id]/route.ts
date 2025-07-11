/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import { connectToDatabase } from "../../../lib/mongodb";
import Order from "../../../models/order";
import { headers } from "next/headers";

// GET - Fetch a single order by ID
export async function GET(request: any, context: { params: { id: string } }) {
  await connectToDatabase();
  try {
    const { id } = await context.params;
    const headersList = await headers();
    const userId = headersList.get("userId");

    // Find the order by ID
    const order = await Order.findById(id);

    // If order not found
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check if the order belongs to the user (security check)
    if (userId && order.user.toString() !== userId) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    // Return the order
    return NextResponse.json(order, { status: 200 });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

// PUT - Update an order by ID (e.g., change status)
export async function PUT(request: { json: () => any }, { params }: any) {
  await connectToDatabase();
  try {
    const { id } = await params;
    const updates = await request.json();
    const headersList = await headers();
    const userId = headersList.get("userId");

    // For security, let's first get the order
    const existingOrder = await Order.findById(id);
    
    // If order not found
    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Security check for user orders
    if (userId && existingOrder.user.toString() !== userId) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    // Only allow updating specific fields (e.g., status)
    const allowedUpdates = { status: updates.status };
    
    // Find and update the order
    const updatedOrder = await Order.findByIdAndUpdate(
      id, 
      allowedUpdates, 
      { new: true, runValidators: true }
    );

    // Return the updated order
    return NextResponse.json(updatedOrder, { status: 200 });
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}

// DELETE - Cancel an order by ID
export async function DELETE(request: any, { params }: any) {
  await connectToDatabase();
  try {
    const { id } = await params;
    const headersList = await headers();
    const userId = headersList.get("userId");

    // For security, let's first get the order
    const existingOrder = await Order.findById(id);
    
    // If order not found
    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Security check for user orders
    if (userId && existingOrder.user.toString() !== userId) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    // Instead of deleting, we'll update the status to cancelled
    const cancelledOrder = await Order.findByIdAndUpdate(
      id,
      { status: 'cancelled' },
      { new: true }
    );

    // Return success message
    return NextResponse.json({ 
      message: "Order cancelled successfully", 
      order: cancelledOrder 
    }, { status: 200 });
  } catch (error) {
    console.error("Error cancelling order:", error);
    return NextResponse.json({ error: "Failed to cancel order" }, { status: 500 });
  }
}