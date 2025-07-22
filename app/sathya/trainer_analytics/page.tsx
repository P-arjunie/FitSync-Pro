"use client";
// ...existing code...
import React, { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import autotable from 'jspdf-autotable';
import { Line, Bar, Pie } from 'react-chartjs-2';
import 'chart.js/auto';

interface RevenueAnalytics {
  totalRevenue: number;
  totalSessions: number;
  monthlyRevenue: { month: string; revenue: number }[];
  sessionTypes: { type: string; count: number }[];
  usage?: {
    loginCount: number;
    lastLogin: string | null;
  };
  sessionStatusBreakdown?: { [key: string]: number };
  totalParticipants?: number;
  sessionParticipantCount?: number;
  toBeHeldSessions?: number;
  donePhysicalSessions?: number;
  toBeHeldPhysicalSessions?: number;
  doneVirtualSessions?: number;
  toBeHeldVirtualSessions?: number;
  sessionHistory?: Array<{
    type: string;
    status: string;
    title: string;
    start?: string;
    date?: string;
    currentParticipants?: number;
    participants?: Array<any>;
  }>;
}

const TrainerAnalyticsPage = () => {
  const [analytics, setAnalytics] = useState<RevenueAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trainerEmail, setTrainerEmail] = useState<string | null>(null);
  const [trainerName, setTrainerName] = useState<string | null>(null);
  const [trainerRole, setTrainerRole] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setTrainerEmail(localStorage.getItem('userEmail'));
      setTrainerName(localStorage.getItem('userName'));
      setTrainerRole(localStorage.getItem('userRole'));
    }
  }, []);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!trainerName) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/analytics/trainer?fullName=${encodeURIComponent(trainerName)}`);
        if (!res.ok) throw new Error('Failed to fetch analytics');
        const data = await res.json();
        setAnalytics(data.analytics);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch analytics');
      } finally {
        setLoading(false);
      }
    };
    if (trainerName) fetchAnalytics();
  }, [trainerName]);

  // Chart data
  const revenueLabels = analytics?.monthlyRevenue?.map((m) => m.month) || [];
  const revenueData = analytics?.monthlyRevenue?.map((m) => m.revenue) || [];
  const sessionLabels = analytics?.sessionTypes?.map((s) => s.type) || [];
  const sessionData = analytics?.sessionTypes?.map((s) => s.count) || [];

  // Advanced analytics: session status breakdown, top session types, average session revenue
  const totalSessions = analytics?.totalSessions || 0;
  const totalRevenue = analytics?.totalRevenue || 0;
  const avgSessionRevenue = totalSessions > 0 ? (totalRevenue / totalSessions) : 0;
  const topSessionType = sessionLabels.length > 0 && sessionData.length > 0 ? sessionLabels[sessionData.indexOf(Math.max(...sessionData))] : 'N/A';
  const totalParticipants = analytics?.totalParticipants || 0;
  const sessionParticipantCount = analytics?.sessionParticipantCount || 0;
  const toBeHeldSessions = analytics?.toBeHeldSessions || 0;
  const donePhysicalSessions = analytics?.donePhysicalSessions || 0;
  const toBeHeldPhysicalSessions = analytics?.toBeHeldPhysicalSessions || 0;
  const doneVirtualSessions = analytics?.doneVirtualSessions || 0;
  const toBeHeldVirtualSessions = analytics?.toBeHeldVirtualSessions || 0;
  const sessionHistory = analytics?.sessionHistory || [];

  // Color palette (same as order analytics)
  const colors = {
    red: '#dc2626',
    darkBlue: '#1e293b',
    white: '#fff',
    black: '#000',
    gray: '#6b7280',
    lightGray: '#f3f4f6',
  };

  function formatDate(date: string | null) {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleString();
  }


  // Navigation state
  const [activeTab, setActiveTab] = useState<'analytics' | 'history'>('analytics');

  // Report generation functions
  const generateAnalyticsReport = () => {
    if (!analytics) return;
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#dc2626');
    doc.setFontSize(22);
    doc.text('Trainer Analytics Report', 15, 20);
    doc.setFontSize(14);
    doc.setTextColor('#1e293b');
    doc.text(`Trainer: ${trainerName ?? trainerEmail ?? ''}`, 15, 30);
    doc.setTextColor('#000');
    doc.text(`Date: ${new Date().toLocaleString()}`, 15, 38);

    doc.setFontSize(16);
    doc.setTextColor('#dc2626');
    doc.text('Summary', 15, 50);
    doc.setFontSize(12);
    doc.setTextColor('#000');
    doc.text(`Total Revenue: $${totalRevenue.toFixed(2)}`, 15, 58);
    doc.text(`Total Sessions: ${totalSessions}`, 15, 66);
    doc.text(`Total Participants: ${totalParticipants}`, 15, 74);
    doc.text(`Session Participant Count: ${sessionParticipantCount}`, 15, 82);
    doc.text(`To Be Held Sessions: ${toBeHeldSessions}`, 15, 90);
    doc.text(`Done Sessions: ${donePhysicalSessions + doneVirtualSessions} (Physical: ${donePhysicalSessions}, Virtual: ${doneVirtualSessions})`, 15, 98);
    doc.text(`Top Session Type: ${topSessionType}`, 15, 106);

    doc.setFontSize(14);
    doc.setTextColor('#1e293b');
    doc.text('Monthly Revenue History', 15, 118);
    const revenueTableY = 122;
    autotable(doc, {
      startY: revenueTableY,
      head: [['Month', 'Revenue']],
      body: analytics.monthlyRevenue.map(m => [m.month, `$${m.revenue}`]),
      theme: 'grid',
      headStyles: { fillColor: [220, 38, 38], textColor: [255,255,255], fontStyle: 'bold' },
      bodyStyles: { fillColor: [243,244,246], textColor: [30,41,59] },
      alternateRowStyles: { fillColor: [255,255,255] },
    });

    doc.save('trainer_analytics_report.pdf');
  };

  const generateHistoryReport = () => {
    if (!sessionHistory || sessionHistory.length === 0) return;
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#1e293b');
    doc.setFontSize(22);
    doc.text('Trainer Session History Report', 15, 20);
    doc.setFontSize(14);
    doc.setTextColor('#dc2626');
    doc.text(`Trainer: ${trainerName ?? trainerEmail ?? ''}`, 15, 30);
    doc.setTextColor('#000');
    doc.text(`Date: ${new Date().toLocaleString()}`, 15, 38);

    doc.setFontSize(16);
    doc.setTextColor('#1e293b');
    doc.text('Session History', 15, 50);
    autotable(doc, {
      startY: 54,
      head: [['Type', 'Status', 'Title', 'Date', 'Participants']],
      body: sessionHistory.map(s => [
        s.type,
        s.status,
        s.title,
        new Date(s.start ?? s.date ?? '').toLocaleString(),
        s.currentParticipants || (s.participants?.length ?? 0)
      ]),
      theme: 'grid',
      headStyles: { fillColor: [30,41,59], textColor: [255,255,255], fontStyle: 'bold' },
      bodyStyles: { fillColor: [243,244,246], textColor: [220,38,38] },
      alternateRowStyles: { fillColor: [255,255,255] },
    });

    // Revenue history in history report
    const revenueY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 10 : 120;
    doc.setFontSize(14);
    doc.setTextColor('#dc2626');
    doc.text('Monthly Revenue History', 15, revenueY);
    autotable(doc, {
      startY: revenueY + 4,
      head: [['Month', 'Revenue']],
      body: analytics?.monthlyRevenue?.map(m => [m.month, `$${m.revenue}`]) || [],
      theme: 'grid',
      headStyles: { fillColor: [220, 38, 38], textColor: [255,255,255], fontStyle: 'bold' },
      bodyStyles: { fillColor: [243,244,246], textColor: [30,41,59] },
      alternateRowStyles: { fillColor: [255,255,255] },
    });

    doc.save('trainer_session_history_report.pdf');
  };

  return (
    <div className="min-h-screen flex bg-white">
      <div className="flex-1 flex flex-col relative overflow-hidden p-8">
        {trainerEmail && trainerRole === 'trainer' && (
          <div className="max-w-2xl mx-auto mb-4 flex justify-end">
            <span className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow">
              Hi{trainerName ? `, ${trainerName}` : `, ${trainerEmail}`}! Welcome back
            </span>
          </div>
        )}
        <h2 className="text-3xl font-bold mt-2 mb-6 text-black text-center">Trainer Analytics</h2>

        {/* Mini Navigation Bar */}
        <div className="flex justify-center mb-8">
          <button
            className={`px-6 py-2 rounded-t-lg font-semibold shadow focus:outline-none transition-colors duration-200 ${activeTab === 'analytics' ? 'bg-gray-900 text-white border-b-4 border-red-600' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setActiveTab('analytics')}
          >
            Analytics
          </button>
          <button
            className={`px-6 py-2 rounded-t-lg font-semibold shadow focus:outline-none transition-colors duration-200 ml-2 ${activeTab === 'history' ? 'bg-gray-900 text-white border-b-4 border-darkBlue' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setActiveTab('history')}
          >
            History
          </button>
        </div>

        {(!trainerEmail || trainerRole !== 'trainer') ? (
          <div className="text-center py-12 text-gray-400">
            You must be logged in as an approved trainer to view analytics.
          </div>
        ) : loading ? (
          <div className="flex justify-center my-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-red-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-900 border-l-4 border-red-500 text-red-100 p-4 mb-6 max-w-4xl mx-auto rounded-r-lg">{error}</div>
        ) : !analytics ? (
          <div className="text-center py-20 text-gray-400 text-lg">No analytics data available.</div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-8">
            {activeTab === 'analytics' && (
              <>
                {/* Usage Analytics */}
                <div className="bg-black text-white rounded-lg p-8 shadow-lg flex flex-col md:flex-row justify-between items-center border-l-4 border-gray-600">
                  <div>
                    <div className="text-lg text-white font-semibold">Total Logins</div>
                    <div className="text-3xl font-extrabold text-red-600">{analytics.usage?.loginCount ?? 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-lg text-white font-semibold">Last Login</div>
                    <div className="text-xl font-bold text-gray-300">{formatDate(analytics.usage?.lastLogin ?? null)}</div>
                  </div>
                  <button
                    className="ml-8 bg-red-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-red-700"
                    onClick={generateAnalyticsReport}
                  >
                    Generate Report
                  </button>
                </div>

                {/* Advanced Analytics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
                  <div className="bg-gray-900 border-l-2 border-red-600 p-6 shadow-lg text-white rounded-lg">
                    <div className="text-lg font-semibold mb-2 text-gray-200">Total Revenue</div>
                    <div className="text-3xl font-extrabold text-red-600">${totalRevenue.toFixed(2)}</div>
                  </div>
                  <div className="bg-gray-900 border-l-2 border-darkBlue p-6 shadow-lg text-white rounded-lg">
                    <div className="text-lg font-semibold mb-2 text-gray-200">Total Sessions</div>
                    <div className="text-3xl font-extrabold text-gray-100">{totalSessions}</div>
                  </div>
                  <div className="bg-gray-900 border-l-2 border-gray-600 p-6 shadow-lg text-white rounded-lg">
                    <div className="text-lg font-semibold mb-2 text-gray-200">Total Participants</div>
                    <div className="text-3xl font-extrabold text-gray-100">{totalParticipants}</div>
                  </div>
                  <div className="bg-gray-900 border-l-2 border-black p-6 shadow-lg text-white rounded-lg">
                    <div className="text-lg font-semibold mb-2 text-gray-200">Session Participant Count</div>
                    <div className="text-3xl font-extrabold text-gray-100">{sessionParticipantCount}</div>
                  </div>
                  <div className="bg-gray-900 border-l-2 border-gray-600 p-6 shadow-lg text-white rounded-lg">
                    <div className="text-lg font-semibold mb-2 text-gray-200">To Be Held Sessions</div>
                    <div className="text-3xl font-extrabold text-gray-100">{toBeHeldSessions}</div>
                  </div>
                  <div className="bg-gray-900 border-l-2 border-darkBlue p-6 shadow-lg text-white rounded-lg">
                    <div className="text-lg font-semibold mb-2 text-gray-200">Done Sessions</div>
                    <div className="text-3xl font-extrabold text-gray-100">{donePhysicalSessions + doneVirtualSessions}</div>
                    <div className="text-xs text-gray-400 mt-2">Physical: {donePhysicalSessions} | Virtual: {doneVirtualSessions}</div>
                  </div>
                </div>

                {/* Categorized Sessions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-gray-900 border-l-2 border-red-600 p-6 shadow-lg text-white rounded-lg">
                    <div className="text-lg font-semibold mb-2 text-gray-200">To Be Held Sessions</div>
                    <div className="text-2xl font-extrabold text-gray-100">Physical: {toBeHeldPhysicalSessions}</div>
                    <div className="text-2xl font-extrabold text-gray-100">Virtual: {toBeHeldVirtualSessions}</div>
                  </div>
                  <div className="bg-gray-900 border-l-2 border-darkBlue p-6 shadow-lg text-white rounded-lg">
                    <div className="text-lg font-semibold mb-2 text-gray-200">Done Sessions</div>
                    <div className="text-2xl font-extrabold text-gray-100">Physical: {donePhysicalSessions}</div>
                    <div className="text-2xl font-extrabold text-gray-100">Virtual: {doneVirtualSessions}</div>
                  </div>
                </div>

                {/* Top Session Type */}
                <div className="bg-white rounded-lg p-8 shadow-lg border-l-4 border-red-600">
                  <h3 className="text-xl font-bold mb-4 text-black">Top Session Type</h3>
                  <div className="text-2xl font-bold text-red-600">{topSessionType}</div>
                </div>

                {/* Revenue Trend Chart */}
                <div className="bg-white rounded-lg p-8 shadow-lg border-l-4 border-red-600">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-black">Monthly Revenue Trend</h3>
                    <button
                      className="bg-darkBlue text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-gray-900"
                      onClick={() => {
                        // Download revenue history as CSV
                        if (!analytics?.monthlyRevenue) return;
                        const header = ['Month', 'Revenue'];
                        const rows = analytics.monthlyRevenue.map(m => [m.month, m.revenue]);
                        const csvContent = [header, ...rows].map(e => e.join(',')).join('\n');
                        const dataStr = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
                        const dlAnchorElem = document.createElement('a');
                        dlAnchorElem.setAttribute('href', dataStr);
                        dlAnchorElem.setAttribute('download', 'revenue_history.csv');
                        dlAnchorElem.click();
                      }}
                    >
                      Download Revenue History
                    </button>
                  </div>
                  {revenueLabels.length > 0 ? (
                    <div className="h-64">
                      <Line
                        data={{
                          labels: revenueLabels,
                          datasets: [
                            {
                              label: 'Revenue',
                              data: revenueData,
                              backgroundColor: 'rgba(220,38,38,0.2)',
                              borderColor: colors.red,
                              borderWidth: 3,
                              pointBackgroundColor: colors.red,
                              pointBorderColor: colors.darkBlue,
                              tension: 0.4,
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: { display: false },
                            title: { display: false },
                          },
                          scales: {
                            y: { beginAtZero: true, grid: { color: colors.lightGray } },
                            x: { grid: { color: colors.lightGray } },
                          },
                        }}
                      />
                    </div>
                  ) : (
                    <div className="text-gray-400 text-center">No revenue data for chart.</div>
                  )}
                </div>

                {/* Session Types Chart */}
                <div className="bg-white rounded-lg p-8 shadow-lg border-l-4 border-darkBlue">
                  <h3 className="text-xl font-bold mb-4 text-black">Session Types Distribution</h3>
                  {sessionLabels.length > 0 ? (
                    <div className="h-64">
                      <Bar
                        data={{
                          labels: sessionLabels,
                          datasets: [
                            {
                              label: 'Sessions',
                              data: sessionData,
                              backgroundColor: colors.red,
                              borderColor: colors.darkBlue,
                              borderWidth: 2,
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: { display: false },
                            title: { display: false },
                          },
                          scales: {
                            y: { beginAtZero: true, grid: { color: colors.lightGray } },
                            x: { grid: { color: colors.lightGray } },
                          },
                        }}
                      />
                    </div>
                  ) : (
                    <div className="text-gray-400 text-center">No session data for chart.</div>
                  )}
                </div>

                {/* Advanced: Session Status Pie Chart */}
                {analytics.sessionStatusBreakdown && (
                  <div className="bg-white rounded-lg p-8 shadow-lg border-l-4 border-gray-600">
                    <h3 className="text-xl font-bold mb-4 text-black">Session Status Breakdown</h3>
                    <div className="h-64">
                      <Pie
                        data={{
                          labels: Object.keys(analytics.sessionStatusBreakdown),
                          datasets: [
                            {
                              data: Object.values(analytics.sessionStatusBreakdown),
                              backgroundColor: [colors.red, colors.darkBlue, colors.gray, colors.black],
                              borderColor: colors.white,
                              borderWidth: 2,
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: { position: 'bottom', labels: { color: colors.black } },
                            title: { display: false },
                          },
                        }}
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === 'history' && (
              <>
                {/* Session History */}
                <div className="bg-white rounded-lg p-8 shadow-lg border-l-4 border-gray-600">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-black">Session History</h3>
                    <button
                      className="bg-darkBlue text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-gray-900"
                      onClick={generateHistoryReport}
                    >
                      Generate Report
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-gray-100 text-gray-700">
                          <th className="px-4 py-2 text-left">Type</th>
                          <th className="px-4 py-2 text-left">Status</th>
                          <th className="px-4 py-2 text-left">Title</th>
                          <th className="px-4 py-2 text-left">Date</th>
                          <th className="px-4 py-2 text-left">Participants</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sessionHistory.length === 0 ? (
                          <tr><td colSpan={5} className="text-center py-4 text-gray-400">No session history available.</td></tr>
                        ) : (
                          sessionHistory.map((s: any, idx: number) => (
                            <tr key={idx} className="border-b border-gray-200">
                              <td className="px-4 py-2">{s.type}</td>
                              <td className="px-4 py-2">{s.status}</td>
                              <td className="px-4 py-2">{s.title}</td>
                          <td className="px-4 py-2">{new Date(s.start ?? s.date ?? '').toLocaleString()}</td>
                              <td className="px-4 py-2">{s.currentParticipants || (s.participants?.length ?? 0)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};


export default TrainerAnalyticsPage;
