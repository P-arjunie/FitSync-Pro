

'use client';

import React, { useEffect, useState } from "react";
import AnalyticsDashboard from "../../Components/analytics/AnalyticsDashboard"; // Default import

const AnalyticsPage: React.FC = () => {
  const [bookingsData, setBookingsData] = useState<number[]>([]);
  const [revenueData, setRevenueData] = useState<number[]>([]);

  useEffect(() => {
    // Placeholder data for bookings and revenue
    setBookingsData([50, 100, 150, 200, 180, 220, 300]);
    setRevenueData([1000, 2500, 3000, 4500, 4200, 5500, 7000]);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-4xl font-semibold text-center mb-8">Analytics Dashboard</h1>
      <AnalyticsDashboard bookingsData={bookingsData} revenueData={revenueData} />
    </div>
  );
};

export default AnalyticsPage;
