"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../../Components/ui/card";
import { Separator } from "../../Components/ui/separator";
import { Clock, MapPin, Users, User } from "lucide-react";
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
  status?: string; // Add status field for join status
}

const MyJoinedSessionsPage: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ userId: string; name: string } | null>(null);
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
        const data = await res.json(); // [{ session, status }]
        if (isMounted) {
          setSessions(data.map((item: any) => ({ ...item.session, status: item.status })));
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

  if (user === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>My Joined Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">You must be logged in to view your joined sessions.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8 px-4 md:px-12">
      <Card className="max-w-3xl mx-auto border-gray-200 shadow-lg">
        <CardHeader className="bg-gray-900 text-white border-b-2 border-red-500">
          <CardTitle className="text-xl font-bold text-white">Sessions I've Joined</CardTitle>
        </CardHeader>
        <CardContent className="bg-white">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center text-gray-500 py-8">You haven't joined any sessions yet.</div>
          ) : (
            <div className="space-y-6">
              {sessions.map((session) => (
                <div key={session._id} className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-semibold text-black">{session.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">Trainer: {session.trainerName}</span>
                        {session.status && (
                          <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                            session.status === 'approved' ? 'bg-green-100 text-green-800' :
                            session.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">
                        {session.currentParticipants || 0} / {session.maxParticipants} participants
                      </span>
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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MyJoinedSessionsPage; 