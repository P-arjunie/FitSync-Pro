// app/api/analytics/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from "@/lib/mongodb";
import Order from '../../../models/order';

interface OrderItem {
  product?: string;
  title: string;
  category: string;
  quantity: number;
  price: number;
}

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    
    // Get query parameters for filtering
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const category = searchParams.get('category');
    
    // Build query object
    const query: any = {};
    
    // Add status filter if provided
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Add category filter if provided - THIS WAS MISSING!
    if (category && category !== 'all') {
      query['orderItems.category'] = category;
    }
    
    // Add date range filter if provided
    if (startDate || endDate) {
      query.createdAt = {};
      
      // Validate and add start date
      if (startDate) {
        const startDateObj = new Date(startDate);
        if (!isNaN(startDateObj.getTime())) {
          query.createdAt.$gte = startDateObj;
        }
      }
      
      // Validate and add end date (add one day to include the full end date)
      if (endDate) {
        const endDateObj = new Date(endDate);
        if (!isNaN(endDateObj.getTime())) {
          endDateObj.setDate(endDateObj.getDate() + 1);
          query.createdAt.$lte = endDateObj;
        }
      }
      
      // If no valid dates were added, remove the empty createdAt object
      if (Object.keys(query.createdAt).length === 0) {
        delete query.createdAt;
      }
    }
    
    // Debug: Log the query to see what's being used
    console.log('MongoDB Query:', JSON.stringify(query, null, 2));
    
    // Get all orders that match the query
    const orders = await Order.find(query).sort({ createdAt: 1 });
    
    // Get unique statuses and categories for dropdowns
    const uniqueStatuses = await Order.distinct('status');
    const uniqueCategories = await Order.distinct('orderItems.category');
    
    // If no orders found, return empty data with filter options
    if (orders.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          labels: [],
          orderCounts: [],
          revenueCounts: [],
          statuses: uniqueStatuses,
          categories: uniqueCategories,
          totalRevenue: 0,
          totalOrders: 0,
          averageOrderValue: 0,
          statusBreakdown: {},
          categoryBreakdown: {},
          topProducts: []
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
        // Fallback to order range if dates are invalid
        minDate = orders.length > 0 ? new Date(orders[0].createdAt) : new Date();
        maxDate = orders.length > 0 ? new Date(orders[orders.length - 1].createdAt) : new Date();
      }
    } else if (orders.length > 0) {
      // Use the range from the available orders
      minDate = new Date(orders[0].createdAt);
      maxDate = new Date(orders[orders.length - 1].createdAt);
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
    
    // Group orders by month
    const ordersByMonth: Record<string, number> = {};
    const revenueByMonth: Record<string, number> = {};
    
    // Initialize all months with zero counts
    allMonths.forEach(month => {
      ordersByMonth[month] = 0;
      revenueByMonth[month] = 0;
    });
    
    // Count orders and revenue by month
    orders.forEach(order => {
      const date = new Date(order.createdAt);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (ordersByMonth[monthYear] !== undefined) {
        ordersByMonth[monthYear]++;
        revenueByMonth[monthYear] += order.totalAmount;
      }
    });
    
    // Convert to array format for chart (ensure consistent order)
    const months = allMonths.sort();
    const orderCounts = months.map(month => ordersByMonth[month]);
    const revenueCounts = months.map(month => revenueByMonth[month]);
    
    // Format month labels for display
    const monthLabels = months.map(month => {
      const [year, monthNum] = month.split('-');
      const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
      return date.toLocaleString('default', { month: 'long', year: 'numeric' });
    });
    
    // Calculate summary statistics
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Status breakdown
    const statusBreakdown: Record<string, number> = {};
    orders.forEach(order => {
      statusBreakdown[order.status] = (statusBreakdown[order.status] || 0) + 1;
    });
    
    // Category breakdown (from order items)
    const categoryBreakdown: Record<string, number> = {};
    const productSales: Record<string, { count: number; revenue: number; title: string }> = {};
    
    orders.forEach(order => {
      (order.orderItems as OrderItem[]).forEach(item => {
        // Category breakdown
        categoryBreakdown[item.category] = (categoryBreakdown[item.category] || 0) + item.quantity;

        // Product sales tracking
        const productKey = item.product?.toString() || item.title;
        if (!productSales[productKey]) {
          productSales[productKey] = { count: 0, revenue: 0, title: item.title };
        }
        productSales[productKey].count += item.quantity;
        productSales[productKey].revenue += item.price * item.quantity;
      });
    });
    
    // Top products by revenue
    const topProducts = Object.entries(productSales)
      .map(([key, data]) => ({
        title: data.title,
        count: data.count,
        revenue: data.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
    
    return NextResponse.json({
      success: true,
      data: {
        labels: monthLabels,
        orderCounts: orderCounts,
        revenueCounts: revenueCounts,
        statuses: uniqueStatuses,
        categories: uniqueCategories,
        totalRevenue,
        totalOrders,
        averageOrderValue,
        statusBreakdown,
        categoryBreakdown,
        topProducts
      }
    });
    
  } catch (error) {
    console.error('Error fetching order analytics data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch order analytics data' },
      { status: 500 }
    );
  }
}