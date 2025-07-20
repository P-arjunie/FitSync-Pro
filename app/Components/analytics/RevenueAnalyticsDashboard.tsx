// components/analytics/RevenueAnalyticsDashboard.tsx
import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { RevenueAnalyticsData } from '@/types/analytics';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

interface DashboardProps {
  data: RevenueAnalyticsData;
  groupBy?: 'day' | 'week' | 'month';
}

const RevenueAnalyticsDashboard: React.FC<DashboardProps> = ({ data, groupBy = 'day' }) => {
  // Prepare time series data
  const timeSeriesData = data.labels?.length 
    ? data.labels.map((label, i) => ({
        name: label,
        'Pricing Plans': data.pricingPlanRevenue?.[i] || 0,
        'Classes': data.classRevenue?.[i] || 0,
        'Total Revenue': data.totalRevenueArray?.[i] || 0
      }))
    : data.dailyRevenue?.map(day => ({
        name: day.date,
        'Pricing Plans': day.pricingPlans || 0,
        'Classes': day.classEnrollments || 0,
        'Total Revenue': day.revenue || 0
      })) || [];

  // Summary cards data
  const summaryCards = [
    {
      title: 'Total Revenue',
      value: data.totalRevenue || 0,
      change: data.comparisonToPreviousPeriod?.totalRevenueChange || 0,
      borderColor: 'border-blue-500'
    },
    {
      title: 'Pricing Plans',
      value: data.totalPricingPlanRevenue || 0,
      change: data.comparisonToPreviousPeriod?.pricingPlanRevenueChange || 0,
      borderColor: 'border-green-500'
    },
    {
      title: 'Classes',
      value: data.totalClassRevenue || 0,
      change: data.comparisonToPreviousPeriod?.classRevenueChange || 0,
      borderColor: 'border-purple-500'
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {summaryCards.map((card, index) => (
          <div key={index} className={`bg-white p-6 rounded-lg shadow border-l-4 ${card.borderColor}`}>
            <h3 className="text-gray-500 font-medium">{card.title}</h3>
            <p className="text-3xl font-bold">{formatCurrency(card.value)}</p>
            <p className={`text-sm ${card.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {card.change >= 0 ? '↑' : '↓'} 
              {Math.abs(card.change).toFixed(1)}% from previous period
            </p>
          </div>
        ))}
      </div>
      
      {/* Time Series Chart */}
      {timeSeriesData.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-bold mb-4">Revenue Over Time</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeSeriesData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={70} 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                  labelFormatter={(label) => `Period: ${label}`}
                />
                <Legend />
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
            title: 'Pricing Plan Performance',
            data: data.pricingPlanBreakdown || [],
            dataKey: 'revenue',
            nameKey: 'planName',
            topItemsTitle: 'Top Pricing Plans'
          },
          {
            title: 'Class Performance',
            data: data.classBreakdown || [],
            dataKey: 'revenue',
            nameKey: 'className',
            topItemsTitle: 'Top Classes'
          }
        ].map((chart, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-bold mb-4">{chart.title}</h3>
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
                        formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4">
                  <h4 className="font-medium mb-2">{chart.topItemsTitle}</h4>
                  <div className="space-y-2">
                    {chart.data.slice(0, 3).map((item, i) => (
                      <div key={i} className="flex justify-between">
                        <span className="truncate">{(item as any)[chart.nameKey]}</span>
                        <span className="font-medium">{formatCurrency((item as any)[chart.dataKey])}</span>
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
    </div>
  );
};

export default RevenueAnalyticsDashboard;