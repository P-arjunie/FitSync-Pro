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

    // Helper function to format dates
    const formatDate = (date: Date) => {
      if (groupBy === 'month') {
        return date.toLocaleString('default', { month: 'short', year: 'numeric' });
      } else if (groupBy === 'week') {
        const weekNumber = Math.ceil(date.getDate() / 7);
        return `Week ${weekNumber}, ${date.toLocaleString('default', { month: 'short', year: 'numeric' })}`;
      }
      return date.toLocaleDateString();
    };

    // Fetch data in parallel
    const [
      pricingPlanPayments,
      classPayments,
      pricingPlanBreakdown,
      classBreakdown,
      pricingPlanStatuses,
      enrollmentStatuses,
      prevPeriodData
    ] = await Promise.all([
      // Current period pricing plan payments
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
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            totalRevenue: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } }
      ]),
      
      // Current period class payments
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
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            totalRevenue: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } }
      ]),
      
      // Pricing plan breakdown - fixed to use correct relationship
      PricingPlanPurchase.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end }
          }
        },
        {
          $lookup: {
            from: 'kalana_paymentsses',
            localField: '_id',
            foreignField: 'relatedOrderId',
            as: 'payments'
          }
        },
        { $unwind: '$payments' },
        {
          $match: {
            'payments.paymentStatus': 'succeeded'
          }
        },
        {
          $group: {
            _id: '$planName',
            revenue: { $sum: '$payments.amount' },
            purchases: { $sum: 1 }
          }
        },
        { $sort: { revenue: -1 } }
      ]),
      
      // Class breakdown
      Enrollment.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end }
          }
        },
        {
          $lookup: {
            from: 'kalana_paymentsses',
            localField: '_id',
            foreignField: 'relatedEnrollmentId',
            as: 'payments'
          }
        },
        { $unwind: '$payments' },
        {
          $match: {
            'payments.paymentStatus': 'succeeded'
          }
        },
        {
          $group: {
            _id: '$className',
            revenue: { $sum: '$payments.amount' },
            enrollments: { $sum: 1 }
          }
        },
        { $sort: { revenue: -1 } }
      ]),
      
      // Pricing plan statuses
      PricingPlanPurchase.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } }},
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      
      // Enrollment statuses
      Enrollment.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } }},
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      
      // Previous period data
      (async () => {
        const previousStart = new Date(start);
        const previousEnd = new Date(end);
        const diff = end.getTime() - start.getTime();
        previousStart.setTime(previousStart.getTime() - diff);
        previousEnd.setTime(previousEnd.getTime() - diff);
        
        const [pricing, classes] = await Promise.all([
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
          pricing: pricing[0]?.total || 0,
          classes: classes[0]?.total || 0
        };
      })()
    ]);

    // Calculate totals
    const totalPricingPlanRevenue = pricingPlanPayments.reduce((sum, item) => sum + item.totalRevenue, 0);
    const totalClassRevenue = classPayments.reduce((sum, item) => sum + item.totalRevenue, 0);
    const overallTotalRevenue = totalPricingPlanRevenue + totalClassRevenue;

    // Prepare time-based data
    const allDates = new Set([
      ...pricingPlanPayments.map(item => item._id),
      ...classPayments.map(item => item._id)
    ]);
    
    const sortedDates = Array.from(allDates).sort();
    const labels = sortedDates.map(date => formatDate(new Date(date as string)));
    
    const pricingPlanRevenue = sortedDates.map(date => 
      pricingPlanPayments.find(item => item._id === date)?.totalRevenue || 0
    );
    
    const classRevenue = sortedDates.map(date => 
      classPayments.find(item => item._id === date)?.totalRevenue || 0
    );
    
    const totalRevenueArray = sortedDates.map((_, i) => pricingPlanRevenue[i] + classRevenue[i]);

    // Format the response
    const responseData: RevenueAnalyticsData = {
      // Required fields
      totalRevenue: overallTotalRevenue,
      totalPricingPlans: pricingPlanPayments.reduce((sum, item) => sum + item.count, 0),
      totalClassEnrollments: classPayments.reduce((sum, item) => sum + item.count, 0),
      averageRevenuePerDay: sortedDates.length > 0 ? overallTotalRevenue / sortedDates.length : 0,
      
      revenueByType: {
        'Pricing Plans': totalPricingPlanRevenue,
        'Classes': totalClassRevenue
      },
      
      dailyRevenue: sortedDates.map((date, i) => ({
        date: formatDate(new Date(date as string)),
        revenue: totalRevenueArray[i],
        pricingPlans: pricingPlanPayments.find(item => item._id === date)?.count || 0,
        classEnrollments: classPayments.find(item => item._id === date)?.count || 0
      })),
      
      // Optional chart data
      labels,
      pricingPlanRevenue,
      classRevenue,
      totalRevenueArray,
      totalPricingPlanRevenue,
      totalClassRevenue,
      overallTotalRevenue,
      pricingPlanBreakdown: pricingPlanBreakdown.map(item => ({
        planName: item._id,
        purchases: item.purchases,
        revenue: item.revenue
      })),
      classBreakdown: classBreakdown.map(item => ({
        className: item._id,
        enrollments: item.enrollments,
        revenue: item.revenue
      })),
      pricingPlanStatuses: pricingPlanStatuses.reduce((obj, item) => ({
        ...obj,
        [item._id]: item.count
      }), {} as Record<string, number>),
      enrollmentStatuses: enrollmentStatuses.reduce((obj, item) => ({
        ...obj,
        [item._id]: item.count
      }), {} as Record<string, number>),
      comparisonToPreviousPeriod: {
        pricingPlanRevenueChange: prevPeriodData.pricing > 0 
          ? ((totalPricingPlanRevenue - prevPeriodData.pricing) / prevPeriodData.pricing) * 100 
          : totalPricingPlanRevenue > 0 ? 100 : 0,
        classRevenueChange: prevPeriodData.classes > 0 
          ? ((totalClassRevenue - prevPeriodData.classes) / prevPeriodData.classes) * 100 
          : totalClassRevenue > 0 ? 100 : 0,
        totalRevenueChange: (prevPeriodData.pricing + prevPeriodData.classes) > 0 
          ? ((overallTotalRevenue - (prevPeriodData.pricing + prevPeriodData.classes)) / 
             (prevPeriodData.pricing + prevPeriodData.classes)) * 100 
          : overallTotalRevenue > 0 ? 100 : 0
      }
    };
    
    return NextResponse.json({ success: true, data: responseData } as RevenueAnalyticsResponse);
    
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch revenue analytics' } as RevenueAnalyticsResponse,
      { status: 500 }
    );
  }
}