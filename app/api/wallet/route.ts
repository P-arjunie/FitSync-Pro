import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Wallet from "@/models/Wallet";

const connectToDB = async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!, { dbName: 'fit-sync' });
    console.log('✅ MongoDB connected (wallet)');
    console.log('🔎 [DEBUG] mongoose.connection.name:', mongoose.connection.name);
  }
};

export async function GET(req: NextRequest) {
  try {
    await connectToDB();

    const userId = req.nextUrl.searchParams.get("userId");
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Find or create wallet for user
    let wallet = await Wallet.findOne({ userId });
    
    if (!wallet) {
      wallet = new Wallet({
        userId,
        balance: 0,
        currency: 'usd',
        transactions: []
      });
      await wallet.save();
    }

    // Only include transactions for payments that still exist in purchase history
    const Payment = (await import('@/models/Payment')).default;
    const validPaymentIds = (await Payment.find({ userId }, { _id: 1 })).map((p: any) => String(p._id));
    const filteredTransactions = wallet.transactions.filter(t => !t.purchaseId || validPaymentIds.includes(String(t.purchaseId)));
    // Recalculate balance
    let recalculatedBalance = 0;
    for (const t of filteredTransactions) {
      if (t.type === 'refund' || t.type === 'credit') {
        recalculatedBalance += t.amount;
      } else if (t.type === 'withdrawal') {
        recalculatedBalance -= t.amount;
      }
    }

    return NextResponse.json({ 
      success: true, 
      wallet: {
        balance: recalculatedBalance,
        currency: wallet.currency,
        transactions: filteredTransactions
      }
    });

  } catch (error: any) {
    console.error("❌ Wallet fetch error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to fetch wallet" 
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDB();

    const body = await req.json();
    const { userId, type, amount, description, purchaseId } = body;

    if (!userId || !type || !amount || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Find or create wallet for user
    let wallet = await Wallet.findOne({ userId });
    
    if (!wallet) {
      wallet = new Wallet({
        userId,
        balance: 0,
        currency: 'usd',
        transactions: []
      });
    }

    // Add transaction
    const transaction = {
      type,
      amount,
      description,
      purchaseId,
      status: 'completed' as const,
      createdAt: new Date()
    };

    wallet.transactions.push(transaction);

    // Update balance based on transaction type
    if (type === 'refund' || type === 'credit') {
      wallet.balance += amount;
    } else if (type === 'withdrawal') {
      if (wallet.balance < amount) {
        return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
      }
      wallet.balance -= amount;
    }

    await wallet.save();

    return NextResponse.json({ 
      success: true, 
      message: "Transaction processed successfully",
      newBalance: wallet.balance,
      transaction
    });

  } catch (error: any) {
    console.error("❌ Wallet transaction error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to process transaction" 
    }, { status: 500 });
  }
} 