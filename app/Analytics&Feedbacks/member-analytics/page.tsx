"use client";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { subMonths } from "date-fns";
import Navbar from '../../Components/Navbar';
import Footer from '../../Components/Footer_01';


import { jsPDF } from "jspdf";
import XLSX from "xlsx";

const AnalyticsSidebar = dynamic(() => import("../../Components/analytics/AnalyticsSidebar"), { ssr: false });
// const Bar = dynamic(() => import("react-chartjs-2").then((mod) => mod.Bar), { ssr: false });
const Line = dynamic(() => import("react-chartjs-2").then((mod) => mod.Line), { ssr: false });
const Pie = dynamic(() => import("react-chartjs-2").then((mod) => mod.Pie), { ssr: false });

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

const ageColors = [
  "#EF4444",
  "#F59E0B",
  "#10B981",
  "#3B82F6",
  "#8B5CF6",
  "#6366F1",
];
const genderColors = ["#EF4444", "#3B82F6", "#10B981", "#F59E0B"];


interface GenderBreakdownItem {
  _id: string;
  count: number;
}
interface MemberAnalyticsData {
  totalMembers: number;
  activeMembers: number;
  inactiveMembers: number;
  signupsByMonth: { _id: string; count: number }[];
  churnByMonth: { _id: string; count: number }[];
  genderBreakdown: GenderBreakdownItem[];
  ageBreakdown: Record<string, number>;
  activeCount: number;
  inactiveCount: number;
}


const MemberAnalyticsPage = () => {
  const [data, setData] = useState<MemberAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    gender: "all",
    status: "all",
    startDate: subMonths(new Date(), 6),
    endDate: new Date(),
  });
  const [reportFormat, setReportFormat] = useState<string>("pdf");
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);

  // Report generation functions
  const generatePDFReport = useCallback(() => {
    if (!data) return;
    setIsGeneratingReport(true);
    try {
      const doc = new jsPDF();
      const margin = 20;
      let currentY = margin;

      doc.setFontSize(18);
      doc.text("Member Analytics Report", margin, currentY);
      currentY += 15;

      doc.setFontSize(12);
      doc.text(`Date Range: ${filters.startDate.toLocaleDateString()} to ${filters.endDate.toLocaleDateString()}`, margin, currentY);
      currentY += 10;
      doc.text(`Gender Filter: ${filters.gender === "all" ? "All Genders" : filters.gender}`, margin, currentY);
      currentY += 10;
      doc.text(`Status Filter: ${filters.status === "all" ? "All Statuses" : filters.status}`, margin, currentY);
      currentY += 20;

      doc.setFontSize(14);
      doc.text("Summary", margin, currentY);
      currentY += 15;

      doc.setFontSize(12);
      const summaryData = [
        `Total Members: ${data.totalMembers}`,
        `Active Members (Logged in): ${data.activeCount}`,
        `Inactive Members: ${data.inactiveCount}`,
        `Currently Approved: ${data.activeMembers}`,
      ];
      summaryData.forEach(item => {
        doc.text(item, margin, currentY);
        currentY += 10;
      });
      currentY += 10;

      // Gender breakdown
      if (data.genderBreakdown.length > 0) {
        doc.setFontSize(14);
        doc.text("Gender Breakdown", margin, currentY);
        currentY += 15;
        doc.setFontSize(12);
        data.genderBreakdown.forEach(g => {
          doc.text(`${g._id}: ${g.count}`, margin, currentY);
          currentY += 10;
        });
        currentY += 10;
      }

      // Age breakdown
      if (Object.keys(data.ageBreakdown).length > 0) {
        doc.setFontSize(14);
        doc.text("Age Breakdown", margin, currentY);
        currentY += 15;
        doc.setFontSize(12);
        Object.entries(data.ageBreakdown).forEach(([bucket, count]) => {
          doc.text(`${bucket}: ${count}`, margin, currentY);
          currentY += 10;
        });
        currentY += 10;
      }

      doc.save(`member_analytics_${filters.startDate.toISOString().split('T')[0]}_to_${filters.endDate.toISOString().split('T')[0]}.pdf`);
    } catch {
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
      const summaryData = [
        ["Member Analytics Report", ""],
        ["Date Range", `${filters.startDate.toLocaleDateString()} to ${filters.endDate.toLocaleDateString()}`],
        ["Gender Filter", filters.gender === "all" ? "All Genders" : filters.gender],
        ["Status Filter", filters.status === "all" ? "All Statuses" : filters.status],
        [""],
        ["Summary"],
        ["Total Members", data.totalMembers],
        ["Active Members (Logged in)", data.activeCount],
        ["Inactive Members", data.inactiveCount],
        ["Currently Approved", data.activeMembers],
      ];
      const genderData = [["Gender", "Count"], ...data.genderBreakdown.map(g => [g._id, g.count])];
      const ageData = [["Age Bucket", "Count"], ...Object.entries(data.ageBreakdown)];
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summaryData), "Summary");
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(genderData), "Gender Breakdown");
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(ageData), "Age Breakdown");
      XLSX.writeFile(workbook, `member_analytics_${filters.startDate.toISOString().split('T')[0]}_to_${filters.endDate.toISOString().split('T')[0]}.xlsx`);
    } catch {
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
        ["Member Analytics Report"],
        ["Date Range", `${filters.startDate.toLocaleDateString()} to ${filters.endDate.toLocaleDateString()}`],
        ["Gender Filter", filters.gender === "all" ? "All Genders" : filters.gender],
        ["Status Filter", filters.status === "all" ? "All Statuses" : filters.status],
        [""],
        ["Summary"],
        ["Total Members", data.totalMembers],
        ["Active Members (Logged in)", data.activeCount],
        ["Inactive Members", data.inactiveCount],
        ["Currently Approved", data.activeMembers],
        [""],
        ["Gender Breakdown"],
        ["Gender", "Count"],
        ...data.genderBreakdown.map(g => [g._id, g.count]),
        [""],
        ["Age Breakdown"],
        ["Age Bucket", "Count"],
        ...Object.entries(data.ageBreakdown),
      ];
      const csvContent = csvData.map(row => row.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `member_analytics_${filters.startDate.toISOString().split('T')[0]}_to_${filters.endDate.toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      setError("Failed to generate CSV report");
    } finally {
      setIsGeneratingReport(false);
    }
  }, [data, filters]);

  const generateReport = useCallback(() => {
    const reportGenerators: Record<string, () => void> = {
      pdf: generatePDFReport,
      excel: generateExcelReport,
      csv: generateCSVReport,
    };
    const generator = reportGenerators[reportFormat as keyof typeof reportGenerators];
    if (generator) generator();
  }, [reportFormat, generatePDFReport, generateExcelReport, generateCSVReport]);

  // Date range helpers
  const dateRangeHelpers = useMemo(
    () => ({
      getCurrentMonth: () => {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return {
          startDate: firstDay,
          endDate: lastDay,
        };
      },
      getPreviousMonth: () => {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
        return {
          startDate: firstDay,
          endDate: lastDay,
        };
      },
      getLastMonths: (months: number) => {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth() - months, 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return {
          startDate: firstDay,
          endDate: lastDay,
        };
      },
      getCurrentYear: () => {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), 0, 1);
        const lastDay = new Date(today.getFullYear(), 11, 31);
        return {
          startDate: firstDay,
          endDate: lastDay,
        };
      },
    }),
    []
  );

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (filters.gender !== "all") params.append("gender", filters.gender);
      if (filters.status !== "all") params.append("status", filters.status);
      if (filters.startDate) params.append("startDate", filters.startDate.toISOString());
      if (filters.endDate) params.append("endDate", filters.endDate.toISOString());
      const response = await fetch(`/api/analytics/members?${params.toString()}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || "Failed to fetch analytics");
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "Failed to fetch analytics");
      } else {
        setError("Failed to fetch analytics");
      }
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleResetFilters = () => {
    setFilters({
      gender: "all",
      status: "all",
      startDate: subMonths(new Date(), 6),
      endDate: new Date(),
    });
  };

  // Date range button handlers
  const dateRangeButtons = useMemo(
    () => [
      {
        label: "THIS MONTH",
        onClick: () => {
          const range = dateRangeHelpers.getCurrentMonth();
          setFilters((prev) => ({ ...prev, startDate: range.startDate, endDate: range.endDate }));
        },
        className: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
      },
      {
        label: "LAST MONTH",
        onClick: () => {
          const range = dateRangeHelpers.getPreviousMonth();
          setFilters((prev) => ({ ...prev, startDate: range.startDate, endDate: range.endDate }));
        },
        className: "bg-gray-700 hover:bg-gray-600 focus:ring-gray-500",
      },
      {
        label: "3 MONTHS",
        onClick: () => {
          const range = dateRangeHelpers.getLastMonths(3);
          setFilters((prev) => ({ ...prev, startDate: range.startDate, endDate: range.endDate }));
        },
        className: "bg-gray-700 hover:bg-gray-600 focus:ring-gray-500",
      },
      {
        label: "6 MONTHS",
        onClick: () => {
          const range = dateRangeHelpers.getLastMonths(6);
          setFilters((prev) => ({ ...prev, startDate: range.startDate, endDate: range.endDate }));
        },
        className: "bg-gray-700 hover:bg-gray-600 focus:ring-gray-500",
      },
      {
        label: "THIS YEAR",
        onClick: () => {
          const range = dateRangeHelpers.getCurrentYear();
          setFilters((prev) => ({ ...prev, startDate: range.startDate, endDate: range.endDate }));
        },
        className: "bg-gray-700 hover:bg-gray-600 focus:ring-gray-500",
      },
    ],
    [dateRangeHelpers]
  );

  // Chart data
  const signupsLabels = useMemo(
  () => (data?.signupsByMonth ?? []).map((d) => (d as { _id: string; count: number })._id),
    [data]
  );
  const signupsCounts = useMemo(
  () => (data?.signupsByMonth ?? []).map((d) => (d as { _id: string; count: number }).count),
    [data]
  );
  const churnLabels = useMemo(
  () => (data?.churnByMonth ?? []).map((d) => (d as { _id: string; count: number })._id),
    [data]
  );
  const churnCounts = useMemo(
  () => (data?.churnByMonth ?? []).map((d) => (d as { _id: string; count: number }).count),
    [data]
  );
  const genderLabels = useMemo(
  () => (data?.genderBreakdown ?? []).map((g) => (g as { _id: string; count: number })._id),
    [data]
  );
  const genderCounts = useMemo(
  () => (data?.genderBreakdown ?? []).map((g) => (g as { _id: string; count: number }).count),
    [data]
  );
  const ageLabels = useMemo(
  () => Object.keys(data?.ageBreakdown ?? {}),
    [data]
  );
  const ageCounts = useMemo(
  () => Object.values(data?.ageBreakdown ?? {}),
    [data]
  );

  // Card stats
  const statCards = [
    {
      label: "Total Members",
      value: data?.totalMembers ?? "-",
      color: "bg-gray-900 border-l-2 border-red-600",
    },
    {
      label: "Active Members (Logged in)",
      value: data?.activeCount ?? "-",
      color: "bg-gray-900 border-l-2 border-green-600",
    },
    {
      label: "Inactive Members",
      value: data?.inactiveCount ?? "-",
      color: "bg-gray-900 border-l-2 border-gray-400",
    },
    {
      label: "Currently Approved",
      value: data?.activeMembers ?? "-",
      color: "bg-gray-900 border-l-2 border-blue-600",
    },
  ];

  // Chart options
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: "#FFF",
          font: { weight: 'bold' as const },
        },
      },
      title: {
        display: true,
        font: { size: 16, weight: 'bold' as const },
        color: "#FFF",
        padding: 20,
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "#EF4444",
        bodyColor: "#FFF",
        borderColor: "#EF4444",
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        titleFont: { weight: 'bold' as const },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, color: "#FFF" },
        ticks: { precision: 0, color: "#FFF" },
        grid: { color: "rgba(255, 255, 255, 0.1)" },
      },
      x: {
        title: { display: true, text: "Month", color: "#FFF" },
        ticks: { color: "#FFF" },
        grid: { color: "rgba(255, 255, 255, 0.1)" },
      },
    },
  };
  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: "#FFF",
          padding: 20,
          font: { weight: 'bold' as const },
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "#EF4444",
        bodyColor: "#FFF",
        borderColor: "#EF4444",
        borderWidth: 1,
      },
    },
  };

  return (
    <>
      <Navbar />
    <div className="min-h-screen flex bg-gray-100">
      <AnalyticsSidebar />
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">Member Analytics</h1>
        {/* Filters + Report Generation - styled like order analytics dashboard */}
        <div className="bg-black p-6 mb-6 shadow-lg border-l-2 border-red-600">
          <h3 className="text-xl font-bold mb-4 flex items-center text-white">
            <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
            </svg>
            Filters & Report Generation
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="text-gray-300 font-semibold mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <circle cx="10" cy="10" r="8" />
                </svg>
                Gender
              </label>
              <select
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-none focus:outline-none focus:ring-2 focus:ring-red-500 text-white"
                value={filters.gender}
                onChange={(e) => setFilters((f) => ({ ...f, gender: e.target.value }))}
              >
                <option value="all">All Genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-gray-300 font-semibold mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <rect x="4" y="4" width="12" height="12" />
                </svg>
                Status
              </label>
              <select
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-none focus:outline-none focus:ring-2 focus:ring-red-500 text-white"
                value={filters.status}
                onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
              >
                <option value="all">All Statuses</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div>
              <label className="text-gray-300 font-semibold mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate.toISOString().split("T")[0]}
                onChange={(e) => setFilters((f) => ({ ...f, startDate: new Date(e.target.value) }))}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-none focus:outline-none focus:ring-2 focus:ring-red-500 text-white"
              />
            </div>
            <div>
              <label className="text-gray-300 font-semibold mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate.toISOString().split("T")[0]}
                onChange={(e) => setFilters((f) => ({ ...f, endDate: new Date(e.target.value) }))}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-none focus:outline-none focus:ring-2 focus:ring-red-500 text-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
            <button
              className="bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold"
              onClick={handleResetFilters}
            >
              Reset Filters
            </button>
            {dateRangeButtons.map((btn) => (
              <button
                key={btn.label}
                className={`px-4 py-2 rounded-lg font-semibold text-white ${btn.className}`}
                onClick={btn.onClick}
              >
                {btn.label}
              </button>
            ))}
          </div>
          {/* Report Generation Section */}
          <div className="mt-4">
            <h3 className="text-xl font-bold mb-4 flex items-center text-white">
              <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Generate Report
            </h3>
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <label className="block text-gray-300 font-semibold mb-2">Report Format</label>
                <select
                  value={reportFormat}
                  onChange={e => setReportFormat(e.target.value)}
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
                  disabled={loading || isGeneratingReport}
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
                      Generate Report
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {statCards.map((card) => (
            <div key={card.label} className={`${card.color} p-6 shadow-lg relative rounded-lg`}>
              <div className="text-gray-200 text-sm mb-2">{card.label}</div>
              <div className="text-3xl font-bold text-white">{card.value}</div>
            </div>
          ))}
        </div>
        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Signups Trend */}
          <div className="bg-gray-900 p-6 border-l-2 border-red-600 shadow-lg rounded-lg h-96">
            <h2 className="text-xl font-bold text-white mb-4">Membership Growth Trend</h2>
            {signupsLabels.length > 0 ? (
              <Line
                data={{
                  labels: signupsLabels,
                  datasets: [
                    {
                      label: "Signups",
                      data: signupsCounts,
                      borderColor: "#EF4444",
                      backgroundColor: "rgba(239, 68, 68, 0.2)",
                      fill: true,
                      tension: 0.4,
                      borderWidth: 3,
                      pointBackgroundColor: "#FFF",
                      pointBorderColor: "#EF4444",
                      pointRadius: 4,
                      pointHoverRadius: 6,
                    },
                  ],
                }}
                options={lineChartOptions}
                height={320}
              />
            ) : (
              <div className="text-gray-400">No signup data available</div>
            )}
          </div>
          {/* Churn Trend */}
          <div className="bg-gray-900 p-6 border-l-2 border-gray-400 shadow-lg rounded-lg h-96">
            <h2 className="text-xl font-bold text-white mb-4">Churn Trend (Suspended)</h2>
            {churnLabels.length > 0 ? (
              <Line
                data={{
                  labels: churnLabels,
                  datasets: [
                    {
                      label: "Churned",
                      data: churnCounts,
                      borderColor: "#6366F1",
                      backgroundColor: "rgba(99, 102, 241, 0.2)",
                      fill: true,
                      tension: 0.4,
                      borderWidth: 3,
                      pointBackgroundColor: "#FFF",
                      pointBorderColor: "#6366F1",
                      pointRadius: 4,
                      pointHoverRadius: 6,
                    },
                  ],
                }}
                options={lineChartOptions}
                height={320}
              />
            ) : (
              <div className="text-gray-400">No churn data available</div>
            )}
          </div>
        </div>
        {/* Demographics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Gender Breakdown */}
          <div className="bg-gray-900 p-6 border-l-2 border-blue-600 shadow-lg rounded-lg h-96 flex flex-col">
            <div className="flex items-center mb-4">
              <svg className="w-5 h-5 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="8" />
              </svg>
              <h2 className="text-xl font-bold text-white">Gender Breakdown</h2>
            </div>
            <div className="flex-1 flex items-center justify-center">
              {genderLabels.length > 0 ? (
                <Pie
                  data={{
                    labels: genderLabels,
                    datasets: [
                      {
                        data: genderCounts,
                        backgroundColor: genderColors,
                        borderWidth: 3,
                        borderColor: "#1F2937",
                        hoverOffset: 8,
                      },
                    ],
                  }}
                  options={{
                    ...pieOptions,
                    plugins: {
                      ...pieOptions.plugins,
                      title: {
                        display: true,
                        text: 'Gender Distribution',
                        font: { size: 16, weight: 'bold' as const },
                        color: '#FFF',
                        padding: 20,
                      },
                      legend: {
                        ...pieOptions.plugins.legend,
                        labels: {
                          ...pieOptions.plugins.legend.labels,
                          boxWidth: 24,
                          font: { weight: 'bold' as const, size: 14 },
                        },
                      },
                    },
                  }}
                  height={320}
                />
              ) : (
                <div className="text-gray-400">No gender data available</div>
              )}
            </div>
          </div>
          {/* Age Breakdown */}
          <div className="bg-gray-900 p-6 border-l-2 border-fuchsia-600 shadow-lg rounded-lg h-96 flex flex-col">
            <div className="flex items-center mb-4">
              <svg className="w-5 h-5 mr-2 text-fuchsia-500" fill="currentColor" viewBox="0 0 20 20">
                <rect x="4" y="4" width="12" height="12" />
              </svg>
              <h2 className="text-xl font-bold text-white">Age Breakdown</h2>
            </div>
            <div className="flex-1 flex items-center justify-center">
              {ageLabels.length > 0 ? (
                <Pie
                  data={{
                    labels: ageLabels,
                    datasets: [
                      {
                        data: ageCounts,
                        backgroundColor: ageColors,
                        borderWidth: 3,
                        borderColor: "#1F2937",
                        hoverOffset: 8,
                      },
                    ],
                  }}
                  options={{
                    ...pieOptions,
                    plugins: {
                      ...pieOptions.plugins,
                      title: {
                        display: true,
                        text: 'Age Distribution',
                        font: { size: 16, weight: 'bold' as const },
                        color: '#FFF',
                        padding: 20,
                      },
                      legend: {
                        ...pieOptions.plugins.legend,
                        labels: {
                          ...pieOptions.plugins.legend.labels,
                          boxWidth: 24,
                          font: { weight: 'bold' as const, size: 14 },
                        },
                      },
                    },
                  }}
                  height={320}
                />
              ) : (
                <div className="text-gray-400">No age data available</div>
              )}
            </div>
          </div>
        </div>
        {/* Report Generation */}
        <div className="bg-gray-900 p-6 border-l-2 border-red-600 shadow-lg rounded-lg mb-8">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Generate Report
          </h3>
          <div className="flex flex-wrap gap-4 items-center">
            <select
              className="border border-gray-700 bg-gray-900 text-white rounded-lg px-4 py-2"
              value={reportFormat}
              onChange={e => setReportFormat(e.target.value)}
            >
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
              <option value="csv">CSV</option>
            </select>
            <button
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold shadow-lg"
              onClick={generateReport}
              disabled={loading || !data}
            >
              {isGeneratingReport ? "Generating..." : `Download ${reportFormat.toUpperCase()} Report`}
            </button>
            {loading && <span className="text-gray-400 ml-4">Loading analytics...</span>}
            {error && <span className="text-red-400 ml-4">{error}</span>}
          </div>
        </div>
      </div>
    </div>
      <Footer />
    </>
  );
};

export default MemberAnalyticsPage;
