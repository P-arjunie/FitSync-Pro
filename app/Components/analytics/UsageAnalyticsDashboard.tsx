// components/analytics/UsageAnalyticsDashboard.tsx
import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement, Title,
  Tooltip, Legend, Filler
} from "chart.js";

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, Title,
  Tooltip, Legend, Filler
);

interface UsageAnalyticsProps {
  labels: string[];
  loginCounts: number[];
  totalLogins30d: number;
  failedLogins30d: number;
  dau: number;
  mau: number;
}

const UsageAnalyticsDashboard: React.FC<UsageAnalyticsProps> = ({
  labels = [],
  loginCounts = [],
  totalLogins30d,
  failedLogins30d,
  dau,
  mau,
}) => {
  // Defensive: Ensure labels and loginCounts are arrays of the same length
  const safeLabels = Array.isArray(labels) ? labels : [];
  const safeLoginCounts = Array.isArray(loginCounts) ? loginCounts : [];
  // If lengths mismatch, pad with zeros or trim
  let chartLabels = safeLabels;
  let chartData = safeLoginCounts;
  if (safeLabels.length !== safeLoginCounts.length) {
    const minLen = Math.min(safeLabels.length, safeLoginCounts.length);
    chartLabels = safeLabels.slice(0, minLen);
    chartData = safeLoginCounts.slice(0, minLen);
  }
  const loginTrendData = {
    labels: chartLabels,
    datasets: [{
      label: "Successful Logins",
      data: chartData,
      borderColor: "rgba(220, 38, 38, 1)", // red-600
      backgroundColor: "rgba(220, 38, 38, 0.2)",
      fill: true,
      tension: 0.4,
      borderWidth: 2,
      pointBackgroundColor: "rgba(220, 38, 38, 1)",
      pointBorderColor: "#fff",
      pointHoverRadius: 5,
      pointHoverBackgroundColor: "rgba(220, 38, 38, 1)",
      pointHoverBorderColor: "#fff",
      pointHitRadius: 10,
      pointBorderWidth: 2,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#f3f4f6', // gray-100
          font: {
            size: 14,
            weight: 'bold' as const // Fixed the type by using 'bold' as const
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)', // pure black
        titleColor: '#f3f4f6', // gray-100
        bodyColor: '#e5e7eb', // gray-200
        borderColor: '#374151', // gray-700
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.raw}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(55, 65, 81, 0.5)' // gray-700
        },
        ticks: {
          color: '#f3f4f6' // gray-100
        }
      },
      y: {
        grid: {
          color: 'rgba(55, 65, 81, 0.5)' // gray-700
        },
        ticks: {
          color: '#f3f4f6' // gray-100
        },
        beginAtZero: true
      }
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-gray-900 border-l-2 border-red-600 p-6 shadow-lg relative">
          <div className="absolute top-0 right-0 mt-4 mr-4">
            <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-300">Total Logins (30d)</h3>
          <p className="text-4xl font-bold mt-2 text-white">{totalLogins30d.toLocaleString()}</p>
          <div className="mt-2 text-sm text-gray-400">All login attempts</div>
        </div>
        <div className="bg-gray-900 border-l-2 border-red-600 p-6 shadow-lg relative">
          <div className="absolute top-0 right-0 mt-4 mr-4">
            <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 3a1 1 0 011-1h8a1 1 0 011 1v2a1 1 0 01-1 1H6A1 1 0 015 5V3zm0 4a1 1 0 011-1h8a1 1 0 011 1v2a1 1 0 01-1 1H6A1 1 0 015 7V5zm0 4a1 1 0 011-1h8a1 1 0 011 1v2a1 1 0 01-1 1H6a1 1 0 01-1-1v-2zm0 4a1 1 0 011-1h8a1 1 0 011 1v2a1 1 0 01-1 1H6a1 1 0 01-1-1v-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-300">Successful Logins (30d)</h3>
          <p className="text-4xl font-bold mt-2 text-white">{totalLogins30d.toLocaleString()}</p>
          <div className="mt-2 text-sm text-gray-400">Logins succeeded</div>
        </div>
        <div className="bg-gray-900 border-l-2 border-red-600 p-6 shadow-lg relative">
          <div className="absolute top-0 right-0 mt-4 mr-4">
            <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-300">Failed Logins (30d)</h3>
          <p className="text-4xl font-bold mt-2 text-white">{failedLogins30d.toLocaleString()}</p>
          <div className="mt-2 text-sm text-gray-400">Unsuccessful attempts</div>
        </div>
        <div className="bg-gray-900 border-l-2 border-red-600 p-6 shadow-lg relative">
          <div className="absolute top-0 right-0 mt-4 mr-4">
            <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-300">Daily Active Users</h3>
          <p className="text-4xl font-bold mt-2 text-white">{dau.toLocaleString()}</p>
          <div className="mt-2 text-sm text-gray-400">Unique users today</div>
        </div>
        <div className="bg-gray-900 border-l-2 border-red-600 p-6 shadow-lg relative">
          <div className="absolute top-0 right-0 mt-4 mr-4">
            <svg className="w-6 h-6 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-300">Monthly Active Users</h3>
          <p className="text-4xl font-bold mt-2 text-white">{mau.toLocaleString()}</p>
          <div className="mt-2 text-sm text-gray-400">Unique users this month</div>
        </div>
      </div>

      {/* Line Chart */}
      <div className="bg-gray-900 p-6 border-l-2 border-red-600 shadow-lg">
        <h3 className="text-xl font-bold text-white mb-4">Login Trend </h3>
        <div className="h-80">
          <Line data={loginTrendData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

export default UsageAnalyticsDashboard;