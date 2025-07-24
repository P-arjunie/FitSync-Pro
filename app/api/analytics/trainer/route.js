import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Review from '@/models/Review';
import Payment from '@/models/Payment';
import ApprovedTrainer from '@/models/ApprovedTrainer';
import Session from '@/models/Session';
import VirtualSession from '@/models/VirtualSession';
import SessionParticipant from '@/models/SessionParticipant';

async function fetchLoginStats(email) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/analytics/login-stats?email=${encodeURIComponent(email)}`);
    if (response.ok) {
      return await response.json();
    }
    return { totalLogins: 0, lastLogin: null };
  } catch (error) {
    console.error('Error fetching login stats:', error);
    return { totalLogins: 0, lastLogin: null };
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const fullName = searchParams.get('fullName');
    
    if (!fullName) {
      return NextResponse.json({ message: 'Trainer full name required.' }, { status: 400 });
    }

    await connectToDatabase();

    // Authenticate trainer
    const [firstName, ...lastNameParts] = fullName.trim().split(' ');
    const lastName = lastNameParts.join(' ');
    const trainer = await ApprovedTrainer.findOne({ firstName, lastName });
    
    if (!trainer) {
      return NextResponse.json({ message: 'Not an approved trainer.' }, { status: 403 });
    }

    // Fetch login statistics
    const loginStats = await fetchLoginStats(trainer.email);

    // Revenue analytics
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

    const monthlyRevenueArr = Object.entries(monthlyRevenue).map(([month, revenue]) => ({ 
      month, 
      revenue 
    }));

    // Session analytics (physical)
    const sessions = await Session.find({ trainerName: fullName });
    const sessionStatusBreakdown = { active: 0, cancelled: 0, completed: 0 };
    let totalParticipants = 0;
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
    let virtualSessionStatusBreakdown = {};
    let totalVirtualParticipants = 0;
    let doneVirtualSessions = [];
    let toBeHeldVirtualSessions = [];
    
    virtualSessions.forEach((vs) => {
      virtualSessionStatusBreakdown['completed'] = (virtualSessionStatusBreakdown['completed'] || 0) + 1;
      totalVirtualParticipants += vs.participants?.length || 0;
      doneVirtualSessions.push(vs);
    });

    // Session history
    const sessionHistory = [
      ...donePhysicalSessions.map(s => ({ 
        type: 'Physical', 
        status: 'completed', 
        ...s._doc 
      })),
      ...toBeHeldPhysicalSessions.map(s => ({ 
        type: 'Physical', 
        status: 'active', 
        ...s._doc 
      })),
      ...doneVirtualSessions.map(vs => ({ 
        type: 'Virtual', 
        status: 'completed', 
        ...vs._doc 
      })),
      ...toBeHeldVirtualSessions.map(vs => ({ 
        type: 'Virtual', 
        status: 'active', 
        ...vs._doc 
      })),
    ].sort((a, b) => new Date(b.start || b.date) - new Date(a.start || a.date));

    // Session participants analytics
    const sessionParticipantCount = await SessionParticipant.countDocuments({ 
      status: 'approved', 
      userEmail: trainer.email 
    });

    // Session types
    let sessionTypes = {};
    sessions.forEach(() => {
      sessionTypes['Physical'] = (sessionTypes['Physical'] || 0) + 1;
    });
    virtualSessions.forEach(() => {
      sessionTypes['Virtual'] = (sessionTypes['Virtual'] || 0) + 1;
    });

    const sessionTypesArr = Object.entries(sessionTypes).map(([type, count]) => ({ 
      type, 
      count 
    }));

    // Totals
    const totalSessions = sessions.length + virtualSessions.length;
    const totalAllParticipants = totalParticipants + totalVirtualParticipants;
    const toBeHeldSessions = toBeHeldPhysicalSessions.length + toBeHeldVirtualSessions.length;

    return NextResponse.json({
      analytics: {
        totalRevenue,
        totalSessions,
        monthlyRevenue: monthlyRevenueArr,
        sessionTypes: sessionTypesArr,
        usage: {
          loginCount: loginStats.totalLogins,
          lastLogin: loginStats.lastLogin,
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
      },
    });
  } catch (err) {
    console.error('Trainer analytics error:', err);
    return NextResponse.json({ 
      message: err.message || 'Failed to fetch analytics.' 
    }, { status: 500 });
  }
}