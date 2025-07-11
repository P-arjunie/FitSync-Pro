/* eslint-disable prefer-const */
'use client';

import React, { useEffect, useState, useCallback, useMemo } from "react";
import AnalyticsDashboard from "../../Components/analytics/AnalyticsDashboard";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

interface AnalyticsData {
  labels: string[];
  bookings: number[];
  trainers: string[];
  totalSessions: number;
  averageSessionsPerDay: number;
  trainerBreakdown: Record<string, number>;
  busiestDays: Array<{
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
    bookings: [],
    trainers: [],
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
        bookings: Array.isArray(result.data?.bookings) ? 
          result.data.bookings.map((count: any) => Number(count) || 0) : [],
        trainers: Array.isArray(result.data?.trainers) ? result.data.trainers : [],
        totalSessions: Number(result.data?.totalSessions) || 0,
        averageSessionsPerDay: Number(result.data?.averageSessionsPerDay) || 0,
        trainerBreakdown: result.data?.trainerBreakdown && typeof result.data.trainerBreakdown === "object" ? 
          result.data.trainerBreakdown : {},
        busiestDays: Array.isArray(result.data?.busiestDays) ? 
          result.data.busiestDays.map((day: any) => ({
            day: String(day?.day || ""),
            count: Number(day?.count) || 0,
          })) : [],
      };
      
      setAnalyticsData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      console.error("Error fetching session analytics data:", err);
      
      // Reset to empty state on error
      setAnalyticsData({
        labels: [],
        bookings: [],
        trainers: [],
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
        `Total Sessions: ${analyticsData.totalSessions}`,
        `Average Sessions Per Day: ${analyticsData.averageSessionsPerDay.toFixed(2)}`
      ];
      
      summaryData.forEach(item => {
        doc.text(item, margin, currentY);
        currentY += 10;
      });
      currentY += 10;

      // Trainer breakdown
      if (Object.keys(analyticsData.trainerBreakdown).length > 0) {
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
      if (analyticsData.busiestDays.length > 0) {
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
      const trainerData = [["Trainer", "Session Count"], ...Object.entries(analyticsData.trainerBreakdown)];
      
      // Busiest days sheet
      const busiestDaysData = [
        ["Day", "Session Count"],
        ...analyticsData.busiestDays.map(day => [day.day, day.count])
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
        ...Object.entries(analyticsData.trainerBreakdown),
        [""],
        ["Busiest Days"],
        ["Day", "Session Count"],
        ...analyticsData.busiestDays.map(day => [day.day, day.count]),
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

  return (
    <div className="min-h-screen flex flex-col bg-black text-white relative overflow-hidden">
      {/* Skewed background */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-red-600 transform -skew-x-12 z-0"></div>
      
      <div className="relative z-10 flex-1 p-8 flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <span className="inline-block bg-red-600 text-white text-sm font-bold py-1 px-3 border border-red-600">
            PERFORMANCE METRICS
          </span>
          <h2 className="text-3xl font-bold mt-2 mb-6">Session Analytics Dashboard</h2>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-900 border-l-4 border-red-500 text-red-100 p-4 mb-6 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-gray-900 p-6 mb-6 shadow-lg border-l-2 border-red-600">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
            </svg>
            Filters
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-gray-300 font-semibold mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
                Trainer
              </label>
              <div className="relative">
                <select
                  value={filters.trainer}
                  onChange={(e) => updateFilter('trainer', e.target.value)}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-none focus:outline-none focus:ring-2 focus:ring-red-500 text-white"
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
            
            <div className="flex flex-col justify-end space-y-2">
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
          </div>

          {/* Report Generation Section */}
          <div className="mt-4">
            <h3 className="text-xl font-bold mb-4 flex items-center">
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
          /* Analytics dashboard */
          <AnalyticsDashboard 
            bookingsData={analyticsData.bookings} 
            bookingLabels={analyticsData.labels}
            selectedTrainer={filters.trainer}
          />
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;