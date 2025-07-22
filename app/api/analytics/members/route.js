import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../lib/mongodb.js';
import Member from '../../../models/member';
import LoginHistory from '../../../models/LoginHistory';

export async function GET(req) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const gender = searchParams.get('gender');
    const status = searchParams.get('status');
    // For location, you can add more filters if you have location fields

    // Date range for signups
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter = { createdAt: {} };
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.createdAt.$lte = end;
      }
    }

    // Build member query
    const memberQuery = { ...dateFilter };
    if (gender && gender !== 'all') memberQuery['gender'] = gender;
    if (status && status !== 'all') memberQuery['status'] = status;

    // Fetch members
    const members = await Member.find(memberQuery);
    const totalMembers = await Member.countDocuments();
    const activeMembers = await Member.countDocuments({ status: 'approved' });
    const inactiveMembers = await Member.countDocuments({ status: { $ne: 'approved' } });

    // Growth trend: signups per month
    const signupsByMonth = await Member.aggregate([
      { $match: dateFilter.createdAt ? dateFilter : {} },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id': 1 } },
    ]);

    // Churn: members who changed to suspended or deleted (if you track deletions)
    const churnByMonth = await Member.aggregate([
      { $match: { status: 'suspended', ...(dateFilter.createdAt ? dateFilter : {}) } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$updatedAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id': 1 } },
    ]);

    // Demographics: gender
    const genderBreakdown = await Member.aggregate([
      { $group: { _id: '$gender', count: { $sum: 1 } } },
    ]);

    // Demographics: age (if dob is available)
    const now = new Date();
    const ageBuckets = [
      { label: 'Under 18', min: 0, max: 17 },
      { label: '18-24', min: 18, max: 24 },
      { label: '25-34', min: 25, max: 34 },
      { label: '35-44', min: 35, max: 44 },
      { label: '45-54', min: 45, max: 54 },
      { label: '55+', min: 55, max: 120 },
    ];
    const ageBreakdown = {};
    members.forEach((m) => {
      if (!m.dob) return;
      const birth = new Date(m.dob);
      if (isNaN(birth.getTime())) return;
      const age = now.getFullYear() - birth.getFullYear() - (now < new Date(now.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0);
      const bucket = ageBuckets.find((b) => age >= b.min && age <= b.max);
      if (bucket) ageBreakdown[bucket.label] = (ageBreakdown[bucket.label] || 0) + 1;
    });

    // Engagement: logins in period
    let loginFilter = {};
    if (startDate || endDate) {
      loginFilter = { timestamp: {} };
      if (startDate) loginFilter.timestamp.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        loginFilter.timestamp.$lte = end;
      }
    }
    const logins = await LoginHistory.find({ ...loginFilter, status: 'success' });
    const activeMemberEmails = new Set(logins.map((l) => l.email));
    const activeCount = members.filter((m) => activeMemberEmails.has(m.email)).length;
    const inactiveCount = members.length - activeCount;

    return NextResponse.json({
      success: true,
      data: {
        totalMembers,
        activeMembers,
        inactiveMembers,
        signupsByMonth,
        churnByMonth,
        genderBreakdown,
        ageBreakdown,
        activeCount,
        inactiveCount,
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message || 'Failed to fetch member analytics.' }, { status: 500 });
  }
}
