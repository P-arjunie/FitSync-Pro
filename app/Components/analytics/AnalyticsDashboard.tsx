// Components/analytics/AnalyticsDashboard.tsx
import React, { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardProps {
  bookingLabels: string[];
  selectedTrainer: string;
  donePhysical: number[];
  toBeHeldPhysical: number[];
  doneVirtual: number[];
  toBeHeldVirtual: number[];
}

const AnalyticsDashboard: React.FC<DashboardProps> = ({
  bookingLabels,
  selectedTrainer,
  donePhysical,
  toBeHeldPhysical,
  doneVirtual,
  toBeHeldVirtual,
}) => {
  // Calculate stats for physical sessions
  const totalPhysicalSessions = useMemo(() =>
    [...donePhysical, ...toBeHeldPhysical].reduce((sum, count) => sum + count, 0),
    [donePhysical, toBeHeldPhysical]);

  // Calculate stats for virtual sessions
  const totalVirtualSessions = useMemo(() =>
    [...doneVirtual, ...toBeHeldVirtual].reduce((sum, count) => sum + count, 0),
    [doneVirtual, toBeHeldVirtual]);

  // Combined stats
  const totalSessions = useMemo(() =>
    totalPhysicalSessions + totalVirtualSessions,
    [totalPhysicalSessions, totalVirtualSessions]);

  const totalMonths = bookingLabels.length;
  const averageSessionsPerMonth = useMemo(() => {
    return totalMonths > 0 ? Math.round(totalSessions / totalMonths) : 0;
  }, [totalSessions, totalMonths]);

  // For chart: sum all categories for each month
  const combinedData = bookingLabels.map((_, idx) =>
    (donePhysical[idx] || 0) + (toBeHeldPhysical[idx] || 0) + (doneVirtual[idx] || 0) + (toBeHeldVirtual[idx] || 0)
  );
  const maxSessions = useMemo(() =>
    combinedData.length > 0 ? Math.max(...combinedData) : 0,
    [combinedData]);

  // Find peak month
  const peakMonthIndex = useMemo(() => {
    if (combinedData.length === 0) return -1;
    return combinedData.indexOf(Math.max(...combinedData));
  }, [combinedData]);

  const peakMonth = useMemo(() =>
    peakMonthIndex !== -1 ? bookingLabels[peakMonthIndex] : "N/A",
    [bookingLabels, peakMonthIndex]);

  // Chart data for sessions
  const chartDataSessions = {
    labels: bookingLabels,
    datasets: [
      {
        label: "Physical Sessions (Done)",
        data: donePhysical,
        backgroundColor: "rgba(239, 68, 68, 0.8)", // Red-600
        borderColor: "rgba(239, 68, 68, 1)",
        borderWidth: 1,
      },
      {
        label: "Physical Sessions (To Be Held)",
        data: toBeHeldPhysical,
        backgroundColor: "rgba(239, 68, 68, 0.3)", // Red-300
        borderColor: "rgba(239, 68, 68, 0.5)",
        borderWidth: 1,
      },
      {
        label: "Virtual Sessions (Done)",
        data: doneVirtual,
        backgroundColor: "rgba(59, 130, 246, 0.8)", // Blue-500
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
      },
      {
        label: "Virtual Sessions (To Be Held)",
        data: toBeHeldVirtual,
        backgroundColor: "rgba(59, 130, 246, 0.3)", // Blue-300
        borderColor: "rgba(59, 130, 246, 0.5)",
        borderWidth: 1,
      },
      {
        label: "Total Sessions",
        data: combinedData,
        backgroundColor: "rgba(16, 185, 129, 0.8)", // Green-500
        borderColor: "rgba(16, 185, 129, 1)",
        borderWidth: 1,
      },
    ],
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#FFF',
          font: {
            weight: 'bold' as const,
          }
        }
      },
      title: {
        display: true,
        text: selectedTrainer === 'all' 
          ? 'All Trainers Session Performance' 
          : `${selectedTrainer}'s Session Performance`,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        color: '#FFF',
        padding: 20
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#EF4444',
        bodyColor: '#FFF',
        borderColor: '#EF4444',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        titleFont: {
          weight: 'bold' as const,
        },
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y + ' sessions';
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Sessions',
          color: '#FFF'
        },
        ticks: {
          precision: 0,
          color: '#FFF'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Month',
          color: '#FFF'
        },
        ticks: {
          color: '#FFF'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
    },
  };

  return (
    <div className="flex flex-col space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total Sessions Card */}
        <div className="bg-gray-900 border-l-2 border-green-500 p-6 shadow-lg relative">
          <div className="absolute top-0 right-0 mt-4 mr-4">
            <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 3a1 1 0 000 2h10a1 1 0 100-2H3zm0 4a1 1 0 000 2h6a1 1 0 100-2H3zm0 4a1 1 0 100 2h12a1 1 0 100-2H3z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-300">Total Sessions</h3>
          <p className="text-4xl font-bold mt-2 text-white">{totalSessions}</p>
          <div className="mt-2 text-sm text-gray-400">
            <span className="text-red-400">{totalPhysicalSessions} physical</span> +
            <span className="text-blue-400"> {totalVirtualSessions} virtual</span>
          </div>
        </div>

        {/* Physical Sessions Card */}
        <div className="bg-gray-900 border-l-2 border-red-600 p-6 shadow-lg relative">
          <div className="absolute top-0 right-0 mt-4 mr-4">
            <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-300">Physical Sessions</h3>
          <p className="text-4xl font-bold mt-2 text-white">{totalPhysicalSessions}</p>
          <div className="mt-2 text-sm text-gray-400">
            <span className="text-green-400">Done: {donePhysical.reduce((a, b) => a + b, 0)}</span> |
            <span className="text-yellow-400"> To Be Held: {toBeHeldPhysical.reduce((a, b) => a + b, 0)}</span>
          </div>
          <div className="mt-2 text-xs text-gray-500">In-person training sessions</div>
        </div>

        {/* Virtual Sessions Card */}
        <div className="bg-gray-900 border-l-2 border-blue-500 p-6 shadow-lg relative">
          <div className="absolute top-0 right-0 mt-4 mr-4">
            <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-300">Virtual Sessions</h3>
          <p className="text-4xl font-bold mt-2 text-white">{totalVirtualSessions}</p>
          <div className="mt-2 text-sm text-gray-400">
            <span className="text-green-400">Done: {doneVirtual.reduce((a, b) => a + b, 0)}</span> |
            <span className="text-yellow-400"> To Be Held: {toBeHeldVirtual.reduce((a, b) => a + b, 0)}</span>
          </div>
          <div className="mt-2 text-xs text-gray-500">Online training sessions</div>
        </div>

        {/* Peak Month Card */}
        <div className="bg-gray-900 border-l-2 border-green-500 p-6 shadow-lg relative">
          <div className="absolute top-0 right-0 mt-4 mr-4">
            <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-300">Peak Month Sessions</h3>
          <p className="text-4xl font-bold mt-2 text-white">{maxSessions}</p>
          <div className="mt-2 text-sm text-gray-400">
            {peakMonth !== "N/A" ? `Highest in ${peakMonth}` : "No data available"}
          </div>
        </div>
      </div>
      
      {/* No data message */}
      {donePhysical.length === 0 && doneVirtual.length === 0 && toBeHeldPhysical.length === 0 && toBeHeldVirtual.length === 0 && (
        <div className="bg-gray-900 p-8 border-l-2 border-red-600 shadow-lg text-center">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="text-xl text-gray-300">No session data available for the selected filters</p>
          <p className="text-gray-400 mt-2">Try adjusting your filters or selecting a different date range</p>
        </div>
      )}

      {/* Sessions Chart */}
      {(donePhysical.length > 0 || doneVirtual.length > 0 || toBeHeldPhysical.length > 0 || toBeHeldVirtual.length > 0) && (
        <div className="bg-gray-900 p-6 border-l-2 border-green-500 shadow-lg">
          <div className="flex items-center mb-4">
            <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 3a1 1 0 000 2h14a1 1 0 100-2H3zm0 6a1 1 0 000 2h14a1 1 0 100-2H3zm0 6a1 1 0 100 2h14a1 1 0 100-2H3z" clipRule="evenodd" />
            </svg>
            <h3 className="text-xl font-bold text-white">Session Performance Comparison</h3>
          </div>
          <div className="h-80">
            <Bar data={chartDataSessions} options={chartOptions} />
          </div>
        </div>
      )}

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            icon: "M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z",
            title: "Session Distribution",
            description: "Compare physical and virtual session trends over time."
          },
          {
            icon: "M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z",
            title: "Session Timing",
            description: "Analyze peak booking times for both session types."
          },
          {
            icon: "M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm9 4a1 1 0 10-2 0v6a1 1 0 102 0V7zm-3 2a1 1 0 10-2 0v4a1 1 0 102 0V9zm-3 3a1 1 0 10-2 0v1a1 1 0 102 0v-1z",
            title: "Growth Trends",
            description: "Track growth patterns across different session formats."
          }
        ].map((card, index) => (
          <div key={index} className="bg-gray-900 p-4 shadow-lg flex space-x-3 items-start border-l-2 border-green-500">
            <div className="bg-green-500 p-2 rounded-full">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d={card.icon} clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-white">{card.title}</h3>
              <p className="text-sm text-gray-400 mt-1">{card.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;