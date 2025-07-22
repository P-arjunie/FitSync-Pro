// pages/api/send-notification.js
import { connectToDatabase } from '@/lib/mongodb';
import Notification from '@/models/Notification';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  await connectToDatabase();

  const { userId, role, message, sessionId } = req.body;

  const notif = await Notification.create({
    userId,
    role,
    sessionId,
    message,
    isRead: false,
  });

  if (res.socket.server.io) {
    res.socket.server.io.to(userId).emit('notification', notif); // Real-time push
  }

  res.status(200).json({ success: true });
}
