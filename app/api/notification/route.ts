// app/api/notifications/create/route.ts
import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Notification from '@/models/Notification';

export async function POST(req: NextRequest) {
  await connectToDatabase();
  console.log("📡 Received POST request to /api/notifications/create");

  const { userId, title, message, type } = await req.json();
  console.log("📝 Notification Payload:", { userId, title, message, type });

  try {
    const notification = new Notification({
      userId,
      title,
      message,
      type,
      isRead: false,
      createdAt: new Date(),
    });

    console.log("💾 Saving notification...");
    await notification.save();
    console.log("✅ Notification saved successfully!");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error("❌ Notification Save Error:", err);
    return new Response(JSON.stringify({ success: false, error: 'Notification save failed' }), {
      status: 500,
    });
  }
}
