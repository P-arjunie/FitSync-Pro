'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import OrderAnalyticsDashboard from '@/Components/analytics/OrderAnalyticsDashboard';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, subMonths } from 'date-fns';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import AnalyticsSidebar from '@/Components/analytics/AnalyticsSidebar';

interface AnalyticsData {
  labels: string[];
  orderCounts: number[];
  revenueCounts: number[];
  categories: string[];
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  categoryBreakdown: Record<string, number>;
  topProducts: Array<{
    title: string;
    count: number;
    revenue: number;
  }>;
}

interface FilterState {
  category: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
}

const PaidOrdersAnalyticsPage = () => {
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    category: 'all',
    startDate: subMonths(new Date(), 6),
    endDate: new Date()
  });
  const [reportFormat, setReportFormat] = useState<string>("pdf");
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);

  // Date range helpers
  const dateRangeHelpers = useMemo(() => ({
    getCurrentMonth: () => {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return {
        startDate: firstDay,
        endDate: lastDay
      };
    },
    getPreviousMonth: () => {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
      return {
        startDate: firstDay,
        endDate: lastDay
      };
    },
    getLastMonths: (months: number) => {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth() - months, 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return {
        startDate: firstDay,
        endDate: lastDay
      };
    },
    getCurrentYear: () => {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), 0, 1);
      const lastDay = new Date(today.getFullYear(), 11, 31);
      return {
        startDate: firstDay,
        endDate: lastDay
      };
    }
  }), []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query params
      const params = new URLSearchParams();
      if (filters.category !== 'all') params.append('category', filters.category);
      if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters.endDate) params.append('endDate', filters.endDate.toISOString());

      const response = await fetch(`/api/analytics/paid-orders?${params.toString()}`);
      const result = await response.json();

      if (response.ok) {
        setData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch data');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching analytics data:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleResetFilters = () => {
    setFilters({
      category: 'all',
      startDate: subMonths(new Date(), 6),
      endDate: new Date()
    });
  };

  // Date range button handlers
  const dateRangeButtons = useMemo(() => [
    {
      label: "THIS MONTH",
      onClick: () => {
        const range = dateRangeHelpers.getCurrentMonth();
        setFilters(prev => ({ ...prev, startDate: range.startDate, endDate: range.endDate }));
      },
      className: "bg-red-600 hover:bg-red-700 focus:ring-red-500"
    },
    {
      label: "LAST MONTH",
      onClick: () => {
        const range = dateRangeHelpers.getPreviousMonth();
        setFilters(prev => ({ ...prev, startDate: range.startDate, endDate: range.endDate }));
      },
      className: "bg-gray-700 hover:bg-gray-600 focus:ring-gray-500"
    },
    {
      label: "3 MONTHS",
      onClick: () => {
        const range = dateRangeHelpers.getLastMonths(3);
        setFilters(prev => ({ ...prev, startDate: range.startDate, endDate: range.endDate }));
      },
      className: "bg-gray-700 hover:bg-gray-600 focus:ring-gray-500"
    },
    {
      label: "6 MONTHS",
      onClick: () => {
        const range = dateRangeHelpers.getLastMonths(6);
        setFilters(prev => ({ ...prev, startDate: range.startDate, endDate: range.endDate }));
      },
      className: "bg-gray-700 hover:bg-gray-600 focus:ring-gray-500"
    },
    {
      label: "THIS YEAR",
      onClick: () => {
        const range = dateRangeHelpers.getCurrentYear();
        setFilters(prev => ({ ...prev, startDate: range.startDate, endDate: range.endDate }));
      },
      className: "bg-gray-700 hover:bg-gray-600 focus:ring-gray-500"
    }
  ], [dateRangeHelpers]);

  // Report generation functions
  const generatePDFReport = useCallback(() => {
    if (!data) return;
    
    setIsGeneratingReport(true);
    try {
      const doc = new jsPDF();
      const margin = 20;
      let currentY = margin;

      // Title and metadata
      doc.setFontSize(18);
      doc.text("Paid Orders Analytics Report", margin, currentY);
      currentY += 15;
      
      doc.setFontSize(12);
      doc.text(`Date Range: ${filters.startDate?.toLocaleDateString()} to ${filters.endDate?.toLocaleDateString()}`, margin, currentY);
      currentY += 10;
      doc.text(`Category Filter: ${filters.category === "all" ? "All Categories" : filters.category}`, margin, currentY);
      currentY += 20;

      // Summary section
      doc.setFontSize(14);
      doc.text("Summary", margin, currentY);
      currentY += 15;
      
      doc.setFontSize(12);
      const summaryData = [
        `Total Revenue: $${data.totalRevenue.toFixed(2)}`,
        `Total Orders: ${data.totalOrders}`,
        `Average Order Value: $${data.averageOrderValue.toFixed(2)}`
      ];
      
      summaryData.forEach(item => {
        doc.text(item, margin, currentY);
        currentY += 10;
      });
      currentY += 10;

      // Category breakdown
      if (Object.keys(data.categoryBreakdown).length > 0) {
        doc.setFontSize(14);
        doc.text("Category Breakdown", margin, currentY);
        currentY += 15;
        
        doc.setFontSize(12);
        Object.entries(data.categoryBreakdown).forEach(([category, count]) => {
          if (currentY > 270) { // Check if we need a new page
            doc.addPage();
            currentY = margin;
          }
          doc.text(`${category}: ${count}`, margin, currentY);
          currentY += 10;
        });
        currentY += 10;
      }

      // Top products
      if (data.topProducts.length > 0) {
        if (currentY > 200) { // Check if we need a new page
          doc.addPage();
          currentY = margin;
        }
        
        doc.setFontSize(14);
        doc.text("Top Products", margin, currentY);
        currentY += 15;
        
        doc.setFontSize(12);
        data.topProducts.forEach((product, index) => {
          if (currentY > 270) { // Check if we need a new page
            doc.addPage();
            currentY = margin;
          }
          doc.text(`${index + 1}. ${product.title}: ${product.count} orders, $${product.revenue.toFixed(2)}`, margin, currentY);
          currentY += 10;
        });
      }

      doc.save(`paid_orders_analytics_${filters.startDate?.toISOString().split('T')[0]}_to_${filters.endDate?.toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("Error generating PDF report:", error);
      setError("Failed to generate PDF report");
    } finally {
      setIsGeneratingReport(false);
    }
  }, [data, filters]);

  const generateExcelReport = useCallback(() => {
    if (!data) return;
    
    setIsGeneratingReport(true);
    try {
      const workbook = XLSX.utils.book_new();
      
      // Summary sheet
      const summaryData = [
        ["Paid Orders Analytics Report", ""],
        ["Date Range", `${filters.startDate?.toLocaleDateString()} to ${filters.endDate?.toLocaleDateString()}`],
        ["Category Filter", filters.category === "all" ? "All Categories" : filters.category],
        [""],
        ["Summary"],
        ["Total Revenue", data.totalRevenue],
        ["Total Orders", data.totalOrders],
        ["Average Order Value", data.averageOrderValue],
      ];

      // Category breakdown sheet
      const categoryData = [["Category", "Count"], ...Object.entries(data.categoryBreakdown)];
      
      // Top products sheet
      const productData = [
        ["Title", "Order Count", "Revenue"],
        ...data.topProducts.map(product => [product.title, product.count, product.revenue])
      ];

      // Create sheets
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summaryData), "Summary");
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(categoryData), "Category Breakdown");
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(productData), "Top Products");

      XLSX.writeFile(workbook, `paid_orders_analytics_${filters.startDate?.toISOString().split('T')[0]}_to_${filters.endDate?.toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error("Error generating Excel report:", error);
      setError("Failed to generate Excel report");
    } finally {
      setIsGeneratingReport(false);
    }
  }, [data, filters]);

  const generateCSVReport = useCallback(() => {
    if (!data) return;
    
    setIsGeneratingReport(true);
    try {
      const csvData = [
        ["Paid Orders Analytics Report"],
        ["Date Range", `${filters.startDate?.toLocaleDateString()} to ${filters.endDate?.toLocaleDateString()}`],
        ["Category Filter", filters.category === "all" ? "All Categories" : filters.category],
        [""],
        ["Summary"],
        ["Total Revenue", data.totalRevenue],
        ["Total Orders", data.totalOrders],
        ["Average Order Value", data.averageOrderValue],
        [""],
        ["Category Breakdown"],
        ["Category", "Count"],
        ...Object.entries(data.categoryBreakdown),
        [""],
        ["Top Products"],
        ["Title", "Order Count", "Revenue"],
        ...data.topProducts.map(product => [product.title, product.count, product.revenue]),
      ];

      const csvContent = csvData.map(row => 
        row.map(cell => typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell).join(",")
      ).join("\n");
      
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `paid_orders_analytics_${filters.startDate?.toISOString().split('T')[0]}_to_${filters.endDate?.toISOString().split('T')[0]}.csv`);
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
  }, [data, filters]);

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

  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg text-gray-700">Loading paid orders analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Data</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={fetchData}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 mr-4"
          >
            Retry
          </button>
          <button
            onClick={() => router.push('/app/analytics')}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Back to Analytics
          </button>
        </div>
      </div>
    );
  }

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
              PAID ORDERS ANALYTICS
            </span>
            <h2 className="text-3xl font-bold mt-2 mb-6 text-gray-800">Paid Orders Dashboard</h2>
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                    onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-none focus:outline-none focus:ring-2 focus:ring-red-500 text-white"
                  >
                    <option value="all">All Categories</option>
                    {data?.categories.map((category) => (
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
                <DatePicker
                  selected={filters.startDate}
                  onChange={(date) => setFilters(prev => ({ ...prev, startDate: date || undefined }))}
                  selectsStart
                  startDate={filters.startDate}
                  endDate={filters.endDate}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-none focus:outline-none focus:ring-2 focus:ring-red-500 text-white"
                  placeholderText="Start Date"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 font-semibold mb-2 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  End Date
                </label>
                <DatePicker
                  selected={filters.endDate}
                  onChange={(date) => setFilters(prev => ({ ...prev, endDate: date || undefined }))}
                  selectsEnd
                  startDate={filters.startDate}
                  endDate={filters.endDate}
                  minDate={filters.startDate}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-none focus:outline-none focus:ring-2 focus:ring-red-500 text-white"
                  placeholderText="End Date"
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

            <div className="flex justify-between items-center">
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
              >
                Reset Filters
              </button>

              <div className="flex items-center space-x-4">
                <div>
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
                <button
                  onClick={generateReport}
                  disabled={isGeneratingReport || !data}
                  className="px-6 py-3 bg-red-600 text-white font-bold hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
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
        
          {/* Dashboard */}
          {data && (
            <div className="bg-black p-6 shadow-lg border-l-2 border-red-600">
              <OrderAnalyticsDashboard
                labels={data.labels}
                orderCounts={data.orderCounts}
                revenueCounts={data.revenueCounts}
                totalRevenue={data.totalRevenue}
                totalOrders={data.totalOrders}
                averageOrderValue={data.averageOrderValue}
                statusBreakdown={{ paid: data.totalOrders }}
                categoryBreakdown={data.categoryBreakdown}
                topProducts={data.topProducts}
                selectedStatus="paid"
              />
            </div>
          )}

          {/* Empty State */}
          {data && data.totalOrders === 0 && (
            <div className="bg-black p-8 border-l-2 border-red-600 shadow-lg text-center">
              <svg
                className="w-16 h-16 text-red-500 mx-auto mb-4"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-xl text-gray-300">
                No paid orders found for the selected filters
              </p>
              <p className="text-gray-400 mt-2">
                Try adjusting your date range or category filter
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaidOrdersAnalyticsPage;