import cron from 'node-cron';
import { sendEmail } from '@/lib/sendEmail';
import Session from '@/models/Session';
import User from '@/models/User';

cron.schedule('0 * * * *', async () => {
  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

  const sessions = await Session.find({
    startTime: { $gte: now, $lte: oneHourLater }
  });

  for (const session of sessions) {
    const trainer = await User.findById(session.trainerId);
    const client = await User.findById(session.clientId);

    await sendEmail({
      to: trainer.email,
      subject: 'Upcoming Session Reminder',
      text: `You have a session at ${session.startTime}`
    });

    await sendEmail({
      to: client.email,
      subject: 'Upcoming Session Reminder',
      text: `You have a session at ${session.startTime}`
    });
  }
});
