import { sendEmail } from '@/lib/sendEmail';

export default async function handler(req, res) {
  const { to, subject, text } = req.body;

  try {
    await sendEmail({ to, subject, text });
    res.status(200).json({ message: 'Email sent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
