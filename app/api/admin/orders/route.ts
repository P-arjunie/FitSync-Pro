/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { connectToDatabase } from "../../../lib/mongodb";
import Order from "../../../models/order";
import { headers } from "next/headers";

// Helper function to check if user is admin
async function isAdmin(userId: string) {
  // This is a placeholder. You should implement your own admin check logic
  // For example, checking a User model with an isAdmin field
  // For now, we'll just assume a specific user ID is an admin
  return true; // Replace with your actual admin check logic
}

// GET - Fetch all orders (admin only)
export async function GET(request: Request) {
  await connectToDatabase();
  try {
    const headersList = await headers();
    const userId = headersList.get("userId");
    
    // Check if userId is provided
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    
    // Check if user is admin
    const admin = await isAdmin(userId);
    if (!admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    
    // Parse query parameters
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const page = parseInt(url.searchParams.get("page") || "1");
    const skip = (page - 1) * limit;
    
    // Build query
    let query: any = {};
    if (status) {
      query.status = status;
    }
    
    // Count total orders matching query
    const totalOrders = await Order.countDocuments(query);
    
    // Get orders with pagination
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email'); // Assuming you have a User model with these fields
    
    // Return the orders with pagination info
    return NextResponse.json({
      orders,
      pagination: {
        total: totalOrders,
        page,
        limit,
        pages: Math.ceil(totalOrders / limit)
      }
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

// PUT - Update multiple orders status (admin only)
export async function PUT(request: Request) {
  await connectToDatabase();
  try {
    const headersList = await headers();
    const userId = headersList.get("userId");
    
    // Check if userId is provided
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    
    // Check if user is admin
    const admin = await isAdmin(userId);
    if (!admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    
    const body = await request.json();
    const { orderIds, status } = body;
    
    // Validate input
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: "Order IDs are required" }, { status: 400 });
    }
    
    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }
    
    // Update multiple orders
    const result = await Order.updateMany(
      { _id: { $in: orderIds } },
      { $set: { status } }
    );
    
    return NextResponse.json({
      message: `${result.modifiedCount} orders updated successfully`,
      modifiedCount: result.modifiedCount
    }, { status: 200 });
  } catch (error) {
    console.error("Error updating orders:", error);
    return NextResponse.json({ error: "Failed to update orders" }, { status: 500 });
  }
}