/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState } from "react"
import { Calendar, momentLocalizer, Views, type View } from "react-big-calendar"
import moment from "moment"
import "react-big-calendar/lib/css/react-big-calendar.css"
import { Card, CardContent, CardHeader, CardTitle } from "../../Components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../Components/ui/dialog"
import { Button } from "../../Components/ui/button"
import { Badge } from "../../Components/ui/badge"
import { Separator } from "../../Components/ui/separator"
import { CalendarIcon, Clock, MapPin, Users, User, MessageCircle } from "lucide-react"
import FloatingChatButton from "@/Components/ui/FloatingChatButton";

// Enhanced custom styles with black, gray, red theme
const customStyles = `
  /* Only keep toolbar/header styling, remove all .rbc-month-view overrides */
  .rbc-toolbar {
    background-color: #111827 !important;
    color: white !important;
  }
  .rbc-header {
    background-color: #f9fafb !important;
    color: #111827 !important;
  }
`

const localizer = momentLocalizer(moment)

type Session = {
  trainerId: any
  _id: string
  title: string
  trainerName: string
  start: Date
  end: Date
  location: string
  maxParticipants: number
  currentParticipants?: number
  description?: string
  hasJoined?: boolean // Added for tracking joined status
}

export default function AllSessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentView, setCurrentView] = useState<View>(Views.WEEK)
  const [currentDate, setCurrentDate] = useState<Date | null>(null)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [activeTab, setActiveTab] = useState("sessions")
  const [userPlan, setUserPlan] = useState<any>(null)
  const [trainerPlans, setTrainerPlans] = useState<{[key: string]: string[]}>({})
  const [isLoadingPlans, setIsLoadingPlans] = useState(true)

  // New states for day-specific events dialog
  const [selectedDayEvents, setSelectedDayEvents] = useState<Session[]>([])
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [isDayEventsDialogOpen, setIsDayEventsDialogOpen] = useState(false)

  useEffect(() => {
    let isMounted = true;
    const fetchSessions = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/sessions")
        const data = await response.json()
        if (!Array.isArray(data)) {
          console.error("Error loading sessions: API did not return an array", data)
          setSessions([])
          return
        }
        // Convert string dates to Date objects
        const formattedSessions = data.map((session: Session) => ({
          ...session,
          start: new Date(session.start),
          end: new Date(session.end),
          title: session.title || "Unnamed Session",
          currentParticipants: session.currentParticipants || 0,
        }))
        setSessions(formattedSessions)
      } catch (error) {
        console.error("Error loading sessions:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchSessions();
    return () => {
      isMounted = false;
    };
  }, []);

  // After sessions are loaded, if in month view and no sessions in current month, go to first session's month
  useEffect(() => {
    if (sessions.length > 0 && currentView === "month") {
      const sessionMonths = sessions.map((s) => s.start.getMonth() + "-" + s.start.getFullYear())
      const currentMonth = currentDate?.getMonth() + "-" + currentDate?.getFullYear()
      const firstSessionMonth = sessions[0].start.getMonth() + "-" + sessions[0].start.getFullYear()
      if (!sessionMonths.includes(currentMonth) && currentMonth !== firstSessionMonth) {
        setCurrentDate(sessions[0].start)
      }
    }
    // Only depend on sessions and currentView to avoid unnecessary triggers
    // eslint-disable-next-line
  }, [sessions, currentView])

  // Set currentDate only on client to avoid hydration mismatch
  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  // Fetch user plan and trainer plans
  useEffect(() => {
    const fetchPlans = async () => {
      setIsLoadingPlans(true)
      const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
      
      if (!userId) {
        setUserPlan(null)
        setIsLoadingPlans(false)
        return
      }

      try {
        // Fetch user's plan
        const userRes = await fetch(`/api/fix-pending-pricing-plans?userId=${userId}`)
        const userData = await userRes.json()
        const fetchedUserPlan = (userData.paidPlans && userData.paidPlans[0]) || null
        setUserPlan(fetchedUserPlan)

        // Fetch trainer plans for each session
        const trainerIds = [...new Set(sessions.map(session => session.trainerId).filter(Boolean))]
        const trainerPlansData: {[key: string]: string[]} = {}
        
        for (const trainerId of trainerIds) {
          try {
            const trainerRes = await fetch(`/api/approved-trainer/${trainerId}`)
            const trainerData = await trainerRes.json()
            trainerPlansData[trainerId] = trainerData.pricingPlans || []
          } catch (error) {
            console.error(`Failed to fetch trainer ${trainerId} plans:`, error)
            trainerPlansData[trainerId] = []
          }
        }
        
        setTrainerPlans(trainerPlansData)
      } catch (error) {
        console.error("Failed to fetch plans:", error)
        setUserPlan(null)
        setTrainerPlans({})
      } finally {
        setIsLoadingPlans(false)
      }
    }

    if (sessions.length > 0) {
      fetchPlans()
    }
  }, [sessions])

  // Check if user can join a specific session
  const canJoinSession = (session: Session) => {
    if (!userPlan || !session.trainerId) return false
    
    const trainerPlanList = trainerPlans[session.trainerId] || []
    return trainerPlanList.includes(userPlan.planName)
  }

  const handleSelectEvent = (event: Session) => {
    setSelectedSession(event)
    setIsDialogOpen(true)
  }

  const handleJoinSession = async () => {
    if (!selectedSession) return
    
    // Check plan compatibility before joining
    if (!canJoinSession(selectedSession)) {
      alert("Your current plan doesn't match this trainer's requirements. Please upgrade your plan to join this session.")
      return
    }
    
    setIsJoining(true)
    try {
      const userId = localStorage.getItem("userId")
      const userName = localStorage.getItem("userName")
      const response = await fetch(`/api/sessions/${selectedSession._id}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, userName }),
      })
      if (response.ok) {
        // Update the session in the local state
        setSessions((prev) => {
          const updated = prev.map((session) =>
            session._id === selectedSession._id
              ? { ...session, currentParticipants: (session.currentParticipants || 0) + 1, hasJoined: true }
              : session,
          );
          // Update selectedSession from the new array
          const updatedSelected = updated.find(s => s._id === selectedSession._id);
          setSelectedSession(updatedSelected || null);
          return updated;
        });
        alert("Successfully joined the session!")
      } else {
        const error = await response.json();
        if (error.message && error.message.toLowerCase().includes("already")) {
          alert("You have already joined this session.");
        } else {
          alert(error.message || "Failed to join session");
        }
      }
    } catch (error) {
      console.error("Error joining session:", error)
      alert("Failed to join session. Please try again.")
    } finally {
      setIsJoining(false)
    }
  }

  const formatDateTime = (date: Date) => {
    return moment(date).format("MMMM Do YYYY, h:mm A")
  }

  const formatDuration = (start: Date, end: Date) => {
    const duration = moment.duration(moment(end).diff(moment(start)))
    const hours = Math.floor(duration.asHours())
    const minutes = duration.minutes()
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const isSessionFull = (session: Session) => {
    return (session.currentParticipants || 0) >= session.maxParticipants
  }

  const isSessionPast = (session: Session) => {
    return moment(session.end).isBefore(moment())
  }

  // Modified handleShowMore to open the new dialog
  const handleShowMore = (events: Session[], date: Date) => {
    setSelectedDayEvents(events)
    setSelectedDay(date)
    setIsDayEventsDialogOpen(true)
  }

  const handleViewChange = (newView: View) => {
    setCurrentView(newView)
  }

  const handleNavigate = (newDate: Date) => {
    setCurrentDate(newDate)
  }

  return (
    <div className="min-h-screen bg-white">
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      <FloatingChatButton />
      <Card className="bg-white border-gray-200 shadow-lg">
        <CardHeader className="bg-gray-900 text-white border-b-2 border-red-500">
          <CardTitle className="text-xl font-bold text-white">All Trainers' Sessions</CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-white">
          <div className="calendar-container" style={{ height: 600 }}>
            {isLoading || !currentDate ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
              </div>
            ) : (
              <Calendar
                localizer={localizer}
                events={sessions}
                startAccessor="start"
                endAccessor="end"
                style={{ height: "100%" }}
                views={{
                  month: true,
                  week: true,
                  day: true,
                }}
                view={currentView as any}
                onView={handleViewChange}
                date={currentDate}
                onNavigate={handleNavigate}
                defaultView={Views.WEEK}
                toolbar={true}
                popup={true}
                popupOffset={30}
                selectable={true}
                dayLayoutAlgorithm={"no-overlap"}
                showMultiDayTimes={true}
                onShowMore={handleShowMore}
                onSelectEvent={handleSelectEvent}
                components={{}}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Session Details Dialog (Existing) */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md bg-white border-gray-200">
          <DialogHeader className="border-b border-gray-200 pb-4">
            <DialogTitle className="flex items-center gap-2 text-gray-900">
              <CalendarIcon className="w-5 h-5 text-red-500" />
              Session Details
            </DialogTitle>
          </DialogHeader>
          {selectedSession && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedSession.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Trainer: {selectedSession.trainerName}</span>
                  <a
                    href={`/communication-and-notifications/User-chat?${selectedSession.trainerId ? `trainerId=${selectedSession.trainerId}&` : ''}trainerName=${encodeURIComponent(selectedSession.trainerName)}`}
                    className="ml-2 bg-red-600 hover:bg-red-700 text-white rounded-full shadow p-2 flex items-center justify-center"
                    title="Message Trainer"
                    style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}
                  >
                    <MessageCircle className="w-5 h-5" />
                  </a>
                </div>
              </div>
              <Separator className="bg-gray-200" />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <div>
                    <div className="font-medium text-gray-900">{formatDateTime(selectedSession.start)}</div>
                    <div className="text-sm text-gray-500">
                      Duration: {formatDuration(selectedSession.start, selectedSession.end)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">{selectedSession.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <div className="flex items-center gap-2">
                    <span className="text-gray-700">
                      {selectedSession.currentParticipants || 0} / {selectedSession.maxParticipants} participants
                    </span>
                    {isSessionFull(selectedSession) && (
                      <Badge className="bg-red-100 text-red-800 border-red-300">Full</Badge>
                    )}
                    {isSessionPast(selectedSession) && (
                      <Badge className="bg-gray-100 text-gray-800 border-gray-300">Past</Badge>
                    )}
                  </div>
                </div>
              </div>
              {selectedSession.description && (
                <>
                  <Separator className="bg-gray-200" />
                  <div>
                    <h4 className="font-medium mb-2 text-gray-900">Description</h4>
                    <p className="text-sm text-gray-600">{selectedSession.description}</p>
                  </div>
                </>
              )}
              <Separator className="bg-gray-200" />
              <div className="flex gap-2">
                <Button
                  onClick={handleJoinSession}
                  disabled={
                    isJoining ||
                    isSessionFull(selectedSession) ||
                    isSessionPast(selectedSession) ||
                    selectedSession.hasJoined ||
                    !canJoinSession(selectedSession)
                  }
                  className={`flex-1 ${
                    isJoining || isSessionFull(selectedSession) || isSessionPast(selectedSession) || !canJoinSession(selectedSession)
                      ? "bg-gray-400 hover:bg-gray-400"
                      : "bg-red-500 hover:bg-red-600"
                  } text-white`}
                >
                  {isJoining ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Joining...
                    </>
                  ) : isSessionFull(selectedSession) ? (
                    "Session Full"
                  ) : isSessionPast(selectedSession) ? (
                    "Session Ended"
                  ) : !canJoinSession(selectedSession) ? (
                    "Plan Required"
                  ) : (
                    "Join Session"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Close
                </Button>
              </div>
              {/* Plan Compatibility Info */}
              {userPlan && selectedSession.trainerId && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-700">Plan Compatibility:</span>
                    {canJoinSession(selectedSession) ? (
                      <span className="text-green-600 text-sm font-medium">✓ Compatible</span>
                    ) : (
                      <span className="text-red-600 text-sm font-medium">✗ Incompatible</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600">
                    Your plan: <span className="font-medium">{userPlan.planName}</span>
                    {trainerPlans[selectedSession.trainerId] && (
                      <> • Trainer accepts: {trainerPlans[selectedSession.trainerId].join(", ")}</>
                    )}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New: Day Events List Dialog */}
      <Dialog open={isDayEventsDialogOpen} onOpenChange={setIsDayEventsDialogOpen}>
        <DialogContent className="max-w-md bg-white border-gray-200">
          <DialogHeader className="border-b border-gray-200 pb-4">
            <DialogTitle className="flex items-center gap-2 text-gray-900">
              <CalendarIcon className="w-5 h-5 text-red-500" />
              Sessions on {selectedDay ? moment(selectedDay).format("MMMM Do, YYYY") : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {selectedDayEvents.length > 0 ? (
              selectedDayEvents.map((session) => (
                <div
                  key={session._id}
                  className="p-3 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                  onClick={() => {
                    handleSelectEvent(session) // Open the main session details dialog
                    setIsDayEventsDialogOpen(false) // Close this day events dialog
                  }}
                >
                  <h4 className="font-semibold text-gray-900">{session.title}</h4>
                  <div className="text-sm text-gray-600">
                    {moment(session.start).format("h:mm A")} - {moment(session.end).format("h:mm A")}
                  </div>
                  <div className="text-xs text-gray-500">Trainer: {session.trainerName}</div>
                  <div className="flex items-center gap-1 mt-1">
                    <Users className="w-3 h-3 text-gray-500" />
                    <span className="text-xs font-medium">
                      {session.currentParticipants || 0}/{session.maxParticipants}
                    </span>
                    {isSessionFull(session) && (
                      <Badge className="bg-red-100 text-red-800 border-red-300 ml-auto">Full</Badge>
                    )}
                    {isSessionPast(session) && (
                      <Badge className="bg-gray-100 text-gray-800 border-gray-300 ml-auto">Past</Badge>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-600">No sessions for this day.</p>
            )}
          </div>
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => setIsDayEventsDialogOpen(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
