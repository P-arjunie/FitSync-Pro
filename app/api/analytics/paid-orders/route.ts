// app/api/analytics/paid-orders/route.ts
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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const category = searchParams.get('category');
    
    // Build query object - only paid orders
    const query: any = { status: 'paid' };
    
    // Add category filter if provided
    if (category && category !== 'all') {
      query['orderItems.category'] = category;
    }
    
    // Add date range filter if provided
    if (startDate || endDate) {
      query.createdAt = {};
      
      if (startDate) {
        const startDateObj = new Date(startDate);
        if (!isNaN(startDateObj.getTime())) {
          query.createdAt.$gte = startDateObj;
        }
      }
      
      if (endDate) {
        const endDateObj = new Date(endDate);
        if (!isNaN(endDateObj.getTime())) {
          endDateObj.setDate(endDateObj.getDate() + 1);
          query.createdAt.$lte = endDateObj;
        }
      }
      
      if (Object.keys(query.createdAt).length === 0) {
        delete query.createdAt;
      }
    }
    
    // Get all paid orders that match the query
    const orders = await Order.find(query).sort({ createdAt: 1 });
    
    // Get unique categories for dropdowns (only from paid orders)
    const uniqueCategories = await Order.distinct('orderItems.category', query);
    
    if (orders.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          labels: [],
          orderCounts: [],
          revenueCounts: [],
          categories: uniqueCategories,
          totalRevenue: 0,
          totalOrders: 0,
          averageOrderValue: 0,
          categoryBreakdown: {},
          topProducts: []
        }
      });
    }
    
    // Determine the date range for the chart
    let minDate = orders.length > 0 ? new Date(orders[0].createdAt) : new Date();
    let maxDate = orders.length > 0 ? new Date(orders[orders.length - 1].createdAt) : new Date();
    
    if (startDate && endDate) {
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      
      if (!isNaN(startDateObj.getTime()) && !isNaN(endDateObj.getTime())) {
        minDate = startDateObj;
        maxDate = endDateObj;
      }
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
    
    allMonths.forEach(month => {
      ordersByMonth[month] = 0;
      revenueByMonth[month] = 0;
    });
    
    orders.forEach(order => {
      const date = new Date(order.createdAt);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (ordersByMonth[monthYear] !== undefined) {
        ordersByMonth[monthYear]++;
        revenueByMonth[monthYear] += order.totalAmount;
      }
    });
    
    // Convert to array format for chart
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
        categories: uniqueCategories,
        totalRevenue,
        totalOrders,
        averageOrderValue,
        categoryBreakdown,
        topProducts
      }
    });
    
  } catch (error) {
    console.error('Error fetching paid orders analytics data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch paid orders analytics data' },
      { status: 500 }
    );
  }
}