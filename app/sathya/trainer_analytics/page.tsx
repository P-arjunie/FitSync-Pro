'use client';

import React, { useEffect, useState } from 'react';

import dynamic from 'next/dynamic';
// Dynamically import Chart.js components to avoid SSR issues
const Bar = dynamic(() => import('react-chartjs-2').then(mod => mod.Bar), { ssr: false });
const Line = dynamic(() => import('react-chartjs-2').then(mod => mod.Line), { ssr: false });

// Register Chart.js components for react-chartjs-2
import { Chart, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
Chart.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

interface RevenueAnalytics {
  totalRevenue: number;
  totalSessions: number;
  monthlyRevenue: { month: string; revenue: number }[];
  sessionTypes: { type: string; count: number }[];
  usage?: {
    loginCount: number;
    lastLogin: string | null;
  };
}

const TrainerAnalyticsPage = () => {
  const [analytics, setAnalytics] = useState<RevenueAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Trainer authentication and fullName logic (same as feedback page)
  const [trainerEmail, setTrainerEmail] = useState<string | null>(null);
  const [trainerName, setTrainerName] = useState<string | null>(null);
  const [trainerRole, setTrainerRole] = useState<string | null>(null);
  const [trainerFullName, setTrainerFullName] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setTrainerEmail(localStorage.getItem('userEmail'));
      setTrainerName(localStorage.getItem('userName'));
      setTrainerRole(localStorage.getItem('userRole'));
      const firstName = localStorage.getItem('firstName') || '';
      const lastName = localStorage.getItem('lastName') || '';
      const fullName = (firstName + ' ' + lastName).trim();
      setTrainerFullName(fullName || localStorage.getItem('userName') || '');
    }
  }, []);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!trainerFullName || trainerRole !== 'trainer') return;
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/analytics/trainer?fullName=${encodeURIComponent(trainerFullName)}`);
        if (!res.ok) throw new Error('Failed to fetch analytics');
        const data = await res.json();
        setAnalytics(data.analytics);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch analytics');
      } finally {
        setLoading(false);
      }
    };
    if (trainerFullName && trainerRole === 'trainer') fetchAnalytics();
  }, [trainerFullName, trainerRole]);

  // Helper for formatting last login
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleString();
  };

  // Prepare chart data
  const revenueLabels = analytics?.monthlyRevenue.map((m) => m.month) || [];
  const revenueData = analytics?.monthlyRevenue.map((m) => m.revenue) || [];
  const sessionLabels = analytics?.sessionTypes.map((s) => s.type) || [];
  const sessionData = analytics?.sessionTypes.map((s) => s.count) || [];

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
      <div className="flex-1 flex flex-col relative overflow-hidden p-8">
        {trainerEmail && trainerRole === 'trainer' && (
          <div className="max-w-2xl mx-auto mb-4 flex justify-end">
            <span className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow">
              Hi{trainerName ? `, ${trainerName}` : `, ${trainerEmail}`}! Welcome back 👋
            </span>
          </div>
        )}
        <h2 className="text-3xl font-bold mt-2 mb-6 text-gray-800 text-center">Trainer Analytics</h2>
        {!trainerEmail || trainerRole !== 'trainer' ? (
          <div className="text-center py-12 text-gray-400">
            You must be logged in as an approved trainer to view analytics.
          </div>
        ) : loading ? (
          <div className="flex justify-center my-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-red-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-900 border-l-4 border-red-500 text-red-100 p-4 mb-6 max-w-4xl mx-auto rounded-r-lg">{error}</div>
        ) : !analytics ? (
          <div className="text-center py-20 text-gray-400 text-lg">No analytics data available.</div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Usage Analytics */}
            <div className="bg-black text-white rounded-lg p-8 shadow-lg flex flex-col md:flex-row justify-between items-center border-l-4 border-green-400">
              <div>
                <div className="text-lg text-white font-semibold">Total Logins</div>
                <div className="text-3xl font-extrabold text-yellow-400">{analytics.usage?.loginCount ?? 'N/A'}</div>
              </div>
              <div>
                <div className="text-lg text-white font-semibold">Last Login</div>
                <div className="text-xl font-bold text-green-300">{formatDate(analytics.usage?.lastLogin ?? null)}</div>
              </div>
            </div>

            {/* Revenue & Sessions */}
            <div className="bg-black text-white rounded-lg p-8 shadow-lg flex flex-col md:flex-row justify-between items-center border-l-4 border-red-600">
              <div>
                <div className="text-lg text-white font-semibold">Total Revenue</div>
                <div className="text-3xl font-extrabold text-green-400 drop-shadow">${analytics.totalRevenue.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-lg text-white font-semibold">Total Sessions</div>
                <div className="text-3xl font-extrabold text-yellow-400 drop-shadow">{analytics.totalSessions}</div>
              </div>
            </div>

            {/* Revenue Trend Chart */}
            <div className="bg-white rounded-lg p-8 shadow-lg border-l-4 border-yellow-400">
              <h3 className="text-xl font-bold mb-4 text-red-600">Monthly Revenue Trend</h3>
              {revenueLabels.length > 0 ? (
                <div className="h-64">
                  <Line
                    data={{
                      labels: revenueLabels,
                      datasets: [
                        {
                          label: 'Revenue',
                          data: revenueData,
                          backgroundColor: 'rgba(220, 38, 38, 0.2)',
                          borderColor: '#dc2626',
                          borderWidth: 3,
                          pointBackgroundColor: '#facc15',
                          pointBorderColor: '#22c55e',
                          tension: 0.4,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { display: false },
                        title: { display: false },
                      },
                      scales: {
                        y: { beginAtZero: true, grid: { color: '#f3f4f6' } },
                        x: { grid: { color: '#f3f4f6' } },
                      },
                    }}
                  />
                </div>
              ) : (
                <div className="text-gray-400 text-center">No revenue data for chart.</div>
              )}
            </div>

            {/* Session Types Chart */}
            <div className="bg-white rounded-lg p-8 shadow-lg border-l-4 border-green-400">
              <h3 className="text-xl font-bold mb-4 text-green-700">Session Types Distribution</h3>
              {sessionLabels.length > 0 ? (
                <div className="h-64">
                  <Bar
                    data={{
                      labels: sessionLabels,
                      datasets: [
                        {
                          label: 'Sessions',
                          data: sessionData,
                          backgroundColor: [
                            '#dc2626', '#facc15', '#22c55e', '#0ea5e9', '#a21caf', '#f59e42', '#f43f5e', '#14b8a6'
                          ],
                          borderColor: '#111827',
                          borderWidth: 2,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { display: false },
                        title: { display: false },
                      },
                      scales: {
                        y: { beginAtZero: true, grid: { color: '#f3f4f6' } },
                        x: { grid: { color: '#f3f4f6' } },
                      },
                    }}
                  />
                </div>
              ) : (
                <div className="text-gray-400 text-center">No session data for chart.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainerAnalyticsPage;
