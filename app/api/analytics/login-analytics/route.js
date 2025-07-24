// api/analytics/login-analytics/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../lib/mongodb.js';
import LoginHistory from '../../../models/LoginHistory';
import ApprovedTrainer from '../../../models/ApprovedTrainer';
import Member from '../../../models/member';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const fullName = searchParams.get('fullName');
    const userType = searchParams.get('userType'); // 'trainer' or 'member'

    if (!email && !fullName) {
      return NextResponse.json({ 
        message: 'Either email or fullName is required.' 
      }, { status: 400 });
    }

    await connectToDatabase();

    let userEmail = email;
    
    // If fullName is provided instead of email, find the user to get their email
    if (!email && fullName) {
      const [firstName, ...lastNameParts] = fullName.trim().split(' ');
      const lastName = lastNameParts.join(' ');
      
      let user = null;
      if (userType === 'trainer') {
        user = await ApprovedTrainer.findOne({ firstName, lastName });
      } else {
        // Try both trainer and member if userType not specified
        user = await ApprovedTrainer.findOne({ firstName, lastName }) ||
               await Member.findOne({ firstName, lastName });
      }
      
      if (!user) {
        return NextResponse.json({ 
          message: 'User not found.' 
        }, { status: 404 });
      }
      
      userEmail = user.email;
    }

    // Get login history for this user
    const loginHistory = await LoginHistory.find({
      email: userEmail
    }).sort({ timestamp: -1 });

    // Calculate analytics
    const totalLogins = loginHistory.length;
    const successfulLogins = loginHistory.filter(login => login.status === 'success');
    const failedLogins = loginHistory.filter(login => login.status === 'failure');
    
    const lastLogin = successfulLogins.length > 0 ? successfulLogins[0].timestamp : null;
    const lastFailedLogin = failedLogins.length > 0 ? failedLogins[0].timestamp : null;

    // Monthly login breakdown
    const monthlyLogins = {};
    loginHistory.forEach(login => {
      const date = new Date(login.timestamp);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyLogins[month]) {
        monthlyLogins[month] = { success: 0, failure: 0 };
      }
      monthlyLogins[month][login.status]++;
    });

    // Daily login breakdown for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentLogins = loginHistory.filter(login => 
      new Date(login.timestamp) >= thirtyDaysAgo
    );

    const dailyLogins = {};
    recentLogins.forEach(login => {
      const date = new Date(login.timestamp).toISOString().split('T')[0];
      if (!dailyLogins[date]) {
        dailyLogins[date] = { success: 0, failure: 0 };
      }
      dailyLogins[date][login.status]++;
    });

    // Peak hours analysis
    const hourlyBreakdown = {};
    successfulLogins.forEach(login => {
      const hour = new Date(login.timestamp).getHours();
      hourlyBreakdown[hour] = (hourlyBreakdown[hour] || 0) + 1;
    });

    // Device/Browser analysis
    const deviceStats = {};
    const browserStats = {};
    
    loginHistory.forEach(login => {
      if (login.userAgent) {
        // Simple device detection
        const ua = login.userAgent.toLowerCase();
        let device = 'Unknown';
        if (ua.includes('mobile') || ua.includes('android')) device = 'Mobile';
        else if (ua.includes('tablet') || ua.includes('ipad')) device = 'Tablet';
        else if (ua.includes('windows') || ua.includes('macintosh') || ua.includes('linux')) device = 'Desktop';
        
        deviceStats[device] = (deviceStats[device] || 0) + 1;

        // Simple browser detection
        let browser = 'Unknown';
        if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Chrome';
        else if (ua.includes('firefox')) browser = 'Firefox';
        else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
        else if (ua.includes('edg')) browser = 'Edge';
        
        browserStats[browser] = (browserStats[browser] || 0) + 1;
      }
    });

    // Failure reasons breakdown
    const failureReasons = {};
    failedLogins.forEach(login => {
      if (login.reason) {
        failureReasons[login.reason] = (failureReasons[login.reason] || 0) + 1;
      }
    });

    return NextResponse.json({
      loginAnalytics: {
        totalLogins,
        successfulLogins: successfulLogins.length,
        failedLogins: failedLogins.length,
        successRate: totalLogins > 0 ? ((successfulLogins.length / totalLogins) * 100).toFixed(2) : 0,
        lastLogin,
        lastFailedLogin,
        monthlyLogins: Object.entries(monthlyLogins).map(([month, data]) => ({
          month,
          ...data
        })),
        dailyLogins: Object.entries(dailyLogins).map(([date, data]) => ({
          date,
          ...data
        })),
        peakHours: Object.entries(hourlyBreakdown)
          .map(([hour, count]) => ({ hour: parseInt(hour), count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
        deviceStats: Object.entries(deviceStats).map(([device, count]) => ({ device, count })),
        browserStats: Object.entries(browserStats).map(([browser, count]) => ({ browser, count })),
        failureReasons: Object.entries(failureReasons).map(([reason, count]) => ({ reason, count })),
        recentLoginActivity: recentLogins.slice(0, 20).map(login => ({
          timestamp: login.timestamp,
          status: login.status,
          ipAddress: login.ipAddress,
          reason: login.reason
        }))
      }
    });

  } catch (err) {
    console.error('Login analytics error:', err);
    return NextResponse.json({ 
      message: err.message || 'Failed to fetch login analytics.' 
    }, { status: 500 });
  }
}