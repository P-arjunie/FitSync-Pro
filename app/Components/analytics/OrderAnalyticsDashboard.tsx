// Components/analytics/OrderAnalyticsDashboard.tsx
import React, { useMemo } from "react";
// 1. CHANGED: Imported 'Pie' instead of 'Doughnut'
import { Line, Bar, Pie } from "react-chartjs-2";
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

// Register Chart.js components
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
//structure of the props the component will receive
interface OrderAnalyticsProps {
  labels: string[];
  orderCounts: number[];
  revenueCounts: number[];
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  statusBreakdown: Record<string, number>;
  categoryBreakdown: Record<string, number>;
  topProducts: Array<{
    title: string;
    count: number;
    revenue: number;
  }>;
  selectedStatus: string;
}

const OrderAnalyticsDashboard: React.FC<OrderAnalyticsProps> = ({
  labels,
  orderCounts,
  revenueCounts,
  totalRevenue,
  totalOrders,
  averageOrderValue,
  statusBreakdown,
  categoryBreakdown,
  topProducts,

}) => {
  // Calculate peak month for orders
  const peakOrderMonthIndex = useMemo(() => {
    if (orderCounts.length === 0) return -1;
    return orderCounts.indexOf(Math.max(...orderCounts));
  }, [orderCounts]);
  
  const peakOrderMonth = useMemo(() => 
    peakOrderMonthIndex !== -1 ? labels[peakOrderMonthIndex] : "N/A",
    [labels, peakOrderMonthIndex]);
    
  const maxOrders = useMemo(() => 
    orderCounts.length > 0 ? Math.max(...orderCounts) : 0,
    [orderCounts]);

  // Chart data for orders trend
  const orderTrendData = {
    labels: labels,
    datasets: [
      {
        label: "Orders",
        data: orderCounts,
        borderColor: "rgba(239, 68, 68, 1)",
        backgroundColor: "rgba(239, 68, 68, 0.2)",
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

  // Chart data for revenue trend
  const revenueTrendData = {
    labels: labels,
    datasets: [
      {
        label: "Revenue ($)",
        data: revenueCounts,
        borderColor: "rgba(34, 197, 94, 1)",
        backgroundColor: "rgba(34, 197, 94, 0.2)",
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointBackgroundColor: "#FFF",
        pointBorderColor: "rgba(34, 197, 94, 1)",
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  // Status breakdown chart
  const statusColors = {
    pending: "#F59E0B",
    processing: "#3B82F6",
    paid: "#10B981",
    completed: "#059669",
    cancelled: "#EF4444",
    refunded: "#8B5CF6"
  };

  const statusChartData = {
    labels: Object.keys(statusBreakdown),
    datasets: [{
      data: Object.values(statusBreakdown),
      backgroundColor: Object.keys(statusBreakdown).map(status => 
        statusColors[status as keyof typeof statusColors] || "#6B7280"
      ),
      borderWidth: 2,
      borderColor: "#1F2937"
    }]
  };

  // Category breakdown chart
  const categoryChartData = {
    labels: Object.keys(categoryBreakdown).slice(0, 8), // Top 8 categories
    datasets: [{
      label: "Items Sold",
      data: Object.values(categoryBreakdown).slice(0, 8),
      backgroundColor: "rgba(239, 68, 68, 0.8)",
      borderColor: "rgba(239, 68, 68, 1)",
      borderWidth: 2,
    }]
  };

  // Chart options
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#FFF',
          font: { weight: 'bold' as const }
        }
      },
      title: {
        display: true,
        font: { size: 16, weight: 'bold' as const },
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
        titleFont: { weight: 'bold' as const }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, color: '#FFF' },
        ticks: { precision: 0, color: '#FFF' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      x: {
        title: { display: true, text: 'Month', color: '#FFF' },
        ticks: { color: '#FFF' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
    },
  };

  // 2. CHANGED: Renamed 'doughnutOptions' to 'pieOptions' for clarity.
  // The options are compatible for both Pie and Doughnut charts.
  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#FFF',
          padding: 20,
          font: { weight: 'bold' as const }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#EF4444',
        bodyColor: '#FFF',
        borderColor: '#EF4444',
        borderWidth: 1,
      }
    }
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#EF4444',
        bodyColor: '#FFF',
        borderColor: '#EF4444',
        borderWidth: 1,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Items Sold', color: '#FFF' },
        ticks: { color: '#FFF' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      x: {
        ticks: { color: '#FFF' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
    },
  };

  return (
    <div className="flex flex-col space-y-6">
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-900 border-l-2 border-red-600 p-6 shadow-lg relative">
          <div className="absolute top-0 right-0 mt-4 mr-4">
            <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-300">Total Orders</h3>
          <p className="text-4xl font-bold mt-2 text-white">{totalOrders}</p>
          <div className="mt-2 text-sm text-gray-400">All time orders</div>
        </div>
        
        <div className="bg-gray-900 border-l-2 border-red-600 p-6 shadow-lg relative">
          <div className="absolute top-0 right-0 mt-4 mr-4">
            <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-300">Total Revenue</h3>
          <p className="text-4xl font-bold mt-2 text-white">${totalRevenue.toFixed(2)}</p>
          <div className="mt-2 text-sm text-gray-400">All time revenue</div>
        </div>
        
        <div className="bg-gray-900 border-l-2 border-red-600 p-6 shadow-lg relative">
          <div className="absolute top-0 right-0 mt-4 mr-4">
            <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-300">Average Order Value</h3>
          <p className="text-4xl font-bold mt-2 text-white">${averageOrderValue.toFixed(2)}</p>
          <div className="mt-2 text-sm text-gray-400">Per order average</div>
        </div>
        
        <div className="bg-gray-900 border-l-2 border-red-600 p-6 shadow-lg relative">
          <div className="absolute top-0 right-0 mt-4 mr-4">
            <svg className="w-6 h-6 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-300">Peak Month Orders</h3>
          <p className="text-4xl font-bold mt-2 text-white">{maxOrders}</p>
          <div className="mt-2 text-sm text-gray-400">
            {peakOrderMonth !== "N/A" ? `Highest in ${peakOrderMonth}` : "No data available"}
          </div>
        </div>
      </div>

      {/* No data message */}
      {orderCounts.length === 0 && (
        <div className="bg-gray-900 p-8 border-l-2 border-red-600 shadow-lg text-center">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="text-xl text-gray-300">No order data available for the selected filters</p>
          <p className="text-gray-400 mt-2">Try adjusting your filters or selecting a different date range</p>
        </div>
      )}

      {/* Charts Grid */}
      {orderCounts.length > 0 && (
        <>
          {/* Order and Revenue Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-900 p-6 border-l-2 border-red-600 shadow-lg">
              <div className="flex items-center mb-4">
                <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
                <h3 className="text-xl font-bold text-white">Order Trend</h3>
              </div>
              <div className="h-80">
                <Line data={orderTrendData} options={{
                  ...lineChartOptions,
                  plugins: {
                    ...lineChartOptions.plugins,
                    title: { ...lineChartOptions.plugins.title, text: 'Monthly Order Count' }
                  }
                }} />
              </div>
            </div>

            <div className="bg-gray-900 p-6 border-l-2 border-red-600 shadow-lg">
              <div className="flex items-center mb-4">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <h3 className="text-xl font-bold text-white">Revenue Trend</h3>
              </div>
              <div className="h-80">
                <Line data={revenueTrendData} options={{
                  ...lineChartOptions,
                  plugins: {
                    ...lineChartOptions.plugins,
                    title: { ...lineChartOptions.plugins.title, text: 'Monthly Revenue ($)' }
                  }
                }} />
              </div>
            </div>
          </div>

          {/* Status and Category Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-900 p-6 border-l-2 border-red-600 shadow-lg">
              <div className="flex items-center mb-4">
                <svg className="w-5 h-5 mr-2 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h7a1 1 0 100-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z" clipRule="evenodd" />
                </svg>
                <h3 className="text-xl font-bold text-white">Order Status Breakdown</h3>
              </div>
              <div className="h-80">
                {/* 3. CHANGED: Used the <Pie> component instead of <Doughnut> */}
                <Pie data={statusChartData} options={pieOptions} />
              </div>
            </div>

            <div className="bg-gray-900 p-6 border-l-2 border-red-600 shadow-lg">
              <div className="flex items-center mb-4">
                <svg className="w-5 h-5 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
                <h3 className="text-xl font-bold text-white">Category Performance</h3>
              </div>
              <div className="h-80">
                <Bar data={categoryChartData} options={barChartOptions} />
              </div>
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-gray-900 p-6 border-l-2 border-red-600 shadow-lg">
            <div className="flex items-center mb-4">
              <svg className="w-5 h-5 mr-2 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-bold text-white">Top Products by Revenue</h3>
            </div>
            {topProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="pb-3 text-gray-300 font-semibold">Rank</th>
                      <th className="pb-3 text-gray-300 font-semibold">Product</th>
                      <th className="pb-3 text-gray-300 font-semibold text-center">Units Sold</th>
                      <th className="pb-3 text-gray-300 font-semibold text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((product, index) => (
                      <tr key={index} className="border-b border-gray-800 hover:bg-gray-800 transition-colors">
                        <td className="py-3 text-white font-bold">
                          #{index + 1}
                        </td>
                        <td className="py-3 text-gray-200">
                          <div className="font-medium">{product.title}</div>
                        </td>
                        <td className="py-3 text-center">
                          <span className="bg-red-600 text-white px-2 py-1 rounded-full text-sm font-semibold">
                            {product.count}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <span className="text-green-400 font-bold text-lg">
                            ${product.revenue.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-500 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h12a1 1 0 001-1V7l-7-5zM8.5 13.5a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0z" clipRule="evenodd" />
                </svg>
                <p className="text-gray-400">No product data available</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default OrderAnalyticsDashboard;