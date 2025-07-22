// app/dashboard/usage/page.tsx
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import jsPDF from 'jspdf';
import UsageAnalyticsDashboard from '../../Components/analytics/UsageAnalyticsDashboard';
import AnalyticsSidebar from '../../Components/analytics/AnalyticsSidebar';
import Link from 'next/link';

// Define a type for the fetched data structure
interface UsageData {
    labels: string[];
    loginCounts: number[];
    totalLogins30d: number;
    failedLogins30d: number;
    dau: number;
    mau: number;
    roleBreakdown: Record<string, number>;
}

interface FilterState {
    startDate: Date | null;
    endDate: Date | null;
    role: string;
}



const UsageAnalyticsPage = () => {
    const [data, setData] = useState<UsageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [filters, setFilters] = useState<FilterState>({
        startDate: null,
        endDate: null,
        role: 'all',
    });
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [reportFormat, setReportFormat] = useState<string>("pdf");

    // Fetch analytics data when logged in or filters change
    useEffect(() => {
        if (!isLoggedIn) return;
        setLoading(true);
        setError(null);
        let query = [];
        if (filters.startDate) query.push(`startDate=${encodeURIComponent(filters.startDate.toISOString())}`);
        if (filters.endDate) query.push(`endDate=${encodeURIComponent(filters.endDate.toISOString())}`);
        if (filters.role && filters.role !== 'all') query.push(`role=${encodeURIComponent(filters.role)}`);
        const url = `/api/analytics/platform-usage${query.length ? '?' + query.join('&') : ''}`;
        fetch(url)
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch data');
                return res.json();
            })
            .then(result => setData(result))
            .catch(err => setError('Failed to fetch data'))
            .finally(() => setLoading(false));
    }, [isLoggedIn, filters]);

    const generatePDFReport = useCallback(() => {
        if (!data) return;
        setIsGeneratingReport(true);
        try {
            const doc = new jsPDF();
            const margin = 20;
            let currentY = margin;

            // Title and metadata
            doc.setFontSize(18);
            doc.text("Usage Analytics Report", margin, currentY);
            currentY += 15;

            doc.setFontSize(12);
            doc.text(`Date Range: ${filters.startDate ? filters.startDate.toLocaleDateString() : 'N/A'} to ${filters.endDate ? filters.endDate.toLocaleDateString() : 'N/A'}`, margin, currentY);
            currentY += 10;
            doc.text(`Role Filter: ${filters.role === 'all' ? 'All Roles' : filters.role}`, margin, currentY);
            currentY += 20;

            // Summary section
            doc.setFontSize(14);
            doc.text("Summary", margin, currentY);
            currentY += 15;

            doc.setFontSize(12);
            const summaryData = [
                `Total Logins (30d): ${data.totalLogins30d}`,
                `Failed Logins (30d): ${data.failedLogins30d}`,
                `DAU: ${data.dau}`,
                `MAU: ${data.mau}`,
                `Login Success Rate: ${data.totalLogins30d + data.failedLogins30d > 0 ? ((data.totalLogins30d / (data.totalLogins30d + data.failedLogins30d)) * 100).toFixed(1) + '%' : 'N/A'}`
            ];
            summaryData.forEach(item => {
                doc.text(item, margin, currentY);
                currentY += 10;
            });
            currentY += 10;

            // Role breakdown
            if (data.roleBreakdown && Object.keys(data.roleBreakdown).length > 0) {
                doc.setFontSize(14);
                doc.text("Role Breakdown", margin, currentY);
                currentY += 15;
                doc.setFontSize(12);
                Object.entries(data.roleBreakdown).forEach(([role, count]) => {
                    doc.text(`${role}: ${count}`, margin, currentY);
                    currentY += 10;
                });
                currentY += 10;
            }

            // Login trend chart data
            if (data.labels && data.loginCounts) {
                doc.setFontSize(14);
                doc.text("Login Trend (Last 6 Months)", margin, currentY);
                currentY += 15;
                doc.setFontSize(12);
                data.labels.forEach((label, idx) => {
                    doc.text(`${label}: ${data.loginCounts[idx]}`, margin, currentY);
                    currentY += 8;
                });
            }

            doc.save(`usage_analytics_${filters.startDate ? filters.startDate.toISOString().split('T')[0] : 'all'}_to_${filters.endDate ? filters.endDate.toISOString().split('T')[0] : 'all'}.pdf`);
        } catch (error) {
            setError("Failed to generate PDF report");
        } finally {
            setIsGeneratingReport(false);
        }
    }, [data, filters]);

    const generateExcelReport = useCallback(() => {
        setIsGeneratingReport(true);
        // TODO: Implement Excel export logic
        setTimeout(() => {
            setIsGeneratingReport(false);
            alert("Excel report generation is not implemented yet.");
        }, 800);
    }, []);

    const generateCSVReport = useCallback(() => {
        setIsGeneratingReport(true);
        // TODO: Implement CSV export logic
        setTimeout(() => {
            setIsGeneratingReport(false);
            alert("CSV report generation is not implemented yet.");
        }, 800);
    }, []);



    useEffect(() => {
        const userEmail = localStorage.getItem("userEmail");
        const storedUsername = localStorage.getItem("userName");

        if (userEmail && storedUsername) {
            setIsLoggedIn(true);
        }
        setIsCheckingAuth(false);
    }, []);

    useEffect(() => {
        const userEmail = localStorage.getItem("userEmail");
        const storedUsername = localStorage.getItem("userName");

        if (userEmail && storedUsername) {
            setIsLoggedIn(true);
        }
        setIsCheckingAuth(false);
    }, []);
    const generateReport = useCallback(() => {
        if (reportFormat === "pdf") {
            generatePDFReport();
        } else if (reportFormat === "excel") {
            generateExcelReport();
        } else if (reportFormat === "csv") {
            generateCSVReport();
        }
    }, [reportFormat, generatePDFReport, generateExcelReport, generateCSVReport]);

    return (
        <div className="min-h-screen flex" style={{
            background: 'linear-gradient(135deg, #e0e0e0 0%, #d0d0d0 25%, #c0c0c0 50%, #b0b0b0 75%, #a0a0a0 100%)',
            backgroundImage: `
                radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 80%, rgba(0,0,0,0.05) 0%, transparent 50%),
                linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.05) 50%, transparent 60%)
            `,
            backgroundSize: '100px 100px, 150px 150px, 200px 200px'
        }}>
            <AnalyticsSidebar />
            <div className="flex-1 flex flex-col relative overflow-hidden p-8">
                <div className="relative z-10 flex-1">
                    {/* Header */}
                    <div className="mb-8">
                        <span className="inline-block bg-red-600 text-white text-sm font-bold py-2 px-4 rounded-sm shadow-md">
                            PLATFORM ANALYTICS
                        </span>
                        <h1 className="text-4xl font-bold mt-4 mb-2 text-gray-800">Usage & Performance</h1>
                        <p className="text-lg text-gray-600">Track platform engagement and user activity</p>
                    </div>

                    {/* Filters & Report Generation */}
                    <div className="bg-black p-6 mb-8 shadow-lg border-l-2 border-red-600 flex flex-col md:flex-row gap-4 items-center">
                        <div>
                            <label className="block text-gray-300 font-semibold mb-2">Start Date</label>
                            <input
                                type="date"
                                className="p-2 rounded-none bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                                value={filters.startDate ? filters.startDate.toISOString().split('T')[0] : ''}
                                onChange={e => setFilters(f => ({ ...f, startDate: e.target.value ? new Date(e.target.value) : null }))}
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 font-semibold mb-2">End Date</label>
                            <input
                                type="date"
                                className="p-2 rounded-none bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                                value={filters.endDate ? filters.endDate.toISOString().split('T')[0] : ''}
                                onChange={e => setFilters(f => ({ ...f, endDate: e.target.value ? new Date(e.target.value) : null }))}
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 font-semibold mb-2">Role</label>
                            <select
                                className="p-2 rounded-none bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                                value={filters.role}
                                onChange={e => setFilters(f => ({ ...f, role: e.target.value }))}
                            >
                                <option value="all">All</option>
                                {data && Object.keys(data.roleBreakdown).map(role => (
                                    <option key={role} value={role}>{role}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            className="mt-6 md:mt-0 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-none"
                            onClick={() => setFilters({ startDate: null, endDate: null, role: 'all' })}
                        >
                            Reset Filters
                        </button>
                        {/* Report Format Selector and Generate Button */}
                        <div className="flex flex-col md:flex-row items-center gap-2 mt-6 md:mt-0">
                            <select
                                className="bg-gray-800 text-white border border-gray-700 p-2 rounded-none focus:outline-none focus:ring-2 focus:ring-red-600 font-semibold"
                                value={reportFormat}
                                onChange={e => setReportFormat(e.target.value)}
                                style={{ minWidth: 120 }}
                            >
                                <option value="pdf">PDF</option>
                                <option value="excel">Excel</option>
                                <option value="csv">CSV</option>
                            </select>
                            <button
                                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-none flex items-center ml-0 md:ml-2"
                                onClick={generateReport}
                                disabled={isGeneratingReport || !data}
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
                                        {reportFormat === 'pdf' && 'Generate PDF Report'}
                                        {reportFormat === 'excel' && 'Generate Excel Report'}
                                        {reportFormat === 'csv' && 'Generate CSV Report'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {data ? (
                        <>
                            <UsageAnalyticsDashboard {...data} />
                            {/* --- Additional Insights Section --- */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                                <div className="bg-gray-900 border-l-2 border-red-600 p-6 shadow-lg relative">
                                    <div className="absolute top-0 right-0 mt-4 mr-4">
                                        <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-300">Login Success Rate</h3>
                                    <p className="text-4xl font-bold mt-2 text-white">
                                        {data.totalLogins30d + data.failedLogins30d > 0
                                            ? `${((data.totalLogins30d / (data.totalLogins30d + data.failedLogins30d)) * 100).toFixed(1)}%`
                                            : 'N/A'}
                                    </p>
                                    <div className="mt-2 text-sm text-gray-400">Last 30 days</div>
                                </div>
                                <div className="bg-gray-900 border-l-2 border-red-600 p-6 shadow-lg relative">
                                    <div className="absolute top-0 right-0 mt-4 mr-4">
                                        <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-300">DAU/MAU Ratio</h3>
                                    <p className="text-4xl font-bold mt-2 text-white">
                                        {data.mau > 0 ? `${((data.dau / data.mau) * 100).toFixed(1)}%` : 'N/A'}
                                    </p>
                                    <div className="mt-2 text-sm text-gray-400">User stickiness</div>
                                </div>
                                <div className="bg-gray-900 border-l-2 border-red-600 p-6 shadow-lg relative">
                                    <div className="absolute top-0 right-0 mt-4 mr-4">
                                        <svg className="w-6 h-6 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-300">Most Active Role</h3>
                                    <p className="text-4xl font-bold mt-2 text-white">
                                        {Object.keys(data.roleBreakdown).length > 0
                                            ? Object.entries(data.roleBreakdown).sort((a, b) => b[1] - a[1])[0][0]
                                            : 'N/A'}
                                    </p>
                                    <div className="mt-2 text-sm text-gray-400">By unique logins</div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="bg-gray-900 p-8 border-l-2 border-red-600 shadow-lg text-center">
                            <p className="text-gray-300">No analytics data available.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default UsageAnalyticsPage;