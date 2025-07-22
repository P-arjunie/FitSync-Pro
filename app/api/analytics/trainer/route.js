import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../lib/mongodb.js';
import Review from '../../../models/Review';
import Payment from '../../../models/Payment';
import ApprovedTrainer from '../../../models/ApprovedTrainer';
import LoginHistory from '../../../models/LoginHistory';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const fullName = searchParams.get('fullName');
    if (!fullName) {
      return NextResponse.json({ message: 'Trainer full name required.' }, { status: 400 });
    }

    await connectToDatabase();

    // Authenticate trainer (match by firstName and lastName)
    const [firstName, ...lastNameParts] = fullName.trim().split(' ');
    const lastName = lastNameParts.join(' ');
    const trainer = await ApprovedTrainer.findOne({ firstName, lastName });
    if (!trainer) {
      return NextResponse.json({ message: 'Not an approved trainer.' }, { status: 403 });
    }

    // Revenue analytics (Payment model, only for this trainer)
    const payments = await Payment.find({
      paymentStatus: 'succeeded',
      $or: [
        { 'email': trainer.email },
        { 'firstName': trainer.firstName, 'lastName': trainer.lastName }
      ]
    });
    let totalRevenue = 0;
    let monthlyRevenue = {};
    payments.forEach((p) => {
      totalRevenue += p.amount || 0;
      const date = new Date(p.createdAt);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (p.amount || 0);
    });
    const monthlyRevenueArr = Object.entries(monthlyRevenue).map(([month, revenue]) => ({ month, revenue }));

    // Session analytics
    const reviews = await Review.find({ trainer: fullName });
    let sessionTypes = {};
    reviews.forEach((r) => {
      sessionTypes[r.sessionType] = (sessionTypes[r.sessionType] || 0) + 1;
    });
    const sessionTypesArr = Object.entries(sessionTypes).map(([type, count]) => ({ type, count }));

    // Usage analytics (login history for this trainer)
    let loginCount = 0;
    let lastLogin = null;
    try {
      const logins = await LoginHistory.find({ email: trainer.email, status: 'success' }).sort({ timestamp: -1 });
      loginCount = logins.length;
      lastLogin = logins[0]?.timestamp || null;
    } catch (e) {
      // If LoginHistory not available, skip
    }

    return NextResponse.json({
      analytics: {
        totalRevenue,
        totalSessions: payments.length,
        monthlyRevenue: monthlyRevenueArr,
        sessionTypes: sessionTypesArr,
        usage: {
          loginCount,
          lastLogin
        }
      },
    });
  } catch (err) {
    return NextResponse.json({ message: err.message || 'Failed to fetch analytics.' }, { status: 500 });
  }
}
