// app/dashboard/usage/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
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

const UsageAnalyticsPage = () => {
    const [data, setData] = useState<UsageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    useEffect(() => {
        const userEmail = localStorage.getItem("userEmail");
        const storedUsername = localStorage.getItem("userName");

        if (userEmail && storedUsername) {
            setIsLoggedIn(true);
        }
        setIsCheckingAuth(false);
    }, []);

    useEffect(() => {
        if (isLoggedIn) {
            const fetchData = async () => {
                try {
                    const res = await fetch('/api/analytics/platform-usage');
                    if (!res.ok) {
                        throw new Error('Failed to fetch data');
                    }
                    const result = await res.json();
                    setData(result);
                } catch (err) {
                    setError(err instanceof Error ? err.message : 'An unknown error occurred');
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }
    }, [isLoggedIn]);

    if (isCheckingAuth) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-200 text-gray-800">
                <p>Loading...</p>
            </div>
        );
    }

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-200 text-gray-800 p-8 text-center">
                <div className="bg-black bg-opacity-80 p-8 rounded-lg shadow-lg">
                    <h2 className="text-3xl font-bold text-red-500 mb-4">Access Denied</h2>
                    <p className="text-lg mb-6 text-gray-300">You must be logged in to view analytics.</p>
                    <Link href="/login" className="bg-red-600 text-white py-2 px-6 font-bold hover:bg-red-700 transition duration-200 rounded">
                        Go to Login
                    </Link>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex">
                <AnalyticsSidebar />
                <div className="flex-1 flex items-center justify-center bg-gray-800">
                    <div className="text-center p-10 text-white">
                        <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-red-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="mt-4">Loading Platform Analytics...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex">
                <AnalyticsSidebar />
                <div className="flex-1 flex items-center justify-center bg-gray-800">
                    <div className="bg-black bg-opacity-80 p-8 rounded-lg shadow-lg text-center">
                        <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
                        <p className="text-gray-300 mb-6">{error}</p>
                        <button 
                            onClick={() => window.location.reload()} 
                            className="bg-red-600 text-white py-2 px-6 font-bold hover:bg-red-700 transition duration-200 rounded"
                        >
                            Try Again
                        </button>
                    </div>
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
                        <span className="inline-block bg-red-600 text-white text-sm font-bold py-2 px-4 rounded-sm shadow-md">
                            PLATFORM ANALYTICS
                        </span>
                        <h1 className="text-4xl font-bold mt-4 mb-2 text-gray-800">Usage & Performance</h1>
                        <p className="text-lg text-gray-600">Track platform engagement and user activity</p>
                    </div>

                    {data ? (
                        <UsageAnalyticsDashboard {...data} />
                    ) : (
                        <div className="bg-black bg-opacity-80 p-8 rounded-lg shadow-lg text-center">
                            <p className="text-gray-300">No analytics data available.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UsageAnalyticsPage;