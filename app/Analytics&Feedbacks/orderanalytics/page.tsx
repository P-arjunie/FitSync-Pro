/* eslint-disable prefer-const */
'use client';

import React, { useEffect, useState, useCallback, useMemo } from "react";
import OrderAnalyticsDashboard from "../../Components/analytics/OrderAnalyticsDashboard";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import AnalyticsSidebar from "../../Components/analytics/AnalyticsSidebar";
import autotable from "jspdf-autotable";

interface OrderAnalyticsData {
  labels: string[];
  orderCounts: number[];
  revenueCounts: number[];
  statuses: string[];
  categories: string[];
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  statusBreakdown: Record<string, number>;
  categoryBreakdown: Record<string, number>;
  topProducts: Array<{
    title: string;
    count: number;
    revenue: number;
  }>;
}

interface FilterState {
  status: string;
  category: string;
  startDate: string;
  endDate: string;
}

const OrderAnalyticsPage: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<OrderAnalyticsData>({
    labels: [],
    orderCounts: [],
    revenueCounts: [],
    statuses: [],
    categories: [],
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    statusBreakdown: {},
    categoryBreakdown: {},
    topProducts: []
  });
  
  const [filters, setFilters] = useState<FilterState>({
    status: "all",
    category: "all",
    startDate: "",
    endDate: ""
  });
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reportFormat, setReportFormat] = useState<string>("pdf");
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
  // Order history state
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [historyStartDate, setHistoryStartDate] = useState<string>("");
  const [historyEndDate, setHistoryEndDate] = useState<string>("");
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Fetch order history with date filter using /api/analytics/orders
  const fetchOrderHistory = useCallback(async () => {
    if (!historyStartDate || !historyEndDate) return;
    setIsLoadingHistory(true);
    setHistoryError(null);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append("startDate", historyStartDate);
      queryParams.append("endDate", historyEndDate);
      // Optionally filter by status/category if needed
      queryParams.append("history", "true"); // Custom flag to indicate history request
      const response = await fetch(`/api/analytics/orders?${queryParams.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch order history`);
      }
      const result = await response.json();
      // Accept either result.data.history (preferred) or result.data.orders/rawOrders
      let historyArr = [];
      if (Array.isArray(result.data?.history)) {
        historyArr = result.data.history;
      } else if (Array.isArray(result.data?.orders)) {
        historyArr = result.data.orders;
      } else if (Array.isArray(result.data)) {
        historyArr = result.data;
      } else if (Array.isArray(result.orders)) {
        historyArr = result.orders;
      }
      setOrderHistory(historyArr);
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : "Failed to fetch order history");
      setOrderHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [historyStartDate, historyEndDate]);

  // Fetch history when dates change
  useEffect(() => {
    if (historyStartDate && historyEndDate) fetchOrderHistory();
  }, [historyStartDate, historyEndDate, fetchOrderHistory]);

  // PDF report for history
  const generateHistoryPDF = useCallback(() => {
    if (!orderHistory.length) return;
    setIsGeneratingReport(true);
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.setTextColor('#dc2626');
      doc.text("Order History Report", 20, 20);
      doc.setFontSize(12);
      doc.setTextColor('#1e293b');
      doc.text(`Date Range: ${historyStartDate} to ${historyEndDate}`, 20, 30);
      doc.setFontSize(14);
      doc.setTextColor('#dc2626');
      doc.text("Order History", 20, 40);
      autotable(doc, {
        startY: 44,
        head: [['Order ID', 'Date', 'Status', 'Category', 'Total', 'Customer']],
        body: orderHistory.map(order => [
          order.id || order._id || '',
          order.date ? new Date(order.date).toLocaleString() : '',
          order.status || '',
          order.category || '',
          order.total ? `$${order.total.toFixed(2)}` : '',
          order.customer || ''
        ]),
        theme: 'grid',
        headStyles: { fillColor: [220,38,38], textColor: [255,255,255], fontStyle: 'bold' },
        bodyStyles: { fillColor: [243,244,246], textColor: [30,41,59] },
        alternateRowStyles: { fillColor: [255,255,255] },
      });
      doc.save(`order_history_${historyStartDate}_to_${historyEndDate}.pdf`);
    } catch (error) {
      setError("Failed to generate history PDF report");
    } finally {
      setIsGeneratingReport(false);
    }
  }, [orderHistory, historyStartDate, historyEndDate]);

  // Memoized date range helpers
  const dateRangeHelpers = useMemo(() => ({
    getCurrentMonth: () => {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return {
        startDate: firstDay.toISOString().split('T')[0],
        endDate: lastDay.toISOString().split('T')[0]
      };
    },
    getPreviousMonth: () => {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
      return {
        startDate: firstDay.toISOString().split('T')[0],
        endDate: lastDay.toISOString().split('T')[0]
      };
    },
    getLastMonths: (months: number) => {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth() - months, 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return {
        startDate: firstDay.toISOString().split('T')[0],
        endDate: lastDay.toISOString().split('T')[0]
      };
    },
    getCurrentYear: () => {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), 0, 1);
      const lastDay = new Date(today.getFullYear(), 11, 31);
      return {
        startDate: firstDay.toISOString().split('T')[0],
        endDate: lastDay.toISOString().split('T')[0]
      };
    }
  }), []);

  // Optimized API call with useCallback
  const fetchAnalyticsData = useCallback(async () => {
    if (!filters.startDate || !filters.endDate) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams();
      if (filters.status !== "all") queryParams.append("status", filters.status);
      if (filters.category !== "all") queryParams.append("category", filters.category);
      queryParams.append("startDate", filters.startDate);
      queryParams.append("endDate", filters.endDate);
      
      const response = await fetch(`/api/analytics/orders?${queryParams.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch analytics data`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch order analytics data");
      }
      
      // Enhanced data validation with better error handling
      const data: OrderAnalyticsData = {
        labels: Array.isArray(result.data?.labels) ? result.data.labels : [],
        orderCounts: Array.isArray(result.data?.orderCounts) ? 
          result.data.orderCounts.map((count: any) => Number(count) || 0) : [],
        revenueCounts: Array.isArray(result.data?.revenueCounts) ? 
          result.data.revenueCounts.map((revenue: any) => Number(revenue) || 0) : [],
        statuses: Array.isArray(result.data?.statuses) ? result.data.statuses : [],
        categories: Array.isArray(result.data?.categories) ? result.data.categories : [],
        totalRevenue: Number(result.data?.totalRevenue) || 0,
        totalOrders: Number(result.data?.totalOrders) || 0,
        averageOrderValue: Number(result.data?.averageOrderValue) || 0,
        statusBreakdown: (result.data?.statusBreakdown && typeof result.data.statusBreakdown === "object") ? 
          result.data.statusBreakdown : {},
        categoryBreakdown: (result.data?.categoryBreakdown && typeof result.data.categoryBreakdown === "object") ? 
          result.data.categoryBreakdown : {},
        topProducts: Array.isArray(result.data?.topProducts) ? 
          result.data.topProducts.map((prod: any) => ({
            title: String(prod?.title || ""),
            count: Number(prod?.count) || 0,
            revenue: Number(prod?.revenue) || 0
          })) : []
      };
      
      setAnalyticsData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      console.error("Error fetching order analytics data:", err);
      
      // Reset to empty state on error
      setAnalyticsData({
        labels: [],
        orderCounts: [],
        revenueCounts: [],
        statuses: [],
        categories: [],
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        statusBreakdown: {},
        categoryBreakdown: {},
        topProducts: []
      });
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Initialize with current month on mount
  useEffect(() => {
    const currentMonth = dateRangeHelpers.getCurrentMonth();
    setFilters(prev => ({
      ...prev,
      startDate: currentMonth.startDate,
      endDate: currentMonth.endDate
    }));
  }, [dateRangeHelpers]);

  // Fetch data when filters change
  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // Filter update handlers
  const updateFilter = useCallback((key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const setDateRange = useCallback((startDate: string, endDate: string) => {
    setFilters(prev => ({ ...prev, startDate, endDate }));
  }, []);

  // Date range button handlers
  const dateRangeButtons = useMemo(() => [
    {
      label: "THIS MONTH",
      onClick: () => {
        const range = dateRangeHelpers.getCurrentMonth();
        setDateRange(range.startDate, range.endDate);
      },
      className: "bg-red-600 hover:bg-red-700 focus:ring-red-500"
    },
    {
      label: "LAST MONTH",
      onClick: () => {
        const range = dateRangeHelpers.getPreviousMonth();
        setDateRange(range.startDate, range.endDate);
      },
      className: "bg-gray-700 hover:bg-gray-600 focus:ring-gray-500"
    },
    {
      label: "3 MONTHS",
      onClick: () => {
        const range = dateRangeHelpers.getLastMonths(3);
        setDateRange(range.startDate, range.endDate);
      },
      className: "bg-gray-700 hover:bg-gray-600 focus:ring-gray-500"
    },
    {
      label: "6 MONTHS",
      onClick: () => {
        const range = dateRangeHelpers.getLastMonths(6);
        setDateRange(range.startDate, range.endDate);
      },
      className: "bg-gray-700 hover:bg-gray-600 focus:ring-gray-500"
    },
    {
      label: "THIS YEAR",
      onClick: () => {
        const range = dateRangeHelpers.getCurrentYear();
        setDateRange(range.startDate, range.endDate);
      },
      className: "bg-gray-700 hover:bg-gray-600 focus:ring-gray-500"
    }
  ], [dateRangeHelpers, setDateRange]);

  // Report generation functions
  const generatePDFReport = useCallback(() => {
    setIsGeneratingReport(true);
    try {
      const doc = new jsPDF();
      // Title and metadata
      doc.setFontSize(18);
      doc.setTextColor('#dc2626');
      doc.text("Order Analytics Report", 20, 20);
      doc.setFontSize(12);
      doc.setTextColor('#1e293b');
      doc.text(`Date Range: ${filters.startDate} to ${filters.endDate}`, 20, 30);
      doc.text(`Status Filter: ${filters.status === "all" ? "All Statuses" : filters.status}`, 20, 36);
      doc.text(`Category Filter: ${filters.category === "all" ? "All Categories" : filters.category}`, 20, 42);

      // Summary table
      doc.setFontSize(14);
      doc.setTextColor('#dc2626');
      doc.text("Summary", 20, 52);
      autotable(doc, {
        startY: 56,
        head: [['Total Revenue', 'Total Orders', 'Average Order Value']],
        body: [[
          `$${analyticsData.totalRevenue.toFixed(2)}`,
          analyticsData.totalOrders,
          `$${analyticsData.averageOrderValue.toFixed(2)}`
        ]],
        theme: 'grid',
        headStyles: { fillColor: [220,38,38], textColor: [255,255,255], fontStyle: 'bold' },
        bodyStyles: { fillColor: [243,244,246], textColor: [30,41,59] },
        alternateRowStyles: { fillColor: [255,255,255] },
      });

      // Status breakdown table
      let nextY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 10 : 80;
      if (Object.keys(analyticsData.statusBreakdown).length > 0) {
        doc.setFontSize(14);
        doc.setTextColor('#1e293b');
        doc.text("Status Breakdown", 20, nextY);
        autotable(doc, {
          startY: nextY + 4,
          head: [['Status', 'Count']],
          body: Object.entries(analyticsData.statusBreakdown),
          theme: 'grid',
          headStyles: { fillColor: [30,41,59], textColor: [255,255,255], fontStyle: 'bold' },
          bodyStyles: { fillColor: [243,244,246], textColor: [220,38,38] },
          alternateRowStyles: { fillColor: [255,255,255] },
        });
        nextY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 10 : nextY + 30;
      }

      // Category breakdown table
      if (Object.keys(analyticsData.categoryBreakdown).length > 0) {
        doc.setFontSize(14);
        doc.setTextColor('#1e293b');
        doc.text("Category Breakdown", 20, nextY);
        autotable(doc, {
          startY: nextY + 4,
          head: [['Category', 'Count']],
          body: Object.entries(analyticsData.categoryBreakdown),
          theme: 'grid',
          headStyles: { fillColor: [30,41,59], textColor: [255,255,255], fontStyle: 'bold' },
          bodyStyles: { fillColor: [243,244,246], textColor: [220,38,38] },
          alternateRowStyles: { fillColor: [255,255,255] },
        });
        nextY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 10 : nextY + 30;
      }

      // Top products table
      if (analyticsData.topProducts.length > 0) {
        doc.setFontSize(14);
        doc.setTextColor('#dc2626');
        doc.text("Top Products", 20, nextY);
        autotable(doc, {
          startY: nextY + 4,
          head: [['Title', 'Order Count', 'Revenue']],
          body: analyticsData.topProducts.map(product => [product.title, product.count, `$${product.revenue.toFixed(2)}`]),
          theme: 'grid',
          headStyles: { fillColor: [220,38,38], textColor: [255,255,255], fontStyle: 'bold' },
          bodyStyles: { fillColor: [243,244,246], textColor: [30,41,59] },
          alternateRowStyles: { fillColor: [255,255,255] },
        });
      }

      doc.save(`order_analytics_${filters.startDate}_to_${filters.endDate}.pdf`);
    } catch (error) {
      console.error("Error generating PDF report:", error);
      setError("Failed to generate PDF report");
    } finally {
      setIsGeneratingReport(false);
    }
  }, [analyticsData, filters]);

  const generateExcelReport = useCallback(() => {
    setIsGeneratingReport(true);
    try {
      const workbook = XLSX.utils.book_new();
      
      // Summary sheet
      const summaryData = [
        ["Order Analytics Report", ""],
        ["Date Range", `${filters.startDate} to ${filters.endDate}`],
        ["Status Filter", filters.status === "all" ? "All Statuses" : filters.status],
        ["Category Filter", filters.category === "all" ? "All Categories" : filters.category],
        [""],
        ["Summary"],
        ["Total Revenue", analyticsData.totalRevenue],
        ["Total Orders", analyticsData.totalOrders],
        ["Average Order Value", analyticsData.averageOrderValue],
      ];

      // Status breakdown sheet
      const statusData = [["Status", "Count"], ...Object.entries(analyticsData.statusBreakdown)];
      
      // Category breakdown sheet
      const categoryData = [["Category", "Count"], ...Object.entries(analyticsData.categoryBreakdown)];
      
      // Top products sheet
      const productData = [
        ["Title", "Order Count", "Revenue"],
        ...analyticsData.topProducts.map(product => [product.title, product.count, product.revenue])
      ];

      // Create sheets
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summaryData), "Summary");
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(statusData), "Status Breakdown");
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(categoryData), "Category Breakdown");
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(productData), "Top Products");

      XLSX.writeFile(workbook, `order_analytics_${filters.startDate}_to_${filters.endDate}.xlsx`);
    } catch (error) {
      console.error("Error generating Excel report:", error);
      setError("Failed to generate Excel report");
    } finally {
      setIsGeneratingReport(false);
    }
  }, [analyticsData, filters]);

  const generateCSVReport = useCallback(() => {
    setIsGeneratingReport(true);
    try {
      const csvData = [
        ["Order Analytics Report"],
        ["Date Range", `${filters.startDate} to ${filters.endDate}`],
        ["Status Filter", filters.status === "all" ? "All Statuses" : filters.status],
        ["Category Filter", filters.category === "all" ? "All Categories" : filters.category],
        [""],
        ["Summary"],
        ["Total Revenue", analyticsData.totalRevenue],
        ["Total Orders", analyticsData.totalOrders],
        ["Average Order Value", analyticsData.averageOrderValue],
        [""],
        ["Status Breakdown"],
        ["Status", "Count"],
        ...Object.entries(analyticsData.statusBreakdown),
        [""],
        ["Category Breakdown"],
        ["Category", "Count"],
        ...Object.entries(analyticsData.categoryBreakdown),
        [""],
        ["Top Products"],
        ["Title", "Order Count", "Revenue"],
        ...analyticsData.topProducts.map(product => [product.title, product.count, product.revenue]),
      ];

      const csvContent = csvData.map(row => 
        row.map(cell => typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell).join(",")
      ).join("\n");
      
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `order_analytics_${filters.startDate}_to_${filters.endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating CSV report:", error);
      setError("Failed to generate CSV report");
    } finally {
      setIsGeneratingReport(false);
    }
  }, [analyticsData, filters]);

  const generateReport = useCallback(() => {
    const reportGenerators = {
      pdf: generatePDFReport,
      excel: generateExcelReport,
      csv: generateCSVReport
    };
    
    const generator = reportGenerators[reportFormat as keyof typeof reportGenerators];
    if (generator) {
      generator();
    }
  }, [reportFormat, generatePDFReport, generateExcelReport, generateCSVReport]);

  return (
    <div className="min-h-screen flex">
      <AnalyticsSidebar />
      <div 
        className="flex-1 flex flex-col relative overflow-hidden p-8"
        style={{
          background: 'linear-gradient(135deg, #e0e0e0 0%, #d0d0d0 25%, #c0c0c0 50%, #b0b0b0 75%, #a0a0a0 100%)',
          backgroundImage: `
            radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(0,0,0,0.05) 0%, transparent 50%),
            linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.05) 50%, transparent 60%)
          `,
          backgroundSize: '100px 100px, 150px 150px, 200px 200px'
        }}
      >
        <div className="relative z-10 flex-1">
          <div className="mb-6">
            <span className="inline-block bg-red-600 text-white text-sm font-bold py-1 px-3 border border-red-600">
              SALES ANALYTICS
            </span>
            <h2 className="text-3xl font-bold mt-2 mb-6 text-gray-800">Analytics Dashboard</h2>
          </div>

          {error && (
            <div className="bg-red-900 border-l-4 border-red-500 text-red-100 p-4 mb-6 flex items-center">
              <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="bg-black p-6 mb-6 shadow-lg border-l-2 border-red-600">
            <h3 className="text-xl font-bold mb-4 flex items-center text-white">
              <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
              </svg>
              Filters
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-gray-300 font-semibold mb-2 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h7a1 1 0 100-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z" clipRule="evenodd" />
                  </svg>
                  Order Status
                </label>
                <div className="relative">
                  <select
                    value={filters.status}
                    onChange={(e) => updateFilter('status', e.target.value)}
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-none focus:outline-none focus:ring-2 focus:ring-red-500 text-white"
                  >
                    <option value="all">All Statuses</option>
                    {analyticsData.statuses
                      .filter((status): status is string => typeof status === 'string')
                      .map((status) => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-2 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                  Category
                </label>
                <div className="relative">
                  <select
                    value={filters.category}
                    onChange={(e) => updateFilter('category', e.target.value)}
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-none focus:outline-none focus:ring-2 focus:ring-red-500 text-white"
                  >
                    <option value="all">All Categories</option>
                    {analyticsData.categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-gray-300 font-semibold mb-2 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => updateFilter('startDate', e.target.value)}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-none focus:outline-none focus:ring-2 focus:ring-red-500 text-white"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 font-semibold mb-2 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => updateFilter('endDate', e.target.value)}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-none focus:outline-none focus:ring-2 focus:ring-red-500 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
              {dateRangeButtons.map((button, index) => (
                <button
                  key={index}
                  onClick={button.onClick}
                  className={`${button.className} text-white py-2 px-4 font-bold focus:outline-none focus:ring-2 transition duration-200 flex items-center justify-center text-sm`}
                >
                  {button.label}
                </button>
              ))}
            </div>

            {/* Report Generation Section */}
            <div className="mt-4">
              <h3 className="text-xl font-bold mb-4 flex items-center text-white">
                <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1.447.894L12 15.382l-2.553 1.512A1 1 0 018 16V4z" clipRule="evenodd" />
                </svg>
                Generate Report
              </h3>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <label className="block text-gray-300 font-semibold mb-2">Report Format</label>
                  <select
                    value={reportFormat}
                    onChange={(e) => setReportFormat(e.target.value)}
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-none focus:outline-none focus:ring-2 focus:ring-red-500 text-white"
                  >
                    <option value="pdf">PDF Document</option>
                    <option value="excel">Excel Spreadsheet</option>
                    <option value="csv">CSV File</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-gray-300 font-semibold mb-2">Actions</label>
                  <button
                    onClick={generateReport}
                    disabled={isLoading || isGeneratingReport}
                    className="w-full bg-red-600 text-white py-3 px-4 font-bold hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGeneratingReport ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Generate Report
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        
        {/* Loading state */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <svg className="animate-spin h-12 w-12 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : (
          <>
            {/* Order Analytics dashboard */}
            <OrderAnalyticsDashboard 
              labels={analyticsData.labels}
              orderCounts={analyticsData.orderCounts}
              revenueCounts={analyticsData.revenueCounts}
              totalRevenue={analyticsData.totalRevenue}
              totalOrders={analyticsData.totalOrders}
              averageOrderValue={analyticsData.averageOrderValue}
              statusBreakdown={analyticsData.statusBreakdown}
              categoryBreakdown={analyticsData.categoryBreakdown}
              topProducts={analyticsData.topProducts}
              selectedStatus={filters.status}
            />

            {/* Scrollable Order History Section */}
            <div className="mt-12">
              <h3 className="text-2xl font-bold mb-4 text-black">Order History</h3>
              <div className="flex flex-wrap gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Start Date</label>
                  <input
                    type="date"
                    value={historyStartDate}
                    onChange={e => setHistoryStartDate(e.target.value)}
                    className="p-2 border border-gray-400 rounded"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">End Date</label>
                  <input
                    type="date"
                    value={historyEndDate}
                    onChange={e => setHistoryEndDate(e.target.value)}
                    className="p-2 border border-gray-400 rounded"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    className="bg-red-600 text-white px-4 py-2 rounded font-semibold shadow hover:bg-red-700"
                    onClick={generateHistoryPDF}
                    disabled={isLoadingHistory || isGeneratingReport || !orderHistory.length}
                  >
                    Generate History PDF
                  </button>
                </div>
              </div>
              {historyError && (
                <div className="bg-red-100 text-red-700 p-2 mb-2 rounded">{historyError}</div>
              )}
              <div className="overflow-x-auto overflow-y-auto max-h-96 border rounded shadow bg-white">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700">
                      <th className="px-4 py-2 text-left">Order ID</th>
                      <th className="px-4 py-2 text-left">Date</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Category</th>
                      <th className="px-4 py-2 text-left">Total</th>
                      <th className="px-4 py-2 text-left">Customer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingHistory ? (
                      <tr><td colSpan={6} className="text-center py-4 text-gray-400">Loading...</td></tr>
                    ) : orderHistory.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-4 text-gray-400">No order history available.</td></tr>
                    ) : (
                      orderHistory.map((order, idx) => (
                        <tr key={idx} className="border-b border-gray-200">
                          <td className="px-4 py-2">{order.id || order._id || ''}</td>
                          <td className="px-4 py-2">{order.date ? new Date(order.date).toLocaleString() : ''}</td>
                          <td className="px-4 py-2">{order.status || ''}</td>
                          <td className="px-4 py-2">{order.category || ''}</td>
                          <td className="px-4 py-2">{order.total ? `$${order.total.toFixed(2)}` : ''}</td>
                          <td className="px-4 py-2">{order.customer || ''}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
        </div>
      </div>
    </div>
  );
};

export default OrderAnalyticsPage;