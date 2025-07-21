// pages/api/get-notifications.js
import { connectToDatabase } from '@/lib/mongodb';
import Notification from '@/models/Notification'; // your Mongoose model

export default async function handler(req, res) {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'User ID missing' });

  await connectToDatabase();

  try {
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching notifications' });
  }
}
