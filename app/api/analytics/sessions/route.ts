// app/api/analytics/sessions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from "@/lib/mongodb";
import Session from '@/models/Session';
import ApprovedTrainer from '@/models/ApprovedTrainer';
import VirtualSession from '@/models/VirtualSession';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const trainer = searchParams.get('trainer');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const now = new Date();

    // Helper to build query for sessions (physical or virtual)
    function buildQuery(isVirtual = false) {
      const q: any = {};
      if (trainer && trainer !== 'all') {
        q[isVirtual ? 'trainer' : 'trainerName'] = trainer;
      }
      if (startDate || endDate) {
        const key = isVirtual ? 'date' : 'start';
        q[key] = {};
        if (startDate) {
          const startDateObj = new Date(startDate);
          if (!isNaN(startDateObj.getTime())) {
            q[key].$gte = startDateObj;
          }
        }
        if (endDate) {
          const endDateObj = new Date(endDate);
          if (!isNaN(endDateObj.getTime())) {
            endDateObj.setDate(endDateObj.getDate() + 1);
            q[key].$lte = endDateObj;
          }
        }
        if (Object.keys(q[key]).length === 0) {
          delete q[key];
        }
      }
      return q;
    }

    // Fetch all sessions (physical and virtual)
    const sessions = await Session.find(buildQuery(false)).sort({ start: 1 });
    const virtualSessions = await VirtualSession.find(buildQuery(true)).sort({ date: 1 });

    // Categorize sessions: done (past) and to be held (future)
    const doneSessions = sessions.filter(s => s.start < now);
    const toBeHeldSessions = sessions.filter(s => s.start >= now);
    const doneVirtualSessions = virtualSessions.filter(s => s.date < now);
    const toBeHeldVirtualSessions = virtualSessions.filter(s => s.date >= now);

    // Get unique approved trainers for dropdown
    const approvedTrainers = await ApprovedTrainer.find({}, 'firstName lastName');
    const uniqueTrainers = approvedTrainers.map((trainer: any) => `${trainer.firstName} ${trainer.lastName}`);

    // Helper to group sessions by month
    function groupByMonth(sessionsArr: any[], dateKey: string) {
      const map: Record<string, number> = {};
      sessionsArr.forEach(session => {
        const date = new Date(session[dateKey]);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        map[monthYear] = (map[monthYear] || 0) + 1;
      });
      return map;
    }

    // Get all months in range for chart
    let minDate, maxDate;
    const allSessions = [...sessions, ...virtualSessions];
    if (startDate && endDate) {
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      if (!isNaN(startDateObj.getTime()) && !isNaN(endDateObj.getTime())) {
        minDate = startDateObj;
        maxDate = endDateObj;
      } else if (allSessions.length > 0) {
        minDate = new Date(Math.min(...allSessions.map(s => new Date(s.start || s.date).getTime())));
        maxDate = new Date(Math.max(...allSessions.map(s => new Date(s.start || s.date).getTime())));
      } else {
        minDate = new Date(now.getFullYear(), now.getMonth(), 1);
        maxDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      }
    } else if (allSessions.length > 0) {
      minDate = new Date(Math.min(...allSessions.map(s => new Date(s.start || s.date).getTime())));
      maxDate = new Date(Math.max(...allSessions.map(s => new Date(s.start || s.date).getTime())));
    } else {
      minDate = new Date(now.getFullYear(), now.getMonth(), 1);
      maxDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    // Generate all months between min and max date
    const allMonths: string[] = [];
    const currentDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    while (currentDate <= maxDate) {
      const monthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      allMonths.push(monthYear);
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    // Group by month for each category
    const donePhysicalByMonth = groupByMonth(doneSessions, 'start');
    const toBeHeldPhysicalByMonth = groupByMonth(toBeHeldSessions, 'start');
    const doneVirtualByMonth = groupByMonth(doneVirtualSessions, 'date');
    const toBeHeldVirtualByMonth = groupByMonth(toBeHeldVirtualSessions, 'date');

    // Prepare chart arrays
    const donePhysicalCounts = allMonths.map(month => donePhysicalByMonth[month] || 0);
    const toBeHeldPhysicalCounts = allMonths.map(month => toBeHeldPhysicalByMonth[month] || 0);
    const doneVirtualCounts = allMonths.map(month => doneVirtualByMonth[month] || 0);
    const toBeHeldVirtualCounts = allMonths.map(month => toBeHeldVirtualByMonth[month] || 0);

    // Format month labels for display
    const monthLabels = allMonths.map(month => {
      const [year, monthNum] = month.split('-');
      const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
      return date.toLocaleString('default', { month: 'long', year: 'numeric' });
    });

    // Calculate additional analytics fields for frontend compatibility
    const totalSessions = sessions.length + virtualSessions.length;
    // Calculate average sessions per day
    let averageSessionsPerDay = 0;
    if (allSessions.length > 0) {
      // Find unique days in the range, skip invalid dates
      const daySet = new Set<string>();
      allSessions.forEach(s => {
        const d = new Date(s.start || s.date);
        if (!isNaN(d.getTime())) {
          daySet.add(d.toISOString().split('T')[0]);
        }
      });
      if (daySet.size > 0) {
        averageSessionsPerDay = totalSessions / daySet.size;
      } else {
        averageSessionsPerDay = 0;
      }
      // Ensure it's a valid number
      if (!isFinite(averageSessionsPerDay) || isNaN(averageSessionsPerDay)) {
        averageSessionsPerDay = 0;
      }
    }
    // Trainer breakdown
    const trainerBreakdown: Record<string, number> = {};
    sessions.forEach(s => {
      const name = s.trainerName || '';
      if (name) trainerBreakdown[name] = (trainerBreakdown[name] || 0) + 1;
    });
    virtualSessions.forEach(s => {
      const name = s.trainer || '';
      if (name) trainerBreakdown[name] = (trainerBreakdown[name] || 0) + 1;
    });
    // Busiest days
    const dayCounts: Record<string, number> = {};
    allSessions.forEach(s => {
      const d = new Date(s.start || s.date);
      if (!isNaN(d.getTime())) {
        const dayStr = d.toLocaleDateString('en-CA');
        dayCounts[dayStr] = (dayCounts[dayStr] || 0) + 1;
      }
    });
    const busiestDays = Object.entries(dayCounts)
      .map(([day, count]) => ({ day, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      data: {
        labels: monthLabels,
        donePhysical: donePhysicalCounts,
        toBeHeldPhysical: toBeHeldPhysicalCounts,
        doneVirtual: doneVirtualCounts,
        toBeHeldVirtual: toBeHeldVirtualCounts,
        trainers: uniqueTrainers,
        bookings: donePhysicalCounts,
        virtualBookings: doneVirtualCounts,
        totalSessions,
        averageSessionsPerDay,
        trainerBreakdown,
        busiestDays
      }
    });
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}