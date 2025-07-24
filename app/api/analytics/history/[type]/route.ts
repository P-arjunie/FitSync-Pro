import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Session from "@/models/Session";
import VirtualSession from "@/models/VirtualSession";
import Payment from "@/models/Payment";
import Order from "@/models/order";
import Enrollment from "@/models/enrollment";
import PricingPlanPurchase from "@/models/PricingPlanPurchase";
import LoginHistory from "@/models/LoginHistory";
import ApprovedTrainer from "@/models/ApprovedTrainer";

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const type = params.type; // This will now correctly get the type from the URL
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');

    // Validate type parameter
    if (!type) {
      return NextResponse.json(
        { success: false, error: "Missing history type parameter" },
        { status: 400 }
      );
    }

    let query: any = {};

    // Date filtering
    if (startDate && endDate) {
      try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include the entire end date

        query.createdAt = {
          $gte: start,
          $lte: end
        };
      } catch (error) {
        console.error("Error parsing date parameters:", error);
        return NextResponse.json(
          { success: false, error: "Invalid date parameters" },
          { status: 400 }
        );
      }
    }

    // Status filtering
    if (status && status !== 'all' && status !== '') {
      query.status = status;
    }

    let data: any[] = [];
    let totalCount = 0;

    switch (type) {
      case 'sessions':
        try {
          const physicalSessions = await Session.find(query)
            .populate('trainerId', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .lean();

          const virtualSessions = await VirtualSession.find(query)
            .sort({ createdAt: -1 })
            .lean();

          // Add more robust null checks and data normalization
          const formattedPhysical = physicalSessions.map(session => ({
            ...session,
            sessionType: 'Physical',
            trainerName: session.trainerId && session.trainerId.firstName
              ? `${session.trainerId.firstName} ${session.trainerId.lastName || ''}`
              : 'Unknown Trainer',
            participants: session.currentParticipants || 0,
            maxParticipants: session.maxParticipants || 0,
            location: session.location || 'Not specified',
            // Add consistent date fields
            start: session.start || session.createdAt,
            end: session.end || null,
            date: session.start || session.createdAt,
            // Ensure createdAt is explicitly included for sorting
            createdAt: session.createdAt || new Date()
          }));

          const formattedVirtual = virtualSessions.map(session => ({
            ...session,
            sessionType: 'Virtual',
            trainerName: session.trainer && session.trainer.name
              ? session.trainer.name
              : 'Unknown Trainer',
            participants: session.participants && Array.isArray(session.participants)
              ? session.participants.length
              : 0,
            maxParticipants: session.maxParticipants || 0,
            location: 'Virtual',
            onlineLink: session.onlineLink || '#',
            // Add consistent date fields
            start: session.date || session.createdAt,
            end: session.date || session.createdAt,
            date: session.date || session.createdAt,
            // Ensure createdAt is explicitly included for sorting
            createdAt: session.createdAt || new Date()
          }));

          data = [...formattedPhysical, ...formattedVirtual]
            .sort((a, b) => {
              // Safe sorting with fallbacks
              const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return dateB - dateA;
            });

          totalCount = data.length;
        } catch (error) {
          console.error('Error fetching sessions:', error);
          data = [];
        }
        break;

      case 'payments':
        try {
          data = await Payment.find(query)
            .populate('relatedOrderId')
            .populate('relatedEnrollmentId')
            .populate('relatedPlanId')
            .sort({ createdAt: -1 })
            .lean();
          
          // Normalize payment data
          data = data.map(payment => ({
            ...payment,
            amount: payment.amount || 0,
            paymentStatus: payment.paymentStatus || 'unknown',
            paymentFor: payment.paymentFor || 'Unknown payment',
            currency: payment.currency || 'usd'
          }));
          
          totalCount = data.length;
        } catch (error) {
          console.error('Error fetching payments:', error);
          data = [];
        }
        break;

      case 'orders':
        try {
          data = await Order.find(query)
            .sort({ createdAt: -1 })
            .lean();
          
          // Normalize order data
          data = data.map(order => ({
            ...order,
            orderNumber: order.orderNumber || 'N/A',
            totalAmount: order.totalAmount || 0,
            status: order.status || 'unknown',
            orderItems: order.orderItems || []
          }));
          
          totalCount = data.length;
        } catch (error) {
          console.error('Error fetching orders:', error);
          data = [];
        }
        break;

      case 'enrollments':
        try {
          data = await Enrollment.find(query)
            .sort({ createdAt: -1 })
            .lean();
          
          // Normalize enrollment data
          data = data.map(enrollment => ({
            ...enrollment,
            className: enrollment.className || 'Unknown class',
            status: enrollment.status || 'unknown',
            totalAmount: enrollment.totalAmount || 0
          }));
          
          totalCount = data.length;
        } catch (error) {
          console.error('Error fetching enrollments:', error);
          data = [];
        }
        break;

      case 'pricing-plans':
        try {
          data = await PricingPlanPurchase.find(query)
            .sort({ createdAt: -1 })
            .lean();
          
          // Normalize pricing plan data
          data = data.map(plan => ({
            ...plan,
            planName: plan.planName || 'Unknown plan',
            amount: plan.amount || 0,
            status: plan.status || 'unknown'
          }));
          
          totalCount = data.length;
        } catch (error) {
          console.error('Error fetching pricing plans:', error);
          data = [];
        }
        break;

      case 'login-logs':
        try {
          let loginQuery = { ...query };
          if (loginQuery.createdAt) {
            loginQuery.timestamp = loginQuery.createdAt;
            delete loginQuery.createdAt;
          }

          data = await LoginHistory.find(loginQuery)
            .populate('userId', 'firstName lastName email')
            .sort({ timestamp: -1 })
            .lean();
          
          // Normalize login log data
          data = data.map(log => ({
            ...log,
            email: log.email || 'unknown@example.com',
            status: log.status || 'unknown',
            ipAddress: log.ipAddress || 'N/A',
            timestamp: log.timestamp || new Date(),
            // Ensure createdAt exists for consistent rendering
            createdAt: log.timestamp || new Date()
          }));
          
          totalCount = data.length;
        } catch (error) {
          console.error('Error fetching login logs:', error);
          data = [];
        }
        break;

      default:
        return NextResponse.json(
          { success: false, error: "Invalid history type" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data,
      total: totalCount,
      type
    });

  } catch (error: any) {
    console.error("Error fetching history data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch history data", details: error.message },
      { status: 500 }
    );
  }
}