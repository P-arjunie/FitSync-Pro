
'use client';

import React, { useEffect, useState } from "react";
import AnalyticsDashboard from "../../Components/analytics/AnalyticsDashboard";

interface AnalyticsData {
  labels: string[];
  bookings: number[];
  trainers: string[];
}

const AnalyticsPage: React.FC = () => {
  // State for analytics data
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    labels: [],
    bookings: [],
    trainers: []
  });
  
  // State for filters
  const [selectedTrainer, setSelectedTrainer] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch analytics data
  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Build query string with filters
      let queryParams = new URLSearchParams();
      if (selectedTrainer !== "all") {
        queryParams.append("trainer", selectedTrainer);
      }
      if (startDate) {
        queryParams.append("startDate", startDate);
      }
      if (endDate) {
        queryParams.append("endDate", endDate);
      }
      
      const response = await fetch(`/api/analytics/sessions?${queryParams.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch analytics data");
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch analytics data");
      }
      
      setAnalyticsData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      console.error("Error fetching analytics data:", err);
      // Set empty data to prevent UI errors
      setAnalyticsData({
        labels: [],
        bookings: [],
        trainers: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on initial load
  useEffect(() => {
    // Set default date range on initial load
    setDefaultMonthRange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch data when filters change
  useEffect(() => {
    if (startDate && endDate) {
      fetchAnalyticsData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTrainer, startDate, endDate]);

  // Calculate current month range for default date filter
  const setDefaultMonthRange = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  };

  // Set previous month range
  const setPreviousMonthRange = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
    
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  };

  // Set last 3 months range
  const setLastThreeMonthsRange = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth() - 3, 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-white relative overflow-hidden">
      {/* Skewed background */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-red-600 transform -skew-x-12 z-0"></div>
      
      <div className="relative z-10 flex-1 p-8 flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <span className="inline-block bg-red-600 text-white text-sm font-bold py-1 px-3 border border-red-600">
            PERFORMANCE METRICS
          </span>
          <h2 className="text-3xl font-bold mt-2 mb-6">Session Analytics Dashboard</h2>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-900 border-l-4 border-red-500 text-red-100 p-4 mb-6 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-gray-900 p-6 mb-6 shadow-lg border-l-2 border-red-600">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
            </svg>
            Filters
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-gray-300 font-semibold mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
                Trainer
              </label>
              <div className="relative">
                <select
                  value={selectedTrainer}
                  onChange={(e) => setSelectedTrainer(e.target.value)}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-none focus:outline-none focus:ring-2 focus:ring-red-500 text-white"
                >
                  <option value="all">All Trainers</option>
                  {analyticsData.trainers.map((trainer) => (
                    <option key={trainer} value={trainer}>{trainer}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-gray-300 font-semibold mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                Start Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-none focus:outline-none focus:ring-2 focus:ring-red-500 text-white"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-gray-300 font-semibold mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                End Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-none focus:outline-none focus:ring-2 focus:ring-red-500 text-white"
                />
              </div>
            </div>
            
            <div className="flex flex-col justify-end space-y-2">
              <button
                onClick={setDefaultMonthRange}
                className="bg-red-600 text-white py-2 px-4 font-bold hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-200 flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                </svg>
                THIS MONTH
              </button>
              <button
                onClick={setPreviousMonthRange}
                className="bg-gray-700 text-white py-2 px-4 font-bold hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition duration-200 flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                LAST MONTH
              </button>
              <button
                onClick={setLastThreeMonthsRange}
                className="bg-gray-700 text-white py-2 px-4 font-bold hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition duration-200 flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                LAST 3 MONTHS
              </button>
            </div>
          </div>
        </div>
      
        {/* Loading state */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <svg className="animate-spin h-12 w-12 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : (
          /* Analytics dashboard */
          <AnalyticsDashboard 
            bookingsData={analyticsData.bookings} 
            bookingLabels={analyticsData.labels}
            selectedTrainer={selectedTrainer}
          />
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;