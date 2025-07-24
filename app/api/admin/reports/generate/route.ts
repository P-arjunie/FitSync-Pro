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

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const { reportType, dateRange, filters, format = "json" } = body;
    
    if (!reportType) {
      return NextResponse.json(
        { success: false, error: "Missing report type" },
        { status: 400 }
      );
    }
    
    // Validate format
    if (format !== "json" && format !== "pdf") {
      return NextResponse.json(
        { success: false, error: "Invalid format. Supported formats: json, pdf" },
        { status: 400 }
      );
    }
    
    // Build query based on date range and filters
    let query: any = {};
    
    // Date filtering
    if (dateRange && dateRange.start && dateRange.end) {
      try {
        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);
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
    if (filters && filters.status && filters.status !== 'all' && filters.status !== '') {
      query.status = filters.status;
    }
    
    let reportData: any = {
      data: []
    };
    
    switch (reportType) {
      case 'sessions':
        try {
          const physicalSessions = await Session.find(query)
            .populate('trainerId', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .lean();
            
          const virtualSessions = await VirtualSession.find(query)
            .sort({ createdAt: -1 })
            .lean();
            
          // Format sessions data
          const formattedPhysical = physicalSessions.map(session => ({
            ...session,
            sessionType: 'Physical',
            trainerName: session.trainerId && session.trainerId.firstName
              ? `${session.trainerId.firstName} ${session.trainerId.lastName || ''}`
              : 'Unknown Trainer',
            participants: session.currentParticipants || 0,
            maxParticipants: session.maxParticipants || 0,
            location: session.location || 'Not specified',
            start: session.start || session.createdAt,
            end: session.end || null,
            date: session.start || session.createdAt,
            createdAt: session.createdAt || new Date(),
            status: session.status || 'active'
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
            start: session.date || session.createdAt,
            end: session.date || session.createdAt,
            date: session.date || session.createdAt,
            createdAt: session.createdAt || new Date(),
            status: session.status || 'active'
          }));
          
          const allSessions = [...formattedPhysical, ...formattedVirtual]
            .sort((a, b) => {
              const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return dateB - dateA;
            });
            
          // Calculate statistics
          const totalSessions = allSessions.length;
          const activeCount = allSessions.filter(s => s.status === 'active').length;
          const completedCount = allSessions.filter(s => s.status === 'completed').length;
          const cancelledCount = allSessions.filter(s => s.status === 'cancelled').length;
          const physicalCount = formattedPhysical.length;
          const virtualCount = formattedVirtual.length;
          
          reportData = {
            totalSessions,
            sessionStats: {
              active: activeCount,
              completed: completedCount,
              cancelled: cancelledCount,
              physical: physicalCount,
              virtual: virtualCount
            },
            data: allSessions
          };
        } catch (error) {
          console.error('Error generating sessions report:', error);
          return NextResponse.json(
            { success: false, error: "Failed to generate sessions report" },
            { status: 500 }
          );
        }
        break;
        
      case 'payments':
        try {
          const payments = await Payment.find(query)
            .populate('relatedOrderId')
            .populate('relatedEnrollmentId')
            .populate('relatedPlanId')
            .sort({ createdAt: -1 })
            .lean();
            
          // Normalize payment data
          const formattedPayments = payments.map(payment => ({
            ...payment,
            amount: payment.amount || 0,
            paymentStatus: payment.paymentStatus || 'unknown',
            paymentFor: payment.paymentFor || 'Unknown payment',
            currency: payment.currency || 'usd'
          }));
          
          // Calculate statistics
          const totalPayments = formattedPayments.length;
          const totalRevenue = formattedPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
          const succeededCount = formattedPayments.filter(p => p.paymentStatus === 'succeeded').length;
          const pendingCount = formattedPayments.filter(p => p.paymentStatus === 'pending').length;
          const failedCount = formattedPayments.filter(p => p.paymentStatus === 'failed').length;
          
          reportData = {
            totalPayments,
            totalRevenue,
            paymentStats: {
              succeeded: succeededCount,
              pending: pendingCount,
              failed: failedCount
            },
            data: formattedPayments
          };
        } catch (error) {
          console.error('Error generating payments report:', error);
          return NextResponse.json(
            { success: false, error: "Failed to generate payments report" },
            { status: 500 }
          );
        }
        break;
        
      case 'orders':
        try {
          const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .lean();
            
          // Normalize order data
          const formattedOrders = orders.map(order => ({
            ...order,
            orderNumber: order.orderNumber || 'N/A',
            totalAmount: order.totalAmount || 0,
            status: order.status || 'unknown',
            orderItems: order.orderItems || []
          }));
          
          // Calculate statistics
          const totalOrders = formattedOrders.length;
          const totalRevenue = formattedOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
          const completedCount = formattedOrders.filter(o => o.status === 'completed').length;
          const pendingCount = formattedOrders.filter(o => o.status === 'pending').length;
          const shippedCount = formattedOrders.filter(o => o.status === 'shipped').length;
          const cancelledCount = formattedOrders.filter(o => o.status === 'cancelled').length;
          
          reportData = {
            totalOrders,
            totalRevenue,
            orderStats: {
              completed: completedCount,
              pending: pendingCount,
              shipped: shippedCount,
              cancelled: cancelledCount
            },
            data: formattedOrders
          };
        } catch (error) {
          console.error('Error generating orders report:', error);
          return NextResponse.json(
            { success: false, error: "Failed to generate orders report" },
            { status: 500 }
          );
        }
        break;
        
      case 'enrollments':
        try {
          const enrollments = await Enrollment.find(query)
            .sort({ createdAt: -1 })
            .lean();
            
          // Normalize enrollment data
          const formattedEnrollments = enrollments.map(enrollment => ({
            ...enrollment,
            className: enrollment.className || 'Unknown class',
            status: enrollment.status || 'unknown',
            totalAmount: enrollment.totalAmount || 0
          }));
          
          // Calculate statistics
          const totalEnrollments = formattedEnrollments.length;
          const totalRevenue = formattedEnrollments.reduce((sum, enrollment) => sum + (enrollment.totalAmount || 0), 0);
          const activeCount = formattedEnrollments.filter(e => e.status === 'active').length;
          const pendingCount = formattedEnrollments.filter(e => e.status === 'pending').length;
          const cancelledCount = formattedEnrollments.filter(e => e.status === 'cancelled').length;
          
          reportData = {
            totalEnrollments,
            totalRevenue,
            enrollmentStats: {
              active: activeCount,
              pending: pendingCount,
              cancelled: cancelledCount
            },
            data: formattedEnrollments
          };
        } catch (error) {
          console.error('Error generating enrollments report:', error);
          return NextResponse.json(
            { success: false, error: "Failed to generate enrollments report" },
            { status: 500 }
          );
        }
        break;
        
      case 'pricing-plans':
        try {
          const plans = await PricingPlanPurchase.find(query)
            .sort({ createdAt: -1 })
            .lean();
            
          // Normalize pricing plan data
          const formattedPlans = plans.map(plan => ({
            ...plan,
            planName: plan.planName || 'Unknown plan',
            amount: plan.amount || 0,
            status: plan.status || 'unknown'
          }));
          
          // Calculate statistics
          const totalPlans = formattedPlans.length;
          const totalRevenue = formattedPlans.reduce((sum, plan) => sum + (plan.amount || 0), 0);
          const activeCount = formattedPlans.filter(p => p.status === 'active').length;
          const pendingCount = formattedPlans.filter(p => p.status === 'pending').length;
          const cancelledCount = formattedPlans.filter(p => p.status === 'cancelled').length;
          
          reportData = {
            totalPlans,
            totalRevenue,
            planStats: {
              active: activeCount,
              pending: pendingCount,
              cancelled: cancelledCount
            },
            data: formattedPlans
          };
        } catch (error) {
          console.error('Error generating pricing plans report:', error);
          return NextResponse.json(
            { success: false, error: "Failed to generate pricing plans report" },
            { status: 500 }
          );
        }
        break;
        
      case 'login-logs':
        try {
          let loginQuery = { ...query };
          if (loginQuery.createdAt) {
            loginQuery.timestamp = loginQuery.createdAt;
            delete loginQuery.createdAt;
          }
          
          const logs = await LoginHistory.find(loginQuery)
            .populate('userId', 'firstName lastName email')
            .sort({ timestamp: -1 })
            .lean();
            
          // Normalize login log data
          const formattedLogs = logs.map(log => ({
            ...log,
            email: log.email || 'unknown@example.com',
            status: log.status || 'unknown',
            ipAddress: log.ipAddress || 'N/A',
            timestamp: log.timestamp || new Date(),
            createdAt: log.timestamp || new Date()
          }));
          
          // Calculate statistics
          const totalLogs = formattedLogs.length;
          const successCount = formattedLogs.filter(l => l.status === 'success').length;
          const failedCount = formattedLogs.filter(l => l.status === 'failed').length;
          
          reportData = {
            totalLogs,
            loginStats: {
              success: successCount,
              failed: failedCount
            },
            data: formattedLogs
          };
        } catch (error) {
          console.error('Error generating login logs report:', error);
          return NextResponse.json(
            { success: false, error: "Failed to generate login logs report" },
            { status: 500 }
          );
        }
        break;
        
      default:
        return NextResponse.json(
          { success: false, error: "Invalid report type" },
          { status: 400 }
        );
    }
    
    // If PDF format is requested, generate PDF
    if (format === "pdf") {
      try {
        const pdfBuffer = await generatePDF(reportType, reportData);
        
        // Return PDF as a blob
        return new NextResponse(pdfBuffer, {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=${reportType}-report-${new Date().toISOString().split('T')[0]}.pdf`
          }
        });
      } catch (pdfError: any) {
        console.error("Error generating PDF:", pdfError);
        return NextResponse.json(
          { success: false, error: "Failed to generate PDF", details: pdfError.message },
          { status: 500 }
        );
      }
    }
    
    // Default: Return JSON
    return NextResponse.json({
      success: true,
      reportData
    });
    
  } catch (error: any) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate report", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Generate PDF from report data
 */
async function generatePDF(reportType: string, reportData: any): Promise<Buffer> {
  // Create a new PDF document
  const doc = new jsPDF();
  
  // Add title
  const title = `${reportType.charAt(0).toUpperCase() + reportType.slice(1).replace(/-/g, ' ')} Report`;
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  // Add date range if available
  doc.setFontSize(12);
  const dateStr = `Generated on: ${new Date().toLocaleDateString()}`;
  doc.text(dateStr, 14, 30);
  
  // Add summary section
  doc.setFontSize(14);
  doc.text("Summary", 14, 40);
  
  let yPos = 50;
  
  // Add summary data based on report type
  switch (reportType) {
    case 'sessions':
      doc.setFontSize(10);
      doc.text(`Total Sessions: ${reportData.totalSessions || 0}`, 14, yPos);
      yPos += 6;
      if (reportData.sessionStats) {
        doc.text(`Active: ${reportData.sessionStats.active || 0}`, 14, yPos);
        yPos += 6;
        doc.text(`Completed: ${reportData.sessionStats.completed || 0}`, 14, yPos);
        yPos += 6;
        doc.text(`Cancelled: ${reportData.sessionStats.cancelled || 0}`, 14, yPos);
        yPos += 6;
        doc.text(`Physical: ${reportData.sessionStats.physical || 0}`, 14, yPos);
        yPos += 6;
        doc.text(`Virtual: ${reportData.sessionStats.virtual || 0}`, 14, yPos);
      }
      break;
      
    case 'payments':
      doc.setFontSize(10);
      doc.text(`Total Payments: ${reportData.totalPayments || 0}`, 14, yPos);
      yPos += 6;
      doc.text(`Total Revenue: $${(reportData.totalRevenue || 0).toFixed(2)}`, 14, yPos);
      yPos += 6;
      if (reportData.paymentStats) {
        doc.text(`Succeeded: ${reportData.paymentStats.succeeded || 0}`, 14, yPos);
        yPos += 6;
        doc.text(`Pending: ${reportData.paymentStats.pending || 0}`, 14, yPos);
        yPos += 6;
        doc.text(`Failed: ${reportData.paymentStats.failed || 0}`, 14, yPos);
      }
      break;
      
    case 'orders':
      doc.setFontSize(10);
      doc.text(`Total Orders: ${reportData.totalOrders || 0}`, 14, yPos);
      yPos += 6;
      doc.text(`Total Revenue: $${(reportData.totalRevenue || 0).toFixed(2)}`, 14, yPos);
      yPos += 6;
      if (reportData.orderStats) {
        doc.text(`Completed: ${reportData.orderStats.completed || 0}`, 14, yPos);
        yPos += 6;
        doc.text(`Pending: ${reportData.orderStats.pending || 0}`, 14, yPos);
        yPos += 6;
        doc.text(`Shipped: ${reportData.orderStats.shipped || 0}`, 14, yPos);
        yPos += 6;
        doc.text(`Cancelled: ${reportData.orderStats.cancelled || 0}`, 14, yPos);
      }
      break;
      
    case 'enrollments':
      doc.setFontSize(10);
      doc.text(`Total Enrollments: ${reportData.totalEnrollments || 0}`, 14, yPos);
      yPos += 6;
      doc.text(`Total Revenue: $${(reportData.totalRevenue || 0).toFixed(2)}`, 14, yPos);
      yPos += 6;
      if (reportData.enrollmentStats) {
        doc.text(`Active: ${reportData.enrollmentStats.active || 0}`, 14, yPos);
        yPos += 6;
        doc.text(`Pending: ${reportData.enrollmentStats.pending || 0}`, 14, yPos);
        yPos += 6;
        doc.text(`Cancelled: ${reportData.enrollmentStats.cancelled || 0}`, 14, yPos);
      }
      break;
      
    case 'pricing-plans':
      doc.setFontSize(10);
      doc.text(`Total Plans: ${reportData.totalPlans || 0}`, 14, yPos);
      yPos += 6;
      doc.text(`Total Revenue: $${(reportData.totalRevenue || 0).toFixed(2)}`, 14, yPos);
      yPos += 6;
      if (reportData.planStats) {
        doc.text(`Active: ${reportData.planStats.active || 0}`, 14, yPos);
        yPos += 6;
        doc.text(`Pending: ${reportData.planStats.pending || 0}`, 14, yPos);
        yPos += 6;
        doc.text(`Cancelled: ${reportData.planStats.cancelled || 0}`, 14, yPos);
      }
      break;
      
    case 'login-logs':
      doc.setFontSize(10);
      doc.text(`Total Logs: ${reportData.totalLogs || 0}`, 14, yPos);
      yPos += 6;
      if (reportData.loginStats) {
        doc.text(`Success: ${reportData.loginStats.success || 0}`, 14, yPos);
        yPos += 6;
        doc.text(`Failed: ${reportData.loginStats.failed || 0}`, 14, yPos);
      }
      break;
  }
  
  yPos += 10;
  
  // Add detailed data table
  if (reportData.data && reportData.data.length > 0) {
    doc.setFontSize(14);
    doc.text("Detailed Data", 14, yPos);
    yPos += 10;
    
    // Create table columns and rows based on report type
    let columns: any[] = [];
    let rows: any[] = [];
    
    switch (reportType) {
      case 'sessions':
        columns = [
          { header: 'Type', dataKey: 'sessionType' },
          { header: 'Trainer', dataKey: 'trainerName' },
          { header: 'Status', dataKey: 'status' },
          { header: 'Participants', dataKey: 'participants' },
          { header: 'Date', dataKey: 'date' }
        ];
        
        rows = reportData.data.map((session: any) => ({
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
        
        rows = reportData.data.map((payment: any) => ({
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
        
        rows = reportData.data.map((order: any) => ({
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
        
        rows = reportData.data.map((enrollment: any) => ({
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
        
        rows = reportData.data.map((plan: any) => ({
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
        
        rows = reportData.data.map((log: any) => ({
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
      headStyles: { fillColor: [220, 50, 50] }
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