"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../../Components/ui/card";
import { Badge } from "../../Components/ui/badge";
import { Separator } from "../../Components/ui/separator";
import { Clock, MapPin, Users, Edit3, Calendar, X, Eye, CheckCircle, XCircle, AlertCircle, UserCheck } from "lucide-react";
import moment from "moment";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "../../Components/ui/dialog";
import { Button } from "../../Components/ui/button";

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
  canceled?: boolean;
  cancellationReason?: string;
  status?: 'active' | 'cancelled' | 'completed';
}

interface Participant {
  _id: string;
  userName: string;
  userEmail: string;
  joinedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  sessionId: string;
  sessionTitle?: string;
}

const TrainerSessionsPage: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ userId: string; role: string; name: string } | null>(null);
  const router = useRouter();
  const [editSession, setEditSession] = useState<Session | null>(null);
  const [editMaxParticipants, setEditMaxParticipants] = useState<number>(0);
  const [rescheduleSession, setRescheduleSession] = useState<Session | null>(null);
  const [rescheduleStart, setRescheduleStart] = useState("");
  const [rescheduleEnd, setRescheduleEnd] = useState("");
  const [rescheduleLocation, setRescheduleLocation] = useState("");
  const [cancelSession, setCancelSession] = useState<Session | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [participantsSession, setParticipantsSession] = useState<Session | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [allParticipants, setAllParticipants] = useState<Participant[]>([]);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled' | 'requests'>('upcoming');
  const [pendingRequests, setPendingRequests] = useState<Participant[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [individualSessions, setIndividualSessions] = useState<any[]>([]);
  const [selectedIndividualSession, setSelectedIndividualSession] = useState<any | null>(null);

  useEffect(() => {
    // Get trainer info from localStorage
    const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
    const role = typeof window !== "undefined" ? localStorage.getItem("userRole") : null;
    const name = typeof window !== "undefined" ? localStorage.getItem("userName") : null;
    if (userId && role === "trainer") {
      setUser({ userId, role, name: name || "" });
    } else {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    const fetchSessions = async () => {
      setIsLoading(true);
      try {
        // Fetch sessions for this trainer
        const response = await fetch(`/api/sessions?trainerId=${user.userId}`);
        if (!response.ok) throw new Error("Failed to fetch sessions");
        const data = await response.json();
        if (isMounted) {
          setSessions(data.map((session: any) => ({
            ...session,
            start: session.start,
            end: session.end,
          })));
        }
      } catch (error) {
        if (isMounted) setSessions([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchSessions();
    return () => { isMounted = false; };
  }, [user]);

  useEffect(() => {
    // Fetch participants for each session
    const fetchAllParticipants = async () => {
      let participantsArr: Participant[] = [];
      let pendingArr: Participant[] = [];
      
      for (const session of sessions) {
        const res = await fetch(`/api/sessions/${session._id}/participants`);
        if (res.ok) {
          const data = await res.json();
          // Accept both array and {all: array} response
          const sessionParticipants = Array.isArray(data) ? data : data.all || [];
          
          // Add session info to participants
          const participantsWithSession = sessionParticipants.map((p: any) => ({
            ...p,
            sessionId: session._id,
            sessionTitle: session.title
          }));
          
          participantsArr = participantsArr.concat(participantsWithSession);
          
          // Filter pending requests
          const pending = participantsWithSession.filter((p: Participant) => p.status === 'pending');
          pendingArr = pendingArr.concat(pending);
        }
      }
      
      setAllParticipants(participantsArr);
      setPendingRequests(pendingArr);
      setTotalParticipants(participantsArr.length);
    };
    
    if (sessions.length > 0) fetchAllParticipants();
  }, [sessions]);

  // Fetch individual sessions (approved requests)
  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    const fetchIndividualSessions = async () => {
      try {
        const res = await fetch(`/api/session-request?trainerId=${user.userId}`);
        if (res.ok) {
          const data = await res.json();
          const approved = (data.requests || []).filter((r: any) => r.status === 'approved');
          if (isMounted) setIndividualSessions(approved);
        }
      } catch {}
    };
    fetchIndividualSessions();
    return () => { isMounted = false; };
  }, [user]);

  // Filter sessions by status
  const filteredSessions = useMemo(() => {
    const now = new Date();
    return sessions.filter(session => {
      switch (activeTab) {
        case 'upcoming':
          return !session.canceled && new Date(session.start) > now;
        case 'completed':
          return !session.canceled && new Date(session.end) <= now;
        case 'cancelled':
          return session.canceled || session.status === 'cancelled';
        default:
          return true;
      }
    });
  }, [sessions, activeTab]);

  // Merge group and individual sessions for display
  const allCalendarSessions = useMemo(() => {
    return [
      ...sessions.map(s => ({ ...s, type: 'group' })),
      ...individualSessions.map(r => ({
        _id: r._id,
        title: r.sessionName,
        trainerName: r.trainerName,
        start: r.preferredDate + 'T' + (r.startTime || '00:00'),
        end: r.preferredDate + 'T' + (r.endTime || '00:00'),
        location: r.sessionType === 'Physical' ? r.place : r.meetingLink,
        description: r.description,
        memberName: r.memberName,
        memberEmail: r.memberEmail,
        sessionType: r.sessionType,
        pricingPlan: r.pricingPlan,
        type: 'individual',
      }))
    ];
  }, [sessions, individualSessions]);

  // Session statistics
  const sessionStats = useMemo(() => {
    const now = new Date();
    const upcoming = sessions.filter(s => !s.canceled && new Date(s.start) > now).length;
    const completed = sessions.filter(s => !s.canceled && new Date(s.end) <= now).length;
    const cancelled = sessions.filter(s => s.canceled || s.status === 'cancelled').length;
    const totalParticipants = allParticipants.filter(p => p.status === "approved").length;
    const pendingRequestsCount = pendingRequests.length;
    
    return { upcoming, completed, cancelled, totalParticipants, pendingRequestsCount };
  }, [sessions, allParticipants, pendingRequests]);

  if (user === null) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="w-full max-w-md shadow-xl border-red-200">
          <CardHeader className="bg-gradient-to-r from-red-600 to-red-700 text-white">
            <CardTitle className="text-center">Access Restricted</CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <p className="text-gray-700">You must be logged in as a trainer to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Edit maxParticipants
  const handleEdit = (session: Session) => {
    setEditSession(session);
    setEditMaxParticipants(session.maxParticipants);
  };
  const submitEdit = async () => {
    if (!editSession) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/sessions/${editSession._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxParticipants: editMaxParticipants })
      });
      if (res.ok) {
        const updated = await res.json();
        setSessions(sessions => sessions.map(s => s._id === updated._id ? updated : s));
        setEditSession(null);
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Reschedule
  const handleReschedule = (session: Session) => {
    setRescheduleSession(session);
    setRescheduleStart(session.start);
    setRescheduleEnd(session.end);
    setRescheduleLocation(session.location);
  };
  const submitReschedule = async () => {
    if (!rescheduleSession) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/sessions/${rescheduleSession._id}/reschedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            newStart: rescheduleStart,
            newEnd: rescheduleEnd,
            location: rescheduleLocation,
            rescheduledBy: user?.name || "Trainer"
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(sessions => sessions.map(s => s._id === data.updatedSession._id ? data.updatedSession : s));
        setRescheduleSession(null);
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Cancel
  const handleCancel = (session: Session) => {
    setCancelSession(session);
    setCancelReason("");
  };
  const submitCancel = async () => {
    if (!cancelSession || !cancelReason.trim()) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/sessions/${cancelSession._id}/cancel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason, cancelledBy: user?.name || "Trainer" })
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(sessions => sessions.map(s => s._id === data.updatedSession._id ? data.updatedSession : s));
        setCancelSession(null);
      }
    } finally {
      setActionLoading(false);
    }
  };

  // View Participants
  const handleViewParticipants = async (session: Session) => {
    setParticipantsSession(session);
    setParticipantsLoading(true);
    try {
      const res = await fetch(`/api/sessions/${session._id}/participants`);
      if (res.ok) {
        const data = await res.json();
        setParticipants(Array.isArray(data) ? data : data.all || []);
      } else {
        setParticipants([]);
      }
    } finally {
      setParticipantsLoading(false);
    }
  };

  // Approve/Reject from main requests tab
  const handleApproveRequest = async (participant: Participant) => {
    setRequestsLoading(true);
    try {
      const res = await fetch(`/api/sessions/${participant.sessionId}/approve-booking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId: participant._id })
      });
      
      if (res.ok) {
        // Remove from pending requests
        setPendingRequests(prev => prev.filter(p => p._id !== participant._id));
        
        // Update allParticipants
        setAllParticipants(prev => prev.map(p => 
          p._id === participant._id ? { ...p, status: 'approved' as const } : p
        ));
      }
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleRejectRequest = async (participant: Participant) => {
    setRequestsLoading(true);
    try {
      const res = await fetch(`/api/sessions/${participant.sessionId}/reject-booking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId: participant._id })
      });
      
      if (res.ok) {
        // Remove from pending requests
        setPendingRequests(prev => prev.filter(p => p._id !== participant._id));
        
        // Update allParticipants
        setAllParticipants(prev => prev.map(p => 
          p._id === participant._id ? { ...p, status: 'rejected' as const } : p
        ));
      }
    } finally {
      setRequestsLoading(false);
    }
  };

  // Approve/Reject from participant modal
  const handleApprove = async (participantId: string) => {
    if (!participantsSession) return;
    await fetch(`/api/sessions/${participantsSession._id}/approve-booking`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId })
    });
    handleViewParticipants(participantsSession); // Refresh
    
    // Also update pending requests if this participant was pending
    setPendingRequests(prev => prev.filter(p => p._id !== participantId));
  };
  
  const handleReject = async (participantId: string) => {
    if (!participantsSession) return;
    await fetch(`/api/sessions/${participantsSession._id}/reject-booking`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId })
    });
    handleViewParticipants(participantsSession); // Refresh
    
    // Also update pending requests if this participant was pending
    setPendingRequests(prev => prev.filter(p => p._id !== participantId));
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-black to-gray-900 text-white py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Session Management</h1>
          <p className="text-gray-300">Welcome back, {user.name}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card className="border-l-4 border-l-red-500 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Upcoming Sessions</p>
                  <p className="text-3xl font-bold text-black">{sessionStats.upcoming}</p>
                </div>
                <Calendar className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-3xl font-bold text-black">{sessionStats.completed}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-gray-500 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Cancelled</p>
                  <p className="text-3xl font-bold text-black">{sessionStats.cancelled}</p>
                </div>
                <XCircle className="h-8 w-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Participants</p>
                  <p className="text-3xl font-bold text-black">{sessionStats.totalParticipants}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Requests</p>
                  <p className="text-3xl font-bold text-black">{sessionStats.pendingRequestsCount}</p>
                </div>
                <UserCheck className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'upcoming', label: 'Upcoming Sessions', count: sessionStats.upcoming },
                { key: 'completed', label: 'Completed', count: sessionStats.completed },
                { key: 'cancelled', label: 'Cancelled', count: sessionStats.cancelled },
                { key: 'requests', label: 'Participant Requests', count: sessionStats.pendingRequestsCount },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } transition-colors ${tab.key === 'requests' && tab.count > 0 ? 'relative' : ''}`}
                >
                  {tab.label} ({tab.count})
                  {tab.key === 'requests' && tab.count > 0 && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-orange-500 rounded-full animate-pulse"></span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'requests' ? (
          /* Participant Requests Tab */
          <Card className="shadow-lg border-gray-200">
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <UserCheck className="h-6 w-6 text-orange-500" />
                Participant Requests
              </CardTitle>
              <p className="text-sm text-gray-600">Review and manage pending participant requests across all your sessions.</p>
            </CardHeader>
            <CardContent className="p-0">
              {pendingRequests.length === 0 ? (
                <div className="text-center py-12">
                  <UserCheck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500 text-lg">No pending participant requests.</p>
                  <p className="text-gray-400 text-sm mt-2">All current requests have been processed.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {pendingRequests.map((participant, index) => (
                    <div key={participant._id} className={`p-6 hover:bg-gray-50 transition-colors ${index === 0 ? 'rounded-t-lg' : ''} ${index === pendingRequests.length - 1 ? 'rounded-b-lg' : ''}`}>
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        {/* Participant Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-lg font-semibold text-black">{participant.userName}</h3>
                            <Badge className="bg-orange-100 text-orange-800 border-orange-200 font-medium px-3 py-1">
                              Pending Approval
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2 text-gray-700">
                              <Users className="w-4 h-4 text-red-500" />
                              <span className="font-medium">Session:</span>
                              <span>{participant.sessionTitle}</span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-gray-700">
                              <Clock className="w-4 h-4 text-red-500" />
                              <span className="font-medium">Request Date:</span>
                              <span>{moment(participant.joinedAt).format("MMM D, YYYY h:mm A")}</span>
                            </div>
                          </div>

                          <div className="mt-3">
                            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md border-l-4 border-l-orange-500">
                              <span className="font-medium">Email:</span> {participant.userEmail}
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-2 lg:flex-col lg:w-auto">
                          <Button
                            size="sm"
                            onClick={() => handleApproveRequest(participant)}
                            disabled={requestsLoading}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            {requestsLoading ? "Processing..." : "Approve"}
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectRequest(participant)}
                            disabled={requestsLoading}
                            className="border-red-300 text-red-700 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            {requestsLoading ? "Processing..." : "Reject"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Sessions List */
          <Card className="shadow-lg border-gray-200">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent"></div>
                </div>
              ) : allCalendarSessions.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500 text-lg">No {activeTab} sessions found.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {allCalendarSessions.map((session, index) => (
                    <div key={session._id} className={`p-6 hover:bg-gray-50 transition-colors ${index === 0 ? 'rounded-t-lg' : ''} ${index === allCalendarSessions.length - 1 ? 'rounded-b-lg' : ''}`}>
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        {/* Session Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-xl font-semibold text-black">{session.title}</h3>
                            {session.type === 'individual' && (
                              <Badge className="bg-purple-100 text-purple-800 border-purple-200 font-medium px-3 py-1">
                                Individual Session
                              </Badge>
                            )}
                            {session.status && (
                              <Badge className={`${
                                session.status === 'cancelled' || session.canceled
                                  ? 'bg-red-100 text-red-800 border-red-200'
                                  : session.status === 'completed'
                                  ? 'bg-green-100 text-green-800 border-green-200'
                                  : 'bg-blue-100 text-blue-800 border-blue-200'
                              } font-medium px-3 py-1`}>
                                {session.canceled ? 'Cancelled' : session.status?.charAt(0).toUpperCase() + session.status?.slice(1)}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center gap-2 text-gray-700">
                              <Clock className="w-4 h-4 text-red-500" />
                              <span className="font-medium">
                                {moment(session.start).format("MMM D, YYYY")}
                              </span>
                              <span className="text-gray-500">
                                {moment(session.start).format("h:mm A")} - {moment(session.end).format("h:mm A")}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-gray-700">
                              <MapPin className="w-4 h-4 text-red-500" />
                              <span>{session.location}</span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-gray-700">
                              <Users className="w-4 h-4 text-red-500" />
                              <span>
                                <span className="font-medium">{session.currentParticipants || 0}</span>
                                <span className="text-gray-500">/{session.maxParticipants} participants</span>
                              </span>
                            </div>
                          </div>

                          {session.description && (
                            <div className="mt-3">
                              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md border-l-4 border-l-red-500">
                                {session.description}
                              </p>
                            </div>
                          )}

                          {session.canceled && session.cancellationReason && (
                            <div className="mt-3">
                              <p className="text-sm text-red-700 bg-red-50 p-3 rounded-md border-l-4 border-l-red-500">
                                <span className="font-medium">Cancellation reason:</span> {session.cancellationReason}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-2 lg:flex-col lg:w-auto">
                          {session.type === 'individual' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedIndividualSession(session)}
                              className="border-purple-300 text-purple-700 hover:bg-purple-50"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewParticipants(session)}
                                className="border-gray-300 hover:bg-gray-50 text-gray-700"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Participants
                              </Button>
                              
                              {!session.canceled && activeTab === 'upcoming' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEdit(session)}
                                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                                  >
                                    <Edit3 className="w-4 h-4 mr-2" />
                                    Edit Capacity
                                  </Button>
                                  
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleReschedule(session)}
                                    className="border-orange-300 text-orange-700 hover:bg-orange-50"
                                  >
                                    <Calendar className="w-4 h-4 mr-2" />
                                    Reschedule
                                  </Button>
                                  
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCancel(session)}
                                    className="border-red-300 text-red-700 hover:bg-red-50"
                                  >
                                    <X className="w-4 h-4 mr-2" />
                                    Cancel
                                  </Button>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Participants Modal */}
      <Dialog open={!!participantsSession} onOpenChange={open => !open && setParticipantsSession(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Participants for "{participantsSession?.title}"
            </DialogTitle>
          </DialogHeader>
          {participantsLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-red-500 border-t-transparent"></div>
            </div>
          ) : participants.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No participants registered yet.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {participants.map((p) => (
                <div key={p._id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex-1">
                    <div className="font-semibold text-black">{p.userName}</div>
                    <div className="text-sm text-gray-600">{p.userEmail}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Joined: {new Date(p.joinedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={`${
                      p.status === 'approved' ? 'bg-green-100 text-green-800 border-green-200' :
                      p.status === 'rejected' ? 'bg-red-100 text-red-800 border-red-200' :
                      'bg-yellow-100 text-yellow-800 border-yellow-200'
                    } px-3 py-1 font-medium`}>
                      {p.status}
                    </Badge>
                    {p.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700 text-white" 
                          onClick={() => handleApprove(p._id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-red-300 text-red-700 hover:bg-red-50" 
                          onClick={() => handleReject(p._id)}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editSession} onOpenChange={open => !open && setEditSession(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Session Capacity</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Participants
            </label>
            <input 
              type="number" 
              min={1} 
              value={editMaxParticipants} 
              onChange={e => setEditMaxParticipants(Number(e.target.value))} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500" 
            />
            <p className="text-xs text-gray-500 mt-1">
              Current participants: {editSession?.currentParticipants || 0}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSession(null)}>
              Cancel
            </Button>
            <Button 
              onClick={submitEdit} 
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {actionLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Modal */}
      <Dialog open={!!rescheduleSession} onOpenChange={open => !open && setRescheduleSession(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Session</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
              <input 
                type="datetime-local" 
                value={moment(rescheduleStart).format("YYYY-MM-DDTHH:mm")} 
                onChange={e => setRescheduleStart(e.target.value)} 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
              <input 
                type="datetime-local" 
                value={moment(rescheduleEnd).format("YYYY-MM-DDTHH:mm")} 
                onChange={e => setRescheduleEnd(e.target.value)} 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <input 
                type="text" 
                value={rescheduleLocation} 
                onChange={e => setRescheduleLocation(e.target.value)} 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500" 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleSession(null)}>
              Cancel
            </Button>
            <Button 
              onClick={submitReschedule} 
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {actionLoading ? "Rescheduling..." : "Reschedule Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Modal */}
      <Dialog open={!!cancelSession} onOpenChange={open => !open && setCancelSession(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Session</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Cancellation *
            </label>
            <textarea 
              value={cancelReason} 
              onChange={e => setCancelReason(e.target.value)} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500" 
              rows={4}
              placeholder="Please provide a reason for cancelling this session..."
            />
            <p className="text-xs text-gray-500 mt-1">
              This reason will be shared with all registered participants.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelSession(null)}>
              Keep Session
            </Button>
            <Button 
              onClick={submitCancel} 
              disabled={actionLoading || !cancelReason.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {actionLoading ? "Cancelling..." : "Cancel Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Individual Session Details Modal */}
      <Dialog open={!!selectedIndividualSession} onOpenChange={open => !open && setSelectedIndividualSession(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Session Details for "{selectedIndividualSession?.memberName}"
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Session Name</label>
              <p className="text-lg font-semibold text-black">{selectedIndividualSession?.title}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Trainer</label>
              <p className="text-lg font-semibold text-black">{selectedIndividualSession?.trainerName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <p className="text-lg font-semibold text-black">{moment(selectedIndividualSession?.start).format("MMM D, YYYY")}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
              <p className="text-lg font-semibold text-black">{moment(selectedIndividualSession?.start).format("h:mm A")} - {moment(selectedIndividualSession?.end).format("h:mm A")}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location/Meeting Link</label>
              <p className="text-lg font-semibold text-black">{selectedIndividualSession?.location}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <p className="text-lg font-semibold text-black">{selectedIndividualSession?.description}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Member Name</label>
              <p className="text-lg font-semibold text-black">{selectedIndividualSession?.memberName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Member Email</label>
              <p className="text-lg font-semibold text-black">{selectedIndividualSession?.memberEmail}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Session Type</label>
              <p className="text-lg font-semibold text-black">{selectedIndividualSession?.sessionType}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pricing Plan</label>
              <p className="text-lg font-semibold text-black">{selectedIndividualSession?.pricingPlan}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedIndividualSession(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrainerSessionsPage;