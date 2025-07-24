import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Session from "@/models/Session";
import VirtualSession from "@/models/VirtualSession";
import Payment from "@/models/Payment";
import Order from "@/models/order";
import Enrollment from "@/models/enrollment";
import PricingPlanPurchase from "@/models/PricingPlanPurchase";
import LoginHistory from "@/models/LoginHistory";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
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
    let title = '';

    switch (type) {
      case 'sessions':
        title = 'Sessions History';
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
        title = 'Payments History';
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
        title = 'Orders History';
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
        title = 'Enrollments History';
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
        title = 'Pricing Plans History';
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
        title = 'Login History';
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

    // Generate PDF
    try {
      const pdfBuffer = await generateHistoryPDF(type, title, data);
      
      // Return PDF as a blob
      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename=${type}-history-${new Date().toISOString().split('T')[0]}.pdf`
        }
      });
    } catch (pdfError: any) {
      console.error("Error generating PDF:", pdfError);
      return NextResponse.json(
        { success: false, error: "Failed to generate PDF", details: pdfError.message },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error("Error fetching history data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch history data", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Generate PDF from history data
 */
async function generateHistoryPDF(type: string, title: string, historyData: any[]): Promise<Buffer> {
  // Create a new PDF document
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  // Add date range if available
  doc.setFontSize(12);
  const dateStr = `Generated on: ${new Date().toLocaleDateString()}`;
  doc.text(dateStr, 14, 30);
  
  // Add total count
  doc.setFontSize(14);
  doc.text(`Total Records: ${historyData.length}`, 14, 40);
  
  let yPos = 50;
  
  // Add detailed data table
  if (historyData && historyData.length > 0) {
    // Create table columns and rows based on history type
    let columns: any[] = [];
    let rows: any[] = [];
    
    switch (type) {
      case 'sessions':
        columns = [
          { header: 'Type', dataKey: 'sessionType' },
          { header: 'Trainer', dataKey: 'trainerName' },
          { header: 'Status', dataKey: 'status' },
          { header: 'Participants', dataKey: 'participants' },
          { header: 'Date', dataKey: 'date' }
        ];
        
        rows = historyData.map((session: any) => ({
          sessionType: session.sessionType || 'Physical',
          trainerName: session.trainerName || 'Unknown',
          status: session.status || 'Unknown',
          participants: `${session.participants || 0}/${session.maxParticipants || 0}`,
          date: formatDate(session.date || session.start || session.createdAt)
        }));
        break;
        
      case 'payments':
        columns = [
          { header: 'Payment For', dataKey: 'paymentFor' },
          { header: 'Amount', dataKey: 'amount' },
          { header: 'Status', dataKey: 'status' },
          { header: 'Date', dataKey: 'date' }
        ];
        
        rows = historyData.map((payment: any) => ({
          paymentFor: payment.paymentFor || 'Unknown',
          amount: `$${(payment.amount || 0).toFixed(2)}`,
          status: payment.paymentStatus || 'Unknown',
          date: formatDate(payment.createdAt)
        }));
        break;
        
      case 'orders':
        columns = [
          { header: 'Order #', dataKey: 'orderNumber' },
          { header: 'Items', dataKey: 'items' },
          { header: 'Amount', dataKey: 'amount' },
          { header: 'Status', dataKey: 'status' },
          { header: 'Date', dataKey: 'date' }
        ];
        
        rows = historyData.map((order: any) => ({
          orderNumber: order.orderNumber || 'N/A',
          items: order.orderItems && Array.isArray(order.orderItems) ? order.orderItems.length : 0,
          amount: `$${(order.totalAmount || 0).toFixed(2)}`,
          status: order.status || 'Unknown',
          date: formatDate(order.createdAt)
        }));
        break;
        
      case 'enrollments':
        columns = [
          { header: 'Class', dataKey: 'className' },
          { header: 'User ID', dataKey: 'userId' },
          { header: 'Amount', dataKey: 'amount' },
          { header: 'Status', dataKey: 'status' },
          { header: 'Date', dataKey: 'date' }
        ];
        
        rows = historyData.map((enrollment: any) => ({
          className: enrollment.className || 'Unknown',
          userId: enrollment.userId || 'Unknown',
          amount: `$${(enrollment.totalAmount || 0).toFixed(2)}`,
          status: enrollment.status || 'Unknown',
          date: formatDate(enrollment.createdAt)
        }));
        break;
        
      case 'pricing-plans':
        columns = [
          { header: 'Plan', dataKey: 'planName' },
          { header: 'User ID', dataKey: 'userId' },
          { header: 'Amount', dataKey: 'amount' },
          { header: 'Status', dataKey: 'status' },
          { header: 'Date', dataKey: 'date' }
        ];
        
        rows = historyData.map((plan: any) => ({
          planName: plan.planName || 'Unknown',
          userId: plan.userId || 'Unknown',
          amount: `$${(plan.amount || 0).toFixed(2)}`,
          status: plan.status || 'Unknown',
          date: formatDate(plan.createdAt)
        }));
        break;
        
      case 'login-logs':
        columns = [
          { header: 'Email', dataKey: 'email' },
          { header: 'Status', dataKey: 'status' },
          { header: 'IP Address', dataKey: 'ipAddress' },
          { header: 'Date', dataKey: 'date' }
        ];
        
        rows = historyData.map((log: any) => ({
          email: log.email || 'Unknown',
          status: log.status || 'Unknown',
          ipAddress: log.ipAddress || 'N/A',
          date: formatDate(log.timestamp || log.createdAt)
        }));
        break;
    }
    
    // Add the table to the PDF
    autoTable(doc, {
      startY: yPos,
      head: [columns.map(col => col.header)],
      body: rows.map(row => columns.map(col => row[col.dataKey])),
      margin: { top: 10 },
      styles: { overflow: 'linebreak' },
      headStyles: { fillColor: [41, 128, 185] } // A blue color for the header
    });
  }
  
  // Convert the PDF to a buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return pdfBuffer;
}

/**
 * Format date for PDF display
 */
function formatDate(dateString: string | Date | undefined | null): string {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString();
  } catch (error) {
    console.error('Invalid date:', dateString);
    return 'Invalid date';
  }
}