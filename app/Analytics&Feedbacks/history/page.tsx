"use client";

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Download,
  Filter,
  Search,
  Users,
  CreditCard,
  ShoppingCart,
  BookOpen,
  DollarSign,
  Activity,
  Clock,
  FileText,
  TrendingUp,
  Eye,
  RefreshCw,
  AlertCircle,
  Printer
} from 'lucide-react';

interface Tab {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  color: string;
}

interface DateRange {
  start: string;
  end: string;
}

interface HistoryItem {
  [key: string]: any;
}

interface ReportData {
  totalPayments?: number;
  totalSessions?: number;
  totalOrders?: number;
  totalEnrollments?: number;
  totalPlans?: number;
  totalRevenue?: number;
  data?: any[];
  [key: string]: any;
}

const AdminHistoryDashboard = () => {
  const [activeTab, setActiveTab] = useState<string>('sessions');
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [filteredData, setFilteredData] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tabs: Tab[] = [
    { id: 'sessions', name: 'Sessions & Classes', icon: Users, color: 'bg-red-600' },
    { id: 'payments', name: 'Payments', icon: CreditCard, color: 'bg-gray-800' },
    { id: 'orders', name: 'Orders', icon: ShoppingCart, color: 'bg-red-600' },
    { id: 'enrollments', name: 'Enrollments', icon: BookOpen, color: 'bg-gray-800' },
    { id: 'pricing-plans', name: 'Pricing Plans', icon: DollarSign, color: 'bg-red-600' }
  ];

  const fetchHistoryData = async (tab: string = activeTab) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        startDate: dateRange.start,
        endDate: dateRange.end,
        status: statusFilter !== 'all' ? statusFilter : ''
      });

      const response = await fetch(`/api/analytics/history/${tab}?${params}`);
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setHistoryData(result.data || []);
        setFilteredData(result.data || []);
      } else {
        console.error('API returned error:', result.error);
        setError(result.error || 'Failed to fetch data');
        setHistoryData([]);
        setFilteredData([]);
      }
    } catch (error) {
      console.error('Error fetching history data:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      setHistoryData([]);
      setFilteredData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateReport = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: activeTab,
          dateRange,
          filters: { status: statusFilter }
        })
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const result = await response.json();
      if (result.success) {
        setReportData(result.reportData);
        setShowReportModal(true);
      } else {
        setError(result.error || 'Failed to generate report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoryData();
  }, [activeTab, dateRange, statusFilter]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = historyData.filter((item: HistoryItem) => 
        JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(historyData);
    }
  }, [searchTerm, historyData]);

  // Safe date formatter to handle potential invalid dates
  const formatDate = (dateString: string | Date | undefined | null) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      console.error('Invalid date:', dateString);
      return 'Invalid date';
    }
  };

  const renderHistoryItem = (item: HistoryItem, index: number) => {
    if (!item) return null;
    
    switch (activeTab) {
      case 'sessions':
        return (
          <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">{item.title || 'Untitled Session'}</h3>
                <p className="text-gray-600">Trainer: {item.trainerName || (item.trainer && item.trainer.name) || 'Unknown Trainer'}</p>
                <p className="text-sm text-gray-500">
                  Type: <span className="font-medium">{item.sessionType || 'Physical'}</span>
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                item.status === 'active' ? 'bg-green-100 text-green-800' :
                item.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                'bg-red-100 text-red-800'
              }`}>
                {item.status || 'Active'}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Participants:</span>
                <p className="font-medium">
                  {typeof item.participants === 'number' 
                    ? item.participants 
                    : (item.currentParticipants || 0)}/
                  {item.maxParticipants || 0}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Location:</span>
                <p className="font-medium">{item.location || (item.onlineLink ? 'Virtual' : 'N/A')}</p>
              </div>
              <div>
                <span className="text-gray-500">Date:</span>
                <p className="font-medium">{formatDate(item.start || item.date || item.createdAt)}</p>
              </div>
              <div>
                <span className="text-gray-500">Created:</span>
                <p className="font-medium">{formatDate(item.createdAt)}</p>
              </div>
            </div>
          </div>
        );
      
      case 'payments':
        return (
          <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  {item.firstName ? `${item.firstName} ${item.lastName || ''}` : 'Unknown User'}
                </h3>
                <p className="text-gray-600">{item.email || 'No email provided'}</p>
                <p className="text-sm text-gray-500">Payment for: {item.paymentFor || 'Unspecified'}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">${item.amount || 0}</p>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  item.paymentStatus === 'succeeded' ? 'bg-green-100 text-green-800' :
                  item.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {item.paymentStatus || 'Unknown'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Currency:</span>
                <p className="font-medium">{item.currency ? item.currency.toUpperCase() : 'USD'}</p>
              </div>
              <div>
                <span className="text-gray-500">Method:</span>
                <p className="font-medium">{item.paymentMethodId || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-500">Date:</span>
                <p className="font-medium">{formatDate(item.createdAt || item.date)}</p>
              </div>
            </div>
          </div>
        );
      
      case 'orders':
        return (
          <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Order #{item.orderNumber || 'N/A'}</h3>
                <p className="text-gray-600">User ID: {item.user || 'Unknown'}</p>
                <p className="text-sm text-gray-500">
                  {item.orderItems && Array.isArray(item.orderItems) ? item.orderItems.length : 0} items
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">${item.totalAmount || 0}</p>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  item.status === 'completed' ? 'bg-green-100 text-green-800' :
                  item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  item.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {item.status || 'Unknown'}
                </span>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <p>Created: {formatDate(item.createdAt)}</p>
              <p>Updated: {formatDate(item.updatedAt || item.createdAt)}</p>
            </div>
          </div>
        );
      
      case 'enrollments':
        return (
          <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">{item.className || 'Unknown Class'}</h3>
                <p className="text-gray-600">User ID: {item.userId || 'Unknown'}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">${item.totalAmount || 0}</p>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  item.status === 'active' ? 'bg-green-100 text-green-800' :
                  item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {item.status || 'Unknown'}
                </span>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <p>Enrolled: {formatDate(item.createdAt)}</p>
            </div>
          </div>
        );
      
      case 'pricing-plans':
        return (
          <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">{item.planName || 'Unknown Plan'}</h3>
                <p className="text-gray-600">User ID: {item.userId || 'Unknown'}</p>
                <p className="text-sm text-gray-500">Price ID: {item.priceId || 'N/A'}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">${item.amount || 0}</p>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  item.status === 'active' ? 'bg-green-100 text-green-800' :
                  item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {item.status || 'Unknown'}
                </span>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <p>Purchased: {formatDate(item.createdAt)}</p>
              {item.stripeCustomerId && <p>Stripe Customer: {item.stripeCustomerId}</p>}
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const renderReportModal = () => {
    if (!showReportModal || !reportData) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {tabs.find(t => t.id === activeTab)?.name} Report
            </h2>
            <button
              onClick={() => setShowReportModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-red-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Total Items</p>
                  <p className="text-2xl font-bold text-red-600">
                    {reportData.totalPayments || reportData.totalSessions || 
                     reportData.totalOrders || reportData.totalEnrollments || 
                     reportData.totalPlans || (reportData.data && reportData.data.length) || 0}
                  </p>
                </div>
              </div>
            </div>
            
            {reportData.totalRevenue !== undefined && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${typeof reportData.totalRevenue === 'number' ? reportData.totalRevenue.toFixed(2) : '0.00'}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Date Range</p>
                  <p className="text-sm font-medium text-blue-600">
                    {formatDate(dateRange.start)} - {formatDate(dateRange.end)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {Object.entries(reportData).map(([key, value]) => {
              if (key === 'totalRevenue' || key === 'totalPayments' || key === 'totalSessions' || 
                  key === 'totalOrders' || key === 'totalEnrollments' || key === 'totalPlans') return null;
              
              if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
                return (
                  <div key={key} className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(value).map(([subKey, subValue]) => (
                        <div key={subKey} className="text-center">
                          <p className="text-sm text-gray-600 capitalize">{subKey}</p>
                          <p className="text-xl font-bold text-gray-800">{String(subValue)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            })}
          </div>

          <div className="flex justify-end space-x-4 mt-8">
            <button
              onClick={() => {
                const dataStr = JSON.stringify(reportData, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${activeTab}-report-${new Date().toISOString().split('T')[0]}.json`;
                link.click();
              }}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-semibold transition duration-200"
            >
              <Download className="h-4 w-4 inline mr-2" />
              Download JSON
            </button>
            <button
              onClick={async () => {
                try {
                  // Show loading state
                  setIsLoading(true);
                  setError(null);
                  
                  // Request PDF format
                  const response = await fetch('/api/admin/reports/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      reportType: activeTab,
                      dateRange,
                      filters: { status: statusFilter },
                      format: "pdf"
                    })
                  });
                  
                  if (!response.ok) {
                    const errorText = await response.text();
                    console.error('API Error Response:', errorText);
                    throw new Error(`API request failed with status ${response.status}: ${errorText}`);
                  }
                  
                  // Get the PDF blob
                  const pdfBlob = await response.blob();
                  
                  if (!pdfBlob || pdfBlob.size === 0) {
                    throw new Error('Received empty PDF data');
                  }
                  
                  // Create a URL for the blob
                  const url = URL.createObjectURL(pdfBlob);
                  
                  // Create a link to download the PDF
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `${activeTab}-report-${new Date().toISOString().split('T')[0]}.pdf`;
                  document.body.appendChild(link); // Needed for Firefox
                  
                  // Click the link to download the PDF
                  link.click();
                  
                  // Clean up
                  setTimeout(() => {
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                  }, 100);
                } catch (error) {
                  console.error('Error downloading PDF:', error);
                  setError(error instanceof Error ? error.message : 'Failed to download PDF');
                } finally {
                  setIsLoading(false);
                }
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition duration-200 flex items-center"
              disabled={isLoading}
            >
              <Download className="h-4 w-4 inline mr-2" />
              {isLoading ? 'Generating PDF...' : 'Print PDF'}
            </button>
            <button
              onClick={() => setShowReportModal(false)}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-black text-white p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Admin History & Reports</h1>
          <p className="text-gray-300">Comprehensive view of all platform activities and analytics</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
            <button 
              onClick={() => setError(null)} 
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-gray-500" />
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="succeeded">Succeeded</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <Search className="h-5 w-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-64"
                />
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => fetchHistoryData()}
                disabled={isLoading}
                className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold transition duration-200 flex items-center"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={generateReport}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg font-semibold transition duration-200 flex items-center"
              >
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </button>
              <button
                onClick={async () => {
                  try {
                    // Show loading state
                    setIsLoading(true);
                    
                    // Create URL parameters
                    const params = new URLSearchParams({
                      type: activeTab,
                      startDate: dateRange.start,
                      endDate: dateRange.end,
                      status: statusFilter !== 'all' ? statusFilter : ''
                    });
                    
                    // Fetch the PDF
                    const response = await fetch(`/api/analytics/history/pdf?${params.toString()}`);
                    
                    if (!response.ok) {
                      throw new Error(`API request failed with status ${response.status}`);
                    }
                    
                    // Get the PDF blob
                    const pdfBlob = await response.blob();
                    
                    // Create a URL for the blob
                    const url = URL.createObjectURL(pdfBlob);
                    
                    // Create a link to download the PDF
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${activeTab}-history-${new Date().toISOString().split('T')[0]}.pdf`;
                    
                    // Click the link to download the PDF
                    link.click();
                    
                    // Clean up
                    URL.revokeObjectURL(url);
                  } catch (error) {
                    console.error('Error downloading PDF:', error);
                    setError(error instanceof Error ? error.message : 'Failed to download PDF');
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-semibold transition duration-200 flex items-center"
              >
                <Printer className="h-4 w-4 mr-2" />
                {isLoading ? 'Generating PDF...' : 'Print History'}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition duration-200 ${
                  activeTab === tab.id
                    ? `${tab.color} text-white shadow-lg`
                    : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
          ) : filteredData.length > 0 ? (
            <>
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">
                  {tabs.find(t => t.id === activeTab)?.name} ({filteredData.length})
                </h2>
              </div>
              <div className="grid gap-6">
                {filteredData.map((item, index) => renderHistoryItem(item, index))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Eye className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Data Found</h3>
              <p className="text-gray-500">No records found for the selected filters and date range.</p>
            </div>
          )}
        </div>
      </div>

      {renderReportModal()}
    </div>
  );
};

export default AdminHistoryDashboard;