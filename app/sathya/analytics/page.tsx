/* eslint-disable prefer-const */
'use client';

import React, { useEffect, useState, useCallback, useMemo } from "react";
import AnalyticsDashboard from "../../Components/analytics/AnalyticsDashboard";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import AnalyticsSidebar from "../../Components/analytics/AnalyticsSidebar";
import Link from 'next/link';

interface AnalyticsData {
  labels: string[];
  donePhysical: number[];
  toBeHeldPhysical: number[];
  doneVirtual: number[];
  toBeHeldVirtual: number[];
  trainers: string[];
  // Optionally keep old fields for backward compatibility
  bookings?: number[];
  virtualBookings?: number[];
  totalSessions?: number;
  averageSessionsPerDay?: number;
  trainerBreakdown?: Record<string, number>;
  busiestDays?: Array<{
    day: string;
    count: number;
  }>;
}

interface FilterState {
  trainer: string;
  startDate: string;
  endDate: string;
}

const AnalyticsPage: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    labels: [],
    donePhysical: [],
    toBeHeldPhysical: [],
    doneVirtual: [],
    toBeHeldVirtual: [],
    trainers: [],
    bookings: [],
    virtualBookings: [],
    totalSessions: 0,
    averageSessionsPerDay: 0,
    trainerBreakdown: {},
    busiestDays: []
  });
  
  const [filters, setFilters] = useState<FilterState>({
    trainer: "all",
    startDate: "",
    endDate: ""
  });
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reportFormat, setReportFormat] = useState<string>("pdf");
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

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

  // Check authentication
  useEffect(() => {
    const userEmail = localStorage.getItem("userEmail");
    const storedUsername = localStorage.getItem("userName");

    if (userEmail && storedUsername) {
      setIsLoggedIn(true);
    }
    setIsCheckingAuth(false);
  }, []);

  // Optimized API call with useCallback
  const fetchAnalyticsData = useCallback(async () => {
    if (!filters.startDate || !filters.endDate) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams();
      if (filters.trainer !== "all") queryParams.append("trainer", filters.trainer);
      queryParams.append("startDate", filters.startDate);
      queryParams.append("endDate", filters.endDate);
      
      const response = await fetch(`/api/analytics/sessions?${queryParams.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch analytics data`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch session analytics data");
      }
      
      // Enhanced data validation with better error handling
      const data: AnalyticsData = {
        labels: Array.isArray(result.data?.labels) ? result.data.labels : [],
        donePhysical: Array.isArray(result.data?.donePhysical) ? result.data.donePhysical.map((count: any) => Number(count) || 0) : [],
        toBeHeldPhysical: Array.isArray(result.data?.toBeHeldPhysical) ? result.data.toBeHeldPhysical.map((count: any) => Number(count) || 0) : [],
        doneVirtual: Array.isArray(result.data?.doneVirtual) ? result.data.doneVirtual.map((count: any) => Number(count) || 0) : [],
        toBeHeldVirtual: Array.isArray(result.data?.toBeHeldVirtual) ? result.data.toBeHeldVirtual.map((count: any) => Number(count) || 0) : [],
        trainers: Array.isArray(result.data?.trainers) ? result.data.trainers : [],
      };
      
      setAnalyticsData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      console.error("Error fetching session analytics data:", err);
      
      // Reset to empty state on error
      setAnalyticsData({
        labels: [],
        donePhysical: [],
        toBeHeldPhysical: [],
        doneVirtual: [],
        toBeHeldVirtual: [],
        trainers: [],
        bookings: [],
        virtualBookings: [],
        totalSessions: 0,
        averageSessionsPerDay: 0,
        trainerBreakdown: {},
        busiestDays: []
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
      label: "This Month",
      onClick: () => {
        const range = dateRangeHelpers.getCurrentMonth();
        setDateRange(range.startDate, range.endDate);
      },
      className: "bg-red-600 hover:bg-red-700 text-white"
    },
    {
      label: "Last Month",
      onClick: () => {
        const range = dateRangeHelpers.getPreviousMonth();
        setDateRange(range.startDate, range.endDate);
      },
      className: "bg-gray-800 hover:bg-gray-700 text-white"
    },
    {
      label: "3 Months",
      onClick: () => {
        const range = dateRangeHelpers.getLastMonths(3);
        setDateRange(range.startDate, range.endDate);
      },
      className: "bg-gray-800 hover:bg-gray-700 text-white"
    },
    {
      label: "6 Months",
      onClick: () => {
        const range = dateRangeHelpers.getLastMonths(6);
        setDateRange(range.startDate, range.endDate);
      },
      className: "bg-gray-800 hover:bg-gray-700 text-white"
    },
    {
      label: "This Year",
      onClick: () => {
        const range = dateRangeHelpers.getCurrentYear();
        setDateRange(range.startDate, range.endDate);
      },
      className: "bg-gray-800 hover:bg-gray-700 text-white"
    }
  ], [dateRangeHelpers, setDateRange]);

  // Report generation functions
  const generatePDFReport = useCallback(() => {
    setIsGeneratingReport(true);
    try {
      const doc = new jsPDF();
      const margin = 20;
      let currentY = margin;

      // Title and metadata
      doc.setFontSize(18);
      doc.text("Session Analytics Report", margin, currentY);
      currentY += 15;
      
      doc.setFontSize(12);
      doc.text(`Date Range: ${filters.startDate} to ${filters.endDate}`, margin, currentY);
      currentY += 10;
      doc.text(`Trainer Filter: ${filters.trainer === "all" ? "All Trainers" : filters.trainer}`, margin, currentY);
      currentY += 20;

      // Summary section
      doc.setFontSize(14);
      doc.text("Summary", margin, currentY);
      currentY += 15;
      
      doc.setFontSize(12);
      const summaryData = [
        `Total Sessions: ${analyticsData.totalSessions ?? 0}`,
        `Average Sessions Per Day: ${analyticsData.averageSessionsPerDay ? analyticsData.averageSessionsPerDay.toFixed(2) : '0.00'}`
      ];
      
      summaryData.forEach(item => {
        doc.text(item, margin, currentY);
        currentY += 10;
      });
      currentY += 10;

      // Trainer breakdown
      if (analyticsData.trainerBreakdown && Object.keys(analyticsData.trainerBreakdown).length > 0) {
        doc.setFontSize(14);
        doc.text("Trainer Breakdown", margin, currentY);
        currentY += 15;
        
        doc.setFontSize(12);
        Object.entries(analyticsData.trainerBreakdown).forEach(([trainer, count]) => {
          doc.text(`${trainer}: ${count} sessions`, margin, currentY);
          currentY += 10;
        });
        currentY += 10;
      }

      // Busiest days
      if (analyticsData.busiestDays && analyticsData.busiestDays.length > 0) {
        if (currentY > 200) { // Check if we need a new page
          doc.addPage();
          currentY = margin;
        }
        
        doc.setFontSize(14);
        doc.text("Busiest Days", margin, currentY);
        currentY += 15;
        
        doc.setFontSize(12);
        analyticsData.busiestDays.forEach((day, index) => {
          if (currentY > 270) { // Check if we need a new page
            doc.addPage();
            currentY = margin;
          }
          doc.text(`${index + 1}. ${day.day}: ${day.count} sessions`, margin, currentY);
          currentY += 10;
        });
      }

      doc.save(`session_analytics_${filters.startDate}_to_${filters.endDate}.pdf`);
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
        ["Session Analytics Report", ""],
        ["Date Range", `${filters.startDate} to ${filters.endDate}`],
        ["Trainer Filter", filters.trainer === "all" ? "All Trainers" : filters.trainer],
        [""],
        ["Summary"],
        ["Total Sessions", analyticsData.totalSessions],
        ["Average Sessions Per Day", analyticsData.averageSessionsPerDay],
      ];

      // Trainer breakdown sheet
      const trainerData = [["Trainer", "Session Count"], ...(analyticsData.trainerBreakdown ? Object.entries(analyticsData.trainerBreakdown) : [])];
      
      // Busiest days sheet
      const busiestDaysData = [
        ["Day", "Session Count"],
        ...(analyticsData.busiestDays ? analyticsData.busiestDays.map(day => [day.day, day.count]) : [])
      ];

      // Create sheets
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summaryData), "Summary");
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(trainerData), "Trainer Breakdown");
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(busiestDaysData), "Busiest Days");

      XLSX.writeFile(workbook, `session_analytics_${filters.startDate}_to_${filters.endDate}.xlsx`);
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
        ["Session Analytics Report"],
        ["Date Range", `${filters.startDate} to ${filters.endDate}`],
        ["Trainer Filter", filters.trainer === "all" ? "All Trainers" : filters.trainer],
        [""],
        ["Summary"],
        ["Total Sessions", analyticsData.totalSessions],
        ["Average Sessions Per Day", analyticsData.averageSessionsPerDay],
        [""],
        ["Trainer Breakdown"],
        ["Trainer", "Session Count"],
        ...(analyticsData.trainerBreakdown ? Object.entries(analyticsData.trainerBreakdown) : []),
        [""],
        ["Busiest Days"],
        ["Day", "Session Count"],
        ...(analyticsData.busiestDays ? analyticsData.busiestDays.map(day => [day.day, day.count]) : [])
      ];

      const csvContent = csvData.map(row => 
        row.map(cell => typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell).join(",")
      ).join("\n");
      
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `session_analytics_${filters.startDate}_to_${filters.endDate}.csv`);
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

  // Authentication checks
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-200 text-gray-800">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-red-600 h-12 w-12"></div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-200 text-gray-800 p-8 text-center">
        <div className="bg-black p-8 rounded-lg shadow-xl max-w-md w-full">
          <h2 className="text-3xl font-bold text-red-500 mb-4">Access Denied</h2>
          <p className="text-lg mb-6 text-gray-300">You must be logged in to view analytics.</p>
          <Link href="/login" className="inline-block bg-red-600 hover:bg-red-700 text-white py-3 px-6 font-bold rounded transition duration-200">
            Go to Login
          </Link>
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
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Session Analytics Dashboard</h1>
            <p className="text-gray-700">Track training sessions and performance metrics</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {/* Filters */}
          <div className="bg-black bg-opacity-90 p-6 mb-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4 text-white">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-gray-300 font-medium mb-2">Trainer</label>
                <div className="relative">
                  <select
                    value={filters.trainer}
                    onChange={(e) => updateFilter('trainer', e.target.value)}
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-red-500 text-white"
                  >
                    <option value="all">All Trainers</option>
                    {analyticsData.trainers.map((trainer) => (
                      <option key={trainer} value={trainer}>{trainer}</option>
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
                <label className="block text-gray-300 font-medium mb-2">Start Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => updateFilter('startDate', e.target.value)}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-red-500 text-white"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 font-medium mb-2">End Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => updateFilter('endDate', e.target.value)}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-red-500 text-white"
                />
              </div>
              
              <div className="flex flex-col justify-end space-y-2">
                {dateRangeButtons.map((button, index) => (
                  <button
                    key={index}
                    onClick={button.onClick}
                    className={`${button.className} py-2 px-4 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-red-500 transition duration-200 rounded`}
                  >
                    {button.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Report Generation Section */}
            <div className="mt-6 pt-6 border-t border-gray-700">
              <h3 className="text-xl font-semibold mb-4 text-white">Generate Report</h3>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <label className="block text-gray-300 font-medium mb-2">Report Format</label>
                  <select
                    value={reportFormat}
                    onChange={(e) => setReportFormat(e.target.value)}
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-red-500 text-white"
                  >
                    <option value="pdf">PDF Document</option>
                    <option value="excel">Excel Spreadsheet</option>
                    <option value="csv">CSV File</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-gray-300 font-medium mb-2">Actions</label>
                  <button
                    onClick={generateReport}
                    disabled={isLoading || isGeneratingReport}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-black transition duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed rounded"
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
              <div className="text-center p-10 bg-white rounded-lg shadow">
                <svg className="animate-spin h-12 w-12 text-red-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="mt-4 text-gray-700">Loading Session Analytics...</p>
              </div>
            </div>
          ) : (
            /* Analytics dashboard */
            <AnalyticsDashboard 
              bookingLabels={analyticsData.labels}
              selectedTrainer={filters.trainer}
              donePhysical={analyticsData.donePhysical}
              toBeHeldPhysical={analyticsData.toBeHeldPhysical}
              doneVirtual={analyticsData.doneVirtual}
              toBeHeldVirtual={analyticsData.toBeHeldVirtual}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;