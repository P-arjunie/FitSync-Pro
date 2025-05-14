// Components/analytics/AnalyticsDashboard.tsx
import React, { useMemo } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
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
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardProps {
  bookingsData: number[];
  bookingLabels: string[];
  selectedTrainer: string;
}

const AnalyticsDashboard: React.FC<DashboardProps> = ({
  bookingsData,
  bookingLabels,
  selectedTrainer,
}) => {
  // Calculate stats
  const totalBookings = useMemo(() => 
    bookingsData.reduce((sum, count) => sum + count, 0), 
    [bookingsData]);
    
  const averageBookingsPerMonth = useMemo(() => 
    totalBookings > 0 && bookingsData.length > 0
      ? Math.round(totalBookings / bookingsData.length)
      : 0, 
    [totalBookings, bookingsData]);
    
  const maxBookings = useMemo(() => 
    bookingsData.length > 0 ? Math.max(...bookingsData) : 0,
    [bookingsData]);
    
  // Find peak month
  const peakMonthIndex = useMemo(() => {
    if (bookingsData.length === 0) return -1;
    return bookingsData.indexOf(maxBookings);
  }, [bookingsData, maxBookings]);
  
  const peakMonth = useMemo(() => 
    peakMonthIndex !== -1 ? bookingLabels[peakMonthIndex] : "N/A",
    [bookingLabels, peakMonthIndex]);

  // Chart data for bookings
  const chartDataBookings = {
    labels: bookingLabels,
    datasets: [
      {
        label: "Session Bookings",
        data: bookingsData,
        borderColor: "rgba(239, 68, 68, 1)", // Red-600
        backgroundColor: "rgba(239, 68, 68, 0.2)", // Transparent red
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointBackgroundColor: "#FFF",
        pointBorderColor: "rgba(239, 68, 68, 1)",
        pointRadius: 4,
        pointHoverRadius: 6,
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
          ? 'All Trainers Session Bookings' 
          : `${selectedTrainer}'s Session Bookings`,
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
        displayColors: false,
        titleFont: {
          weight: 'bold' as const,
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900 border-l-2 border-red-600 p-6 shadow-lg relative">
          <div className="absolute top-0 right-0 mt-4 mr-4">
            <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 3a1 1 0 000 2h10a1 1 0 100-2H3zm0 4a1 1 0 000 2h6a1 1 0 100-2H3zm0 4a1 1 0 100 2h12a1 1 0 100-2H3z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-300">Total Sessions</h3>
          <p className="text-4xl font-bold mt-2 text-white">{totalBookings}</p>
          <div className="mt-2 text-sm text-gray-400">All time bookings</div>
        </div>
        
        <div className="bg-gray-900 border-l-2 border-red-600 p-6 shadow-lg relative">
          <div className="absolute top-0 right-0 mt-4 mr-4">
            <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-300">Average Sessions/Month</h3>
          <p className="text-4xl font-bold mt-2 text-white">{averageBookingsPerMonth}</p>
          <div className="mt-2 text-sm text-gray-400">Monthly average</div>
        </div>
        
        <div className="bg-gray-900 border-l-2 border-red-600 p-6 shadow-lg relative">
          <div className="absolute top-0 right-0 mt-4 mr-4">
            <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-300">Peak Month Sessions</h3>
          <p className="text-4xl font-bold mt-2 text-white">{maxBookings}</p>
          <div className="mt-2 text-sm text-gray-400">
            {peakMonth !== "N/A" ? `Highest in ${peakMonth}` : "No data available"}
          </div>
        </div>
      </div>
      {/* No data message */}
      {bookingsData.length === 0 && (
        <div className="bg-gray-900 p-8 border-l-2 border-red-600 shadow-lg text-center">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="text-xl text-gray-300">No session data available for the selected filters</p>
          <p className="text-gray-400 mt-2">Try adjusting your filters or selecting a different date range</p>
        </div>
      )}

      {/* Bookings Chart */}
      {bookingsData.length > 0 && (
        <div className="bg-gray-900 p-6 border-l-2 border-red-600 shadow-lg">
          <div className="flex items-center mb-4">
            <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 3a1 1 0 000 2h14a1 1 0 100-2H3zm0 6a1 1 0 000 2h14a1 1 0 100-2H3zm0 6a1 1 0 100 2h14a1 1 0 100-2H3z" clipRule="evenodd" />
            </svg>
            <h3 className="text-xl font-bold text-white">Session Bookings Trend</h3>
          </div>
          <div className="h-80">
            <Line data={chartDataBookings} options={chartOptions} />
          </div>
        </div>
      )}

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            icon: "M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z",
            title: "Trainer Performance",
            description: "Track individual trainer booking rates and performance metrics."
          },
          {
            icon: "M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z",
            title: "Session Timing",
            description: "Analyze peak booking times to optimize your session scheduling."
          },
          {
            icon: "M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm9 4a1 1 0 10-2 0v6a1 1 0 102 0V7zm-3 2a1 1 0 10-2 0v4a1 1 0 102 0V9zm-3 3a1 1 0 10-2 0v1a1 1 0 102 0v-1z",
            title: "Booking Growth",
            description: "View growth trends to track your business expansion over time."
          }
        ].map((card, index) => (
          <div key={index} className="bg-gray-900 p-4 shadow-lg flex space-x-3 items-start border-l-2 border-red-600">
            <div className="bg-red-600 p-2 rounded-full">
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