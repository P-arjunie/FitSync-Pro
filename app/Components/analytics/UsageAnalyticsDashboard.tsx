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
  labels,
  loginCounts,
  totalLogins30d,
  failedLogins30d,
  dau,
  mau,
}) => {
  const loginTrendData = {
    labels: labels,
    datasets: [{
      label: "Successful Logins",
      data: loginCounts,
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-black bg-opacity-90 p-6 rounded-lg shadow-lg backdrop-blur-sm border-l-4 border-blue-500">
          <h3 className="text-lg font-medium text-gray-300">Total Logins (30d)</h3>
          <p className="text-4xl font-bold mt-2 text-white">{totalLogins30d.toLocaleString()}</p>
        </div>
        <div className="bg-black bg-opacity-90 p-6 rounded-lg shadow-lg backdrop-blur-sm border-l-4 border-red-500">
          <h3 className="text-lg font-medium text-gray-300">Failed Logins (30d)</h3>
          <p className="text-4xl font-bold mt-2 text-white">{failedLogins30d.toLocaleString()}</p>
        </div>
        <div className="bg-black bg-opacity-90 p-6 rounded-lg shadow-lg backdrop-blur-sm border-l-4 border-green-500">
          <h3 className="text-lg font-medium text-gray-300">Daily Active Users</h3>
          <p className="text-4xl font-bold mt-2 text-white">{dau.toLocaleString()}</p>
        </div>
        <div className="bg-black bg-opacity-90 p-6 rounded-lg shadow-lg backdrop-blur-sm border-l-4 border-purple-500">
          <h3 className="text-lg font-medium text-gray-300">Monthly Active Users</h3>
          <p className="text-4xl font-bold mt-2 text-white">{mau.toLocaleString()}</p>
        </div>
      </div>

      {/* Line Chart */}
      <div className="bg-black bg-opacity-90 p-6 rounded-lg shadow-lg backdrop-blur-sm border-l-4 border-red-600">
        <h3 className="text-xl font-bold text-white mb-4">Login Trend (Last 6 Months)</h3>
        <div className="h-80">
          <Line data={loginTrendData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

export default UsageAnalyticsDashboard;