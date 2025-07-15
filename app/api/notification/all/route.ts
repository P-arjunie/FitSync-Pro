// app/api/notifications/all/route.ts

import { connectToDatabase } from '@/lib/mongodb';
import Notification from '@/models/Notification';

export async function GET() {
  await connectToDatabase();

  const notifications = await Notification.find().sort({ createdAt: -1 });

  return new Response(JSON.stringify(notifications), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
