// app/api/analytics/sessions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from "@/lib/mongodb";
import Session from '@/models/Session';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    
    // Get query parameters for filtering
    const trainer = searchParams.get('trainer');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Build query object
    const query: any = {};
    
    // Add trainer filter if provided
    if (trainer && trainer !== 'all') {
      query.trainerName = trainer;
    }
    
    // Add date range filter if provided
    if (startDate || endDate) {
      query.start = {};
      
      // Validate and add start date
      if (startDate) {
        const startDateObj = new Date(startDate);
        if (!isNaN(startDateObj.getTime())) {
          query.start.$gte = startDateObj;
        }
      }
      
      // Validate and add end date (add one day to include the full end date)
      if (endDate) {
        const endDateObj = new Date(endDate);
        if (!isNaN(endDateObj.getTime())) {
          endDateObj.setDate(endDateObj.getDate() + 1);
          query.start.$lte = endDateObj;
        }
      }
      
      // If no valid dates were added, remove the empty start object
      if (Object.keys(query.start).length === 0) {
        delete query.start;
      }
    }
    
    // Get all sessions that match the query
    const sessions = await Session.find(query).sort({ start: 1 });
    
    // Get unique trainers for dropdown (always fetch all trainers regardless of filters)
    const uniqueTrainers = await Session.distinct('trainerName');
    
    // If no sessions found, return empty data with trainers list
    if (sessions.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          labels: [],
          bookings: [],
          trainers: uniqueTrainers
        }
      });
    }
    
    // Determine the date range for the chart
    let minDate, maxDate;
    
    if (startDate && endDate) {
      // Use provided date range
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      
      // Validate dates
      if (!isNaN(startDateObj.getTime()) && !isNaN(endDateObj.getTime())) {
        minDate = startDateObj;
        maxDate = endDateObj;
      } else {
        // Fallback to session range if dates are invalid
        minDate = sessions.length > 0 ? new Date(sessions[0].start) : new Date();
        maxDate = sessions.length > 0 ? new Date(sessions[sessions.length - 1].start) : new Date();
      }
    } else if (sessions.length > 0) {
      // Use the range from the available sessions
      minDate = new Date(sessions[0].start);
      maxDate = new Date(sessions[sessions.length - 1].start);
    } else {
      // Fallback to current month
      const now = new Date();
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
    
    // Group sessions by month
    const sessionsByMonth: Record<string, number> = {};
    
    // Initialize all months with zero counts
    allMonths.forEach(month => {
      sessionsByMonth[month] = 0;
    });
    
    // Count sessions by month
    sessions.forEach(session => {
      const date = new Date(session.start);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (sessionsByMonth[monthYear] !== undefined) {
        sessionsByMonth[monthYear]++;
      }
    });
    
    // Convert to array format for chart (ensure consistent order)
    const months = allMonths.sort();
    const bookingCounts = months.map(month => sessionsByMonth[month]);
    
    // Format month labels for display (e.g., "2023-01" to "January 2023")
    const monthLabels = months.map(month => {
      const [year, monthNum] = month.split('-');
      const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
      return date.toLocaleString('default', { month: 'long', year: 'numeric' });
    });
    
    return NextResponse.json({
      success: true,
      data: {
        labels: monthLabels,
        bookings: bookingCounts,
        trainers: uniqueTrainers
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