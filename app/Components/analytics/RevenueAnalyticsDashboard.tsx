import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { RevenueAnalyticsData } from '@/types/analytics';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

interface DashboardProps {
  data: RevenueAnalyticsData;
  groupBy?: "day" | "week" | "month";
}

const RevenueAnalyticsDashboard: React.FC<DashboardProps> = ({ data, groupBy = "day" }) => {
  // Prepare chart data - handle both old and new formats
  const timeSeriesData = data.labels 
    ? data.labels.map((label, i) => ({
        name: label,
        'Pricing Plans': data.pricingPlanRevenue?.[i] || 0,
        'Classes': data.classRevenue?.[i] || 0,
        'Total Revenue': data.totalRevenueArray?.[i] || data.totalRevenue || 0
      }))
    : data.dailyRevenue?.map(day => ({
        name: day.date,
        'Pricing Plans': day.pricingPlans * 100 || 0, // Assuming $100 per plan if amount not available
        'Classes': day.classEnrollments * 50 || 0, // Assuming $50 per enrollment if amount not available
        'Total Revenue': day.revenue || 0
      })) || [];

  // Prepare summary cards data (dark theme, styled like OrderAnalyticsDashboard)
  const summaryCards = [
    {
      title: 'Total Revenue',
      value: data.overallTotalRevenue || data.totalRevenue || 0,
      change: data.comparisonToPreviousPeriod?.totalRevenueChange || 0,
      borderColor: 'border-red-600',
      icon: (
        <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      title: 'Pricing Plans Revenue',
      value: data.totalPricingPlanRevenue || (data.revenueByType ? data.revenueByType['Pricing Plans'] || 0 : 0),
      change: data.comparisonToPreviousPeriod?.pricingPlanRevenueChange || 0,
      borderColor: 'border-green-500',
      icon: (
        <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      title: 'Class Revenue',
      value: data.totalClassRevenue || (data.revenueByType ? data.revenueByType['Classes'] || 0 : 0),
      change: data.comparisonToPreviousPeriod?.classRevenueChange || 0,
      borderColor: 'border-purple-500',
      icon: (
        <svg className="w-6 h-6 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
        </svg>
      )
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {summaryCards.map((card, index) => (
          <div key={index} className={`bg-gray-900 border-l-2 ${card.borderColor} p-6 shadow-lg relative`}>
            <div className="absolute top-0 right-0 mt-4 mr-4">{card.icon}</div>
            <h3 className="text-lg font-medium text-gray-300">{card.title}</h3>
            <p className="text-4xl font-bold mt-2 text-white">${card.value.toLocaleString()}</p>
            <div className={`mt-2 text-sm ${card.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>{card.change >= 0 ? '↑' : '↓'} {Math.abs(card.change).toFixed(1)}% from previous period</div>
          </div>
        ))}
      </div>

      {/* Time Series Chart */}
      {timeSeriesData.length > 0 && (
        <div className="bg-gray-900 p-6 border-l-2 border-red-600 shadow-lg">
          <h3 className="text-lg font-bold mb-4 text-white">Revenue Over Time</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeSeriesData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#fff2" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} tick={{ fill: '#fff' }} />
                <YAxis tick={{ fill: '#fff' }} />
                <Tooltip 
                  contentStyle={{ background: '#fff', border: '1px solid #EF4444', color: '#222' }}
                  itemStyle={{ color: '#222' }}
                  labelStyle={{ color: '#EF4444', fontWeight: 600 }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend wrapperStyle={{ color: '#fff' }} />
                <Bar dataKey="Pricing Plans" fill="#00C49F" />
                <Bar dataKey="Classes" fill="#8884D8" />
                <Bar dataKey="Total Revenue" fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Breakdown Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {[
          
          {
            title: 'Class Performance',
            data: data.classBreakdown || [],
            dataKey: 'revenue',
            nameKey: 'className',
            topItemsTitle: 'Top Classes'
          }
        ].map((chart, index) => (
          <div key={index} className="bg-gray-900 p-6 border-l-2 border-red-600 shadow-lg">
            <h3 className="text-lg font-bold mb-4 text-white">{chart.title}</h3>
            {chart.data.length > 0 ? (
              <>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chart.data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey={chart.dataKey}
                        nameKey={chart.nameKey}
                        label={({ name, percent = 0 }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {chart.data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ background: '#fff', border: '1px solid #EF4444', color: '#222' }}
                        itemStyle={{ color: '#222' }}
                        labelStyle={{ color: '#EF4444', fontWeight: 600 }}
                        formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4">
                  <h4 className="font-medium mb-2 text-white">{chart.topItemsTitle}</h4>
                  <div className="space-y-2">
                    {chart.data.slice(0, 3).map((item, i) => (
                      <div key={i} className="flex justify-between">
                        <span className="truncate text-gray-200">{(item as any)[chart.nameKey]}</span>
                        <span className="font-medium text-green-400">${(item as any)[chart.dataKey].toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No data available for {chart.title.toLowerCase()}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Status Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {[
          {
            title: 'Pricing Plan Statuses',
            data: data.pricingPlanStatuses ? Object.entries(data.pricingPlanStatuses).map(([name, value]) => ({ name, value })) : []
          },
          {
            title: 'Enrollment Statuses',
            data: data.enrollmentStatuses ? Object.entries(data.enrollmentStatuses).map(([name, value]) => ({ name, value })) : []
          }
        ].map((chart, index) => (
          chart.data.length > 0 ? (
            <div key={index} className="bg-gray-900 p-6 border-l-2 border-red-600 shadow-lg">
              <h3 className="text-lg font-bold mb-4 text-white">{chart.title}</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chart.data}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent = 0 }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {chart.data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#fff', border: '1px solid #EF4444', color: '#222' }} itemStyle={{ color: '#222' }} labelStyle={{ color: '#EF4444', fontWeight: 600 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div key={index} className="bg-gray-900 p-6 border-l-2 border-red-600 shadow-lg">
              <h3 className="text-lg font-bold mb-4 text-white">{chart.title}</h3>
              <div className="text-center py-8 text-gray-500">
                No status data available
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
};

export default RevenueAnalyticsDashboard;