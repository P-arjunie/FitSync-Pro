import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import PricingPlanPurchase from '@/models/PricingPlanPurchase';
import Enrollment from '@/models/enrollment';
import Payment from '@/models/Payment';
import { RevenueAnalyticsData, RevenueAnalyticsResponse } from '@/types/analytics';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get query parameters
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const groupBy = searchParams.get('groupBy') || 'day';
    
    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'Start and end dates are required' },
        { status: 400 }
      );
    }
    
    // Connect to MongoDB
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    // Ensure end date includes the full day
    end.setHours(23, 59, 59, 999);

    // Helper function to format dates based on groupBy
    const getDateGroupFormat = (groupBy: string) => {
      switch (groupBy) {
        case 'month':
          return '%Y-%m';
        case 'week':
          return '%Y-%U'; // Year-Week
        default:
          return '%Y-%m-%d';
      }
    };

    const dateFormat = getDateGroupFormat(groupBy);

    // Helper function to format date labels
    const formatDateLabel = (date: string, groupBy: string) => {
      if (groupBy === 'month') {
        const [year, month] = date.split('-');
        return new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { 
          month: 'short', 
          year: 'numeric' 
        });
      } else if (groupBy === 'week') {
        const [year, week] = date.split('-');
        return `Week ${week}, ${year}`;
      }
      return new Date(date).toLocaleDateString();
    };

    // Fetch data in parallel
    const [
      pricingPlanData,
      classData,
      pricingPlanBreakdown,
      classBreakdown,
      pricingPlanStatuses,
      enrollmentStatuses,
      prevPeriodData
    ] = await Promise.all([
      // Current period pricing plan revenue data
      Payment.aggregate([
        {
          $match: {
            paymentFor: 'pricing-plan',
            createdAt: { $gte: start, $lte: end },
            paymentStatus: 'succeeded'
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
            totalRevenue: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } }
      ]),
      
      // Current period class enrollment revenue data
      Payment.aggregate([
        {
          $match: {
            paymentFor: 'enrollment',
            createdAt: { $gte: start, $lte: end },
            paymentStatus: 'succeeded'
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
            totalRevenue: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } }
      ]),
      
      // Pricing plan breakdown - Get revenue by plan name
      Payment.aggregate([
        {
          $match: {
            paymentFor: 'pricing-plan',
            createdAt: { $gte: start, $lte: end },
            paymentStatus: 'succeeded',
            relatedOrderId: { $ne: null }
          }
        },
        {
          $lookup: {
            from: 'pricing_plan', // Use the correct collection name
            localField: 'relatedOrderId',
            foreignField: '_id',
            as: 'planDetails'
          }
        },
        { $unwind: '$planDetails' },
        {
          $group: {
            _id: '$planDetails.planName',
            revenue: { $sum: '$amount' },
            purchases: { $sum: 1 }
          }
        },
        { $sort: { revenue: -1 } }
      ]),
      
      // Class enrollment breakdown - Get revenue by class name
      Payment.aggregate([
        {
          $match: {
            paymentFor: 'enrollment',
            createdAt: { $gte: start, $lte: end },
            paymentStatus: 'succeeded',
            relatedEnrollmentId: { $ne: null }
          }
        },
        {
          $lookup: {
            from: 'enrollments', // Default collection name for Enrollment model
            localField: 'relatedEnrollmentId',
            foreignField: '_id',
            as: 'enrollmentDetails'
          }
        },
        { $unwind: '$enrollmentDetails' },
        {
          $group: {
            _id: '$enrollmentDetails.className',
            revenue: { $sum: '$amount' },
            enrollments: { $sum: 1 }
          }
        },
        { $sort: { revenue: -1 } }
      ]),
      
      // Pricing plan statuses - Get from PricingPlanPurchase collection
      PricingPlanPurchase.aggregate([
        { 
          $match: { 
            createdAt: { $gte: start, $lte: end }
          }
        },
        { 
          $group: { 
            _id: '$status', 
            count: { $sum: 1 } 
          } 
        }
      ]),
      
      // Enrollment statuses - Get from Enrollment collection
      Enrollment.aggregate([
        { 
          $match: { 
            createdAt: { $gte: start, $lte: end }
          }
        },
        { 
          $group: { 
            _id: '$status', 
            count: { $sum: 1 } 
          } 
        }
      ]),
      
      // Previous period comparison data
      (async () => {
        const diff = end.getTime() - start.getTime();
        const previousStart = new Date(start.getTime() - diff);
        const previousEnd = new Date(end.getTime() - diff);
        
        const [pricingRevenue, classRevenue] = await Promise.all([
          Payment.aggregate([
            {
              $match: {
                paymentFor: 'pricing-plan',
                createdAt: { $gte: previousStart, $lte: previousEnd },
                paymentStatus: 'succeeded'
              }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
          ]),
          Payment.aggregate([
            {
              $match: {
                paymentFor: 'enrollment',
                createdAt: { $gte: previousStart, $lte: previousEnd },
                paymentStatus: 'succeeded'
              }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
          ])
        ]);
        
        return {
          pricing: pricingRevenue[0]?.total || 0,
          classes: classRevenue[0]?.total || 0
        };
      })()
    ]);

    // Calculate totals
    const totalPricingPlanRevenue = pricingPlanData.reduce((sum, item) => sum + item.totalRevenue, 0);
    const totalClassRevenue = classData.reduce((sum, item) => sum + item.totalRevenue, 0);
    const overallTotalRevenue = totalPricingPlanRevenue + totalClassRevenue;

    // Get total counts
    const totalPricingPlans = pricingPlanData.reduce((sum, item) => sum + item.count, 0);
    const totalClassEnrollments = classData.reduce((sum, item) => sum + item.count, 0);

    // Prepare time-based data
    const allDates = new Set([
      ...pricingPlanData.map(item => item._id),
      ...classData.map(item => item._id)
    ]);
    
    const sortedDates = Array.from(allDates).sort();
    
    // Generate labels and revenue arrays
    const labels = sortedDates.map(date => formatDateLabel(date as string, groupBy));
    
    const pricingPlanRevenue = sortedDates.map(date => 
      pricingPlanData.find(item => item._id === date)?.totalRevenue || 0
    );
    
    const classRevenue = sortedDates.map(date => 
      classData.find(item => item._id === date)?.totalRevenue || 0
    );
    
    const totalRevenueArray = sortedDates.map((_, i) => pricingPlanRevenue[i] + classRevenue[i]);

    // Generate daily revenue data
    const dailyRevenue = sortedDates.map((date, i) => ({
      date: formatDateLabel(date as string, groupBy),
      revenue: totalRevenueArray[i],
      pricingPlans: pricingPlanData.find(item => item._id === date)?.count || 0,
      classEnrollments: classData.find(item => item._id === date)?.count || 0
    }));

    // Calculate average revenue per day
    const daysInPeriod = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const averageRevenuePerDay = overallTotalRevenue / daysInPeriod;

    // Calculate percentage changes
    const calculatePercentageChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const prevTotal = prevPeriodData.pricing + prevPeriodData.classes;

    // Format the response
    const responseData: RevenueAnalyticsData = {
      // Required core metrics
      totalRevenue: overallTotalRevenue,
      totalPricingPlans,
      totalClassEnrollments,
      averageRevenuePerDay,
      
      revenueByType: {
        'Pricing Plans': totalPricingPlanRevenue,
        'Classes': totalClassRevenue
      },
      
      dailyRevenue,
      
      // Chart data for backward compatibility
      labels,
      pricingPlanRevenue,
      classRevenue,
      totalRevenueArray,
      totalPricingPlanRevenue,
      totalClassRevenue,
      overallTotalRevenue,
      
      // Breakdown data
      pricingPlanBreakdown: pricingPlanBreakdown.map(item => ({
        planName: item._id || 'Unknown Plan',
        purchases: item.purchases,
        revenue: item.revenue
      })),
      
      classBreakdown: classBreakdown.map(item => ({
        className: item._id || 'Unknown Class',
        enrollments: item.enrollments,
        revenue: item.revenue
      })),
      
      // Status data
      pricingPlanStatuses: pricingPlanStatuses.reduce((obj, item) => ({
        ...obj,
        [item._id]: item.count
      }), {} as Record<string, number>),
      
      enrollmentStatuses: enrollmentStatuses.reduce((obj, item) => ({
        ...obj,
        [item._id]: item.count
      }), {} as Record<string, number>),
      
      // Comparison data
      comparisonToPreviousPeriod: {
        pricingPlanRevenueChange: calculatePercentageChange(totalPricingPlanRevenue, prevPeriodData.pricing),
        classRevenueChange: calculatePercentageChange(totalClassRevenue, prevPeriodData.classes),
        totalRevenueChange: calculatePercentageChange(overallTotalRevenue, prevTotal)
      }
    };
    
    return NextResponse.json({ 
      success: true, 
      data: responseData 
    } as RevenueAnalyticsResponse);
    
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch revenue analytics' 
      } as RevenueAnalyticsResponse,
      { status: 500 }
    );
  }
}