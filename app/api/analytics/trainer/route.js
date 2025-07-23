import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../lib/mongodb.js';

import Review from '../../../models/Review';
import Payment from '../../../models/Payment';
import ApprovedTrainer from '../../../models/ApprovedTrainer';
import LoginHistory from '../../../models/LoginHistory';
import Session from '../../../models/Session';
import VirtualSession from '../../../models/VirtualSession';
import SessionParticipant from '../../../models/SessionParticipant';

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


    // Session analytics (physical)
    const sessions = await Session.find({ trainerName: fullName });
    const sessionStatusBreakdown = { active: 0, cancelled: 0, completed: 0 };
    let totalParticipants = 0;
    let sessionRevenue = 0;
    let donePhysicalSessions = [];
    let toBeHeldPhysicalSessions = [];
    sessions.forEach((s) => {
      sessionStatusBreakdown[s.status] = (sessionStatusBreakdown[s.status] || 0) + 1;
      totalParticipants += s.currentParticipants || 0;
      if (s.status === 'completed') donePhysicalSessions.push(s);
      else if (s.status === 'active') toBeHeldPhysicalSessions.push(s);
    });

    // Virtual session analytics
    const virtualSessions = await VirtualSession.find({ 'trainer.name': fullName });
    let virtualSessionStatusBreakdown = { };
    let totalVirtualParticipants = 0;
    let doneVirtualSessions = [];
    let toBeHeldVirtualSessions = [];
    virtualSessions.forEach((vs) => {
      // If you have a status field, use it. Otherwise, treat all as completed for now.
      virtualSessionStatusBreakdown['completed'] = (virtualSessionStatusBreakdown['completed'] || 0) + 1;
      totalVirtualParticipants += vs.participants?.length || 0;
      doneVirtualSessions.push(vs); // If you have a status, categorize properly
    });

    // History: combine all sessions
    const sessionHistory = [
      ...donePhysicalSessions.map(s => ({ type: 'Physical', status: 'completed', ...s._doc })),
      ...toBeHeldPhysicalSessions.map(s => ({ type: 'Physical', status: 'active', ...s._doc })),
      ...doneVirtualSessions.map(vs => ({ type: 'Virtual', status: 'completed', ...vs._doc })),
      ...toBeHeldVirtualSessions.map(vs => ({ type: 'Virtual', status: 'active', ...vs._doc })),
    ].sort((a, b) => new Date(b.start || b.date) - new Date(a.start || a.date));

    // Session participants analytics
    const sessionParticipantCount = await SessionParticipant.countDocuments({ status: 'approved', userEmail: trainer.email });

    // Session types (from both physical and virtual)
    let sessionTypes = {};
    sessions.forEach((s) => {
      sessionTypes['Physical'] = (sessionTypes['Physical'] || 0) + 1;
    });
    virtualSessions.forEach((vs) => {
      sessionTypes['Virtual'] = (sessionTypes['Virtual'] || 0) + 1;
    });
    const sessionTypesArr = Object.entries(sessionTypes).map(([type, count]) => ({ type, count }));

    // Advanced: total sessions, total participants, session status breakdown
    const totalSessions = sessions.length + virtualSessions.length;
    const totalAllParticipants = totalParticipants + totalVirtualParticipants;

    // To be held sessions (status 'active')
    const toBeHeldSessions = toBeHeldPhysicalSessions.length + toBeHeldVirtualSessions.length;

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
        totalSessions,
        monthlyRevenue: monthlyRevenueArr,
        sessionTypes: sessionTypesArr,
        usage: {
          loginCount,
          lastLogin
        },
        sessionStatusBreakdown: {
          ...sessionStatusBreakdown,
          ...virtualSessionStatusBreakdown
        },
        totalParticipants: totalAllParticipants,
        sessionParticipantCount,
        toBeHeldSessions,
        donePhysicalSessions: donePhysicalSessions.length,
        toBeHeldPhysicalSessions: toBeHeldPhysicalSessions.length,
        doneVirtualSessions: doneVirtualSessions.length,
        toBeHeldVirtualSessions: toBeHeldVirtualSessions.length,
        sessionHistory,
        // Add more advanced metrics here as needed
      },
    });
  } catch (err) {
    return NextResponse.json({ message: err.message || 'Failed to fetch analytics.' }, { status: 500 });
  }
}
