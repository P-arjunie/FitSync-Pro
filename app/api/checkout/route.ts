/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { connectToDatabase } from "../../lib/mongodb";
import Order from "../../models/order";
import Product from "../../models/product";
import { sendEmail } from "../../lib/sendEmail";
import Wallet from "../../models/Wallet";
import User from "../../models/User";

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

    // Wallet payment logic
    if (body.payWithWallet) {
      // Fetch wallet
      const wallet = await Wallet.findOne({ userId });
      if (!wallet || wallet.balance < newOrder.totalAmount) {
        return NextResponse.json({ error: "Insufficient wallet balance" }, { status: 400 });
      }
      // Deduct balance (update wallet.balance field AND push transaction)
      wallet.balance -= newOrder.totalAmount;
      wallet.transactions.push({
        type: "withdrawal",
        amount: newOrder.totalAmount,
        description: `Order payment for ${orderNumber}`,
        purchaseId: newOrder._id,
        status: "completed",
        createdAt: new Date()
      });
      await wallet.save();
      // Mark order as paid
      newOrder.status = "paid";
      await newOrder.save();
      // Fetch user for email
      const user = await User.findOne({ _id: userId });
      // Create Payment record for purchase history
      const Payment = (await import("@/models/Payment")).default;
      try {
        await Payment.create({
          firstName: orderItems[0]?.title || 'Store Purchase',
          lastName: userId.toString(),
          email: user?.email || 'unknown@fitsync.pro',
          company: 'FitSyncPro',
          amount: newOrder.totalAmount,
          currency: 'usd',
          paymentStatus: 'paid',
          paymentMethodId: 'wallet',
          billingAddress: {
            zip: '00000',
            country: 'US',
            city: 'N/A',
            street: 'N/A',
          },
          userId,
          paymentFor: 'order',
          relatedOrderId: newOrder._id,
          refundStatus: 'none',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } catch (paymentError) {
        console.error('❌ Failed to create Payment record for wallet order:', paymentError);
        return NextResponse.json({ error: 'Failed to record payment in database' }, { status: 500 });
      }
      // Send email to both
      try {
        const user = await User.findOne({ _id: userId });
        const userEmail = user?.email;
        const recipients = ["fitsyncpro.gym@gmail.com"];
        if (userEmail) recipients.push(userEmail);
        await sendEmail({
          to: recipients.join(","),
          subject: `Order Paid with Wallet: ${orderNumber}`,
          text: `Order paid using wallet.\nOrder Number: ${orderNumber}\nUser ID: ${userId}\nTotal Amount: $${newOrder.totalAmount}\nStatus: ${newOrder.status}`,
          html: `<h2>Order Paid with Wallet</h2><p><strong>Order Number:</strong> ${orderNumber}</p><p><strong>User ID:</strong> ${userId}</p><p><strong>Total Amount:</strong> $${newOrder.totalAmount}</p><p><strong>Status:</strong> ${newOrder.status}</p>`
        });
      } catch (emailError) {
        console.error("Failed to send wallet order email:", emailError);
      }
      return NextResponse.json({
        success: true,
        message: "Order paid with wallet successfully",
        order: {
          _id: newOrder._id,
          orderNumber: newOrder.orderNumber,
          totalAmount: newOrder.totalAmount,
          status: newOrder.status,
          createdAt: newOrder.createdAt
        }
      }, { status: 201 });
    }

    // Return the created order
    // Send email to fitsyncpro.gym@gmail.com and the user's email
    try {
      const user = await User.findOne({ _id: userId });
      const userEmail = user?.email;
      const recipients = ["fitsyncpro.gym@gmail.com"];
      if (userEmail) recipients.push(userEmail);
      await sendEmail({
        to: recipients.join(","),
        subject: `New Order Placed: ${orderNumber}`,
        text: `A new order has been placed.\nOrder Number: ${orderNumber}\nUser ID: ${userId}\nTotal Amount: $${newOrder.totalAmount}\nStatus: ${newOrder.status}`,
        html: `<h2>New Order Placed</h2><p><strong>Order Number:</strong> ${orderNumber}</p><p><strong>User ID:</strong> ${userId}</p><p><strong>Total Amount:</strong> $${newOrder.totalAmount}</p><p><strong>Status:</strong> ${newOrder.status}</p>`
      });
    } catch (emailError) {
      console.error("Failed to send order email:", emailError);
    }
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