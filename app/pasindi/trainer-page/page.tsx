"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../../Components/ui/card";
import { Badge } from "../../Components/ui/badge";
import { Separator } from "../../Components/ui/separator";
import { Clock, MapPin, Users, MessageCircle } from "lucide-react";
import moment from "moment";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "../../Components/ui/dialog";
import { Button } from "../../Components/ui/button";
import { Users as UsersIcon } from "lucide-react";

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

  if (user === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Trainer Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">You must be logged in as a trainer to view your sessions.</p>
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

  // Approve/Reject
  const handleApprove = async (participantId: string) => {
    if (!participantsSession) return;
    await fetch(`/api/sessions/${participantsSession._id}/approve-booking`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId })
    });
    handleViewParticipants(participantsSession); // Refresh
  };
  const handleReject = async (participantId: string) => {
    if (!participantsSession) return;
    await fetch(`/api/sessions/${participantsSession._id}/reject-booking`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId })
    });
    handleViewParticipants(participantsSession); // Refresh
  };

  return (
    <div className="min-h-screen bg-white py-8 px-4 md:px-12">
      <Card className="max-w-3xl mx-auto border-gray-200 shadow-lg">
        <CardHeader className="bg-gray-900 text-white border-b-2 border-red-500">
          <CardTitle className="text-xl font-bold text-white">My Scheduled Sessions</CardTitle>
        </CardHeader>
        <CardContent className="bg-white">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No sessions scheduled yet.</div>
          ) : (
            <div className="space-y-6">
              {sessions.map((session) => (
                <div key={session._id} className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-black">{session.title}</h3>
                        {session.status && (
                          <Badge
                            className={`${
                              session.status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : session.status === 'completed'
                                ? 'bg-gray-200 text-gray-800'
                                : 'bg-green-100 text-green-800'
                            } text-xs font-semibold px-2.5 py-0.5 rounded-full`}
                          >
                            {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                          </Badge>
                        )}
                        <a
                          href={`/communication-and-notifications/User-chat?trainerName=${encodeURIComponent(session.trainerName)}`}
                          className="ml-2 bg-red-600 hover:bg-red-700 text-white rounded-full shadow p-2 flex items-center justify-center"
                          title="Message Trainer"
                          style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}
                        >
                          <MessageCircle className="w-5 h-5" />
                        </a>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-gray-600">Trainer: {session.trainerName}</span>
                        {session.canceled && session.cancellationReason && (
                          <span className="ml-2 text-xs text-red-800">Reason: {session.cancellationReason}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">
                        {session.currentParticipants || 0} / {session.maxParticipants} participants
                      </span>
                      <Button size="sm" variant="outline" onClick={() => handleViewParticipants(session)}>
                        <UsersIcon className="w-4 h-4 mr-1" /> View Participants
                      </Button>
                    </div>
                  </div>
                  <Separator className="my-2 bg-gray-200" />
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">
                        {moment(session.start).format("MMM D, YYYY • h:mm A")} - {moment(session.end).format("h:mm A")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">{session.location}</span>
                    </div>
                  </div>
                  {session.description && (
                    <div className="pt-2">
                      <h4 className="text-sm font-semibold mb-2 text-black">Description</h4>
                      <p className="text-sm text-gray-600 bg-white p-3 rounded-md border border-gray-200">
                        {session.description}
                      </p>
                    </div>
                  )}
                  {/* Action buttons */}
                  {!session.canceled && (
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(session)}>Edit</Button>
                      <Button size="sm" variant="outline" onClick={() => handleReschedule(session)}>Reschedule</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleCancel(session)}>Cancel</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Participants Modal */}
      <Dialog open={!!participantsSession} onOpenChange={open => !open && setParticipantsSession(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Participants for {participantsSession?.title}</DialogTitle>
          </DialogHeader>
          {participantsLoading ? (
            <div className="flex items-center justify-center h-24">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
            </div>
          ) : participants.length === 0 ? (
            <div className="text-center text-gray-500 py-4">No participants yet.</div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {participants.map((p) => (
                <div key={p._id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div>
                    <div className="font-medium text-black">{p.userName}</div>
                    <div className="text-xs text-gray-500">{p.userEmail}</div>
                    <div className="text-xs text-gray-400">{new Date(p.joinedAt).toLocaleDateString()}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      p.status === 'approved' ? 'bg-green-100 text-green-800' :
                      p.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {p.status}
                    </span>
                    {p.status === 'pending' && (
                      <>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleApprove(p._id)}>Approve</Button>
                        <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-50" onClick={() => handleReject(p._id)}>Reject</Button>
                      </>
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
            <DialogTitle>Edit Max Participants</DialogTitle>
          </DialogHeader>
          <input type="number" min={1} value={editMaxParticipants} onChange={e => setEditMaxParticipants(Number(e.target.value))} className="border p-2 rounded w-full mb-4" />
          <DialogFooter>
            <Button onClick={submitEdit} disabled={actionLoading}>Save</Button>
            <Button variant="outline" onClick={() => setEditSession(null)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Modal */}
      <Dialog open={!!rescheduleSession} onOpenChange={open => !open && setRescheduleSession(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Session</DialogTitle>
          </DialogHeader>
          <label className="block mb-2">Start Time</label>
          <input type="datetime-local" value={moment(rescheduleStart).format("YYYY-MM-DDTHH:mm")} onChange={e => setRescheduleStart(e.target.value)} className="border p-2 rounded w-full mb-4" />
          <label className="block mb-2">End Time</label>
          <input type="datetime-local" value={moment(rescheduleEnd).format("YYYY-MM-DDTHH:mm")} onChange={e => setRescheduleEnd(e.target.value)} className="border p-2 rounded w-full mb-4" />
          <label className="block mb-2">Location</label>
          <input type="text" value={rescheduleLocation} onChange={e => setRescheduleLocation(e.target.value)} className="border p-2 rounded w-full mb-4" />
          <DialogFooter>
            <Button onClick={submitReschedule} disabled={actionLoading}>Save</Button>
            <Button variant="outline" onClick={() => setRescheduleSession(null)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Modal */}
      <Dialog open={!!cancelSession} onOpenChange={open => !open && setCancelSession(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Session</DialogTitle>
          </DialogHeader>
          <label className="block mb-2">Reason for cancellation</label>
          <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} className="border p-2 rounded w-full mb-4" rows={3} />
          <DialogFooter>
            <Button onClick={submitCancel} disabled={actionLoading || !cancelReason.trim()}>Submit</Button>
            <Button variant="outline" onClick={() => setCancelSession(null)}>Back</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrainerSessionsPage; 