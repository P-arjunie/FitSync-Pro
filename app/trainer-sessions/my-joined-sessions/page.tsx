"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../../Components/ui/card";
import { Separator } from "../../Components/ui/separator";
import { Clock, MapPin, Users, User, Calendar, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import moment from "moment";

interface Session {
  _id: string;
  title: string;
  trainerName: string;
  start: string;
  end: string;
  location: string;
  maxParticipants: number;
  currentParticipants?: number;
  description?: string;
  status?: string;
  approvedCount?: number;
}

const MyJoinedSessionsPage: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ userId: string; name: string } | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const router = useRouter();

  useEffect(() => {
    // Get user info from localStorage
    const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
    const name = typeof window !== "undefined" ? localStorage.getItem("userName") : null;
    if (userId) {
      setUser({ userId, name: name || "" });
    } else {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    const fetchJoinedSessions = async () => {
      setIsLoading(true);
      try {
        // Fetch SessionParticipant records for this user
        const res = await fetch(`/api/sessions/${user.userId}/joined`);
        if (!res.ok) throw new Error("Failed to fetch joined sessions");
        const data = await res.json();
        
        // For each session, fetch approved participant count
        const sessionsWithCounts = await Promise.all(
          data.map(async (item: any) => {
            let approvedCount = 0;
            if (item.session && item.session._id && item.status === 'approved') {
              try {
                const countRes = await fetch(`/api/sessions/${item.session._id}/participants`);
                if (countRes.ok) {
                  const countData = await countRes.json();
                  approvedCount = countData.counts?.approved || 0;
                }
              } catch (e) { /* ignore */ }
            }
            return { ...item.session, status: item.status, approvedCount };
          })
        );
        if (isMounted) {
          setSessions(sessionsWithCounts);
        }
      } catch (error) {
        if (isMounted) setSessions([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchJoinedSessions();
    return () => { isMounted = false; };
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full";
    switch (status) {
      case 'approved':
        return `${baseClasses} bg-green-100 text-green-800 border border-green-200`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800 border border-yellow-200`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800 border border-red-200`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 border border-gray-200`;
    }
  };

  const isUpcoming = (startDate: string) => {
    return moment(startDate).isAfter(moment());
  };

  const filteredSessions = sessions.filter(session => {
    if (activeFilter === 'upcoming') {
      return isUpcoming(session.start);
    } else if (activeFilter === 'past') {
      return !isUpcoming(session.start);
    }
    return true; // 'all' filter
  });

  const getFilterCounts = () => {
    const upcoming = sessions.filter(session => isUpcoming(session.start)).length;
    const past = sessions.filter(session => !isUpcoming(session.start)).length;
    return { all: sessions.length, upcoming, past };
  };

  const filterCounts = getFilterCounts();

  if (user === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-t-lg">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6" />
              My Training Sessions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <p className="text-red-700 font-medium">Authentication Required</p>
              <p className="text-red-600 text-sm mt-1">Please log in to view your joined sessions.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Training Sessions</h1>
          <p className="text-gray-600">Track and manage your joined training sessions</p>
        </div>

        {/* Filter Tabs */}
        {!isLoading && sessions.length > 0 && (
          <div className="mb-8">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-2">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                    activeFilter === 'all'
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  All Sessions
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    activeFilter === 'all' 
                      ? 'bg-white/20 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {filterCounts.all}
                  </span>
                </button>
                
                <button
                  onClick={() => setActiveFilter('upcoming')}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                    activeFilter === 'upcoming'
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  Upcoming
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    activeFilter === 'upcoming' 
                      ? 'bg-white/20 text-white' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {filterCounts.upcoming}
                  </span>
                </button>
                
                <button
                  onClick={() => setActiveFilter('past')}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                    activeFilter === 'past'
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  Completed
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    activeFilter === 'past' 
                      ? 'bg-white/20 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {filterCounts.past}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Loading your sessions...</p>
            </div>
          </div>
        ) : filteredSessions.length === 0 && sessions.length > 0 ? (
          <Card className="shadow-xl border-0">
            <CardContent className="p-12 text-center">
              <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                {activeFilter === 'upcoming' ? (
                  <Clock className="w-12 h-12 text-gray-400" />
                ) : (
                  <CheckCircle className="w-12 h-12 text-gray-400" />
                )}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {activeFilter === 'upcoming' ? 'No Upcoming Sessions' : 'No Completed Sessions'}
              </h3>
              <p className="text-gray-600 mb-6">
                {activeFilter === 'upcoming' 
                  ? 'You don\'t have any upcoming training sessions.'
                  : 'You haven\'t completed any training sessions yet.'
                }
              </p>
              {activeFilter === 'upcoming' && (
                <button 
                  onClick={() => router.push("/sessions")}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Browse Sessions
                </button>
              )}
            </CardContent>
          </Card>
        ) : sessions.length === 0 ? (
          <Card className="shadow-xl border-0">
            <CardContent className="p-12 text-center">
              <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <Calendar className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Sessions Yet</h3>
              <p className="text-gray-600 mb-6">You haven't joined any training sessions yet.</p>
              <button 
                onClick={() => router.push("/sessions")}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Browse Sessions
              </button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredSessions.map((session) => (
              <Card key={session._id} className="shadow-lg border-0 hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="bg-gradient-to-r from-black to-gray-900 px-6 py-4">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">{session.title}</h3>
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2 text-gray-300">
                          <User className="w-4 h-4" />
                          <span className="text-sm font-medium">{session.trainerName}</span>
                        </div>
                        {session.status && (
                          <div className={getStatusBadge(session.status)}>
                            {getStatusIcon(session.status)}
                            {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                          </div>
                        )}
                        {isUpcoming(session.start) && (
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 text-xs font-semibold rounded-full border border-blue-200">
                            Upcoming
                          </span>
                        )}
                        {!isUpcoming(session.start) && (
                          <span className="bg-gray-100 text-gray-800 px-3 py-1 text-xs font-semibold rounded-full border border-gray-200">
                            Completed
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                      <Users className="w-5 h-5 text-red-400" />
                      <span className="text-white font-semibold">
                        {session.status === 'approved' ? session.approvedCount || 1 : 0} / {session.maxParticipants}
                      </span>
                    </div>
                  </div>
                </div>

                <CardContent className="p-6 bg-white">
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="bg-red-100 p-2 rounded-full">
                        <Clock className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 font-medium">Date & Time</p>
                        <p className="text-gray-900 font-semibold">
                          {moment(session.start).format("MMM D, YYYY")}
                        </p>
                        <p className="text-sm text-gray-600">
                          {moment(session.start).format("h:mm A")} - {moment(session.end).format("h:mm A")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="bg-red-100 p-2 rounded-full">
                        <MapPin className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 font-medium">Location</p>
                        <p className="text-gray-900 font-semibold">{session.location}</p>
                      </div>
                    </div>
                  </div>

                  {session.description && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <div className="w-1 h-4 bg-red-500 rounded-full"></div>
                        Session Description
                      </h4>
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-4">
                        <p className="text-gray-700 leading-relaxed">{session.description}</p>
                      </div>
                    </div>
                  )}

                  {/* Status-specific information */}
                  {session.status === 'pending' && (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                        <p className="text-yellow-800 font-medium">Approval Pending</p>
                      </div>
                      <p className="text-yellow-700 text-sm mt-1">
                        Your request to join this session is being reviewed by the trainer.
                      </p>
                    </div>
                  )}

                  {session.status === 'approved' && isUpcoming(session.start) && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <p className="text-green-800 font-medium">You're All Set!</p>
                      </div>
                      <p className="text-green-700 text-sm mt-1">
                        Your participation has been confirmed. Don't forget to attend!
                      </p>
                    </div>
                  )}

                  {session.status === 'rejected' && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-5 h-5 text-red-600" />
                        <p className="text-red-800 font-medium">Request Declined</p>
                      </div>
                      <p className="text-red-700 text-sm mt-1">
                        Unfortunately, your request to join this session was not approved.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyJoinedSessionsPage;