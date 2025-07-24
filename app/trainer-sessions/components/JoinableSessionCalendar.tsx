/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState } from "react"
import { Calendar, momentLocalizer, Views, type View } from "react-big-calendar"
import moment from "moment"
import "react-big-calendar/lib/css/react-big-calendar.css"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../Components/ui/dialog"
import { Button } from "../../Components/ui/button"
import { Badge } from "../../Components/ui/badge"
import { Separator } from "../../Components/ui/separator"
import { CalendarIcon, Clock, MapPin, Users, User } from "lucide-react"

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
  _id: string
  title: string
  trainerName: string
  start: Date
  end: Date
  location: string
  maxParticipants: number
  currentParticipants?: number
  description?: string
  participants?: string[] | { userId: string }[] // Added participants field
  hasJoined?: boolean // Added hasJoined field
}

interface JoinableSessionCalendarProps {
  trainerId: string
  height?: string | number
  planMatch?: boolean
}

export default function JoinableSessionCalendar({ trainerId, height = 600, planMatch = true }: JoinableSessionCalendarProps) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentView, setCurrentView] = useState<View>(Views.WEEK)
  // Initialize currentDate with a fixed date to prevent hydration mismatch [^1]
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2000, 0, 1))
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [selectedDayEvents, setSelectedDayEvents] = useState<Session[]>([])
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [isDayDialogOpen, setIsDayDialogOpen] = useState(false)
  const [userPlan, setUserPlan] = useState<any>(null);
  const [trainerPlans, setTrainerPlans] = useState<string[]>([]);

  // Set the actual current date only on the client after hydration [^1]
  useEffect(() => {
    setCurrentDate(new Date())
  }, [])

  useEffect(() => {
    let isMounted = true
    const fetchSessions = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/sessions?trainerId=${trainerId}`)
        const data = await response.json()
        const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null

        // Fetch participants for each session in parallel
        const sessionsWithParticipants = await Promise.all(
          data.map(async (session: any) => {
            // Fetch participants for this session
            const participantsRes = await fetch(`/api/sessions/${session._id}/participants`)
            const participants = await participantsRes.json()

            // Ensure participants is an array before using .some() [^2]
            const safeParticipants = Array.isArray(participants) ? participants : []

            // Check if user has joined
            const hasJoined = userId && safeParticipants.some((p: any) => p.userId === userId)
            return {
              ...session,
              start: moment(session.start).toDate(),
              end: moment(session.end).toDate(),
              allDay: false,
              title: session.title || "Unnamed Session",
              currentParticipants: session.currentParticipants || 0,
              hasJoined,
            }
          }),
        )
        if (isMounted) {
          setSessions(sessionsWithParticipants)
        }
      } catch (error) {
        console.error("Error loading sessions:", error)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    fetchSessions()

    return () => {
      isMounted = false
    }
  }, [trainerId])

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    // Fetch logged-in user's plan
    fetch(`/api/fix-pending-pricing-plans?userId=${userId}`)
      .then(res => res.json())
      .then(data => {
        // Find the active/paid plan
        const plan = (data.paidPlans && data.paidPlans[0]) || null;
        setUserPlan(plan);
      });

    // Fetch trainer's pricingPlans array
    if (trainerId) {
      fetch(`/api/approved-trainer/${trainerId}`)
        .then(res => res.json())
        .then(data => {
          const plans = Array.isArray(data.pricingPlans) ? data.pricingPlans : [];
          setTrainerPlans(plans);
        });
    }
  }, [trainerId]);

  // Debug current view and date
  useEffect(() => {
    if (currentView === Views.MONTH && sessions.length > 0) {
      console.log("Month view - Current date:", currentDate)
      console.log(
        "Sessions in current month:",
        sessions.filter(
          (s) => s.start.getMonth() === currentDate.getMonth() && s.start.getFullYear() === currentDate.getFullYear(),
        ),
      )
    }
  }, [currentView, sessions, currentDate])

  // After sessions are loaded, if in month view and no sessions in current month, go to first session's month
  useEffect(() => {
    // Only run this effect if currentDate has been properly set on the client
    if (currentDate.getFullYear() !== 2000 && sessions.length > 0 && currentView === Views.MONTH) {
      const currentMonth = currentDate.getMonth()
      const currentYear = currentDate.getFullYear()
      // Check if any session exists in the current month
      const hasSessionsInCurrentMonth = sessions.some((session) => {
        const sessionMonth = session.start.getMonth()
        const sessionYear = session.start.getFullYear()
        return sessionMonth === currentMonth && sessionYear === currentYear
      })

      if (!hasSessionsInCurrentMonth) {
        // Navigate to the first session's month
        console.log("Navigating to first session month:", sessions[0].start)
        setCurrentDate(new Date(sessions[0].start))
      }
    }
  }, [sessions, currentView, currentDate]) // Added currentDate to dependency array for consistency

  const handleSelectEvent = (event: Session) => {
    setSelectedSession(event)
    setIsDialogOpen(true)
  }

  const handleJoinSession = async () => {
    if (!planMatch) {
      alert("You cannot join this trainer's sessions because your plan is not accepted by the trainer.");
      return;
    }
    if (!selectedSession) return
    if (selectedSession.hasJoined) {
      alert("You have already joined this session.")
      return
    }
    // Check pricing plan match
    if (!userPlan || !trainerPlans.length || !trainerPlans.includes(userPlan.planName)) {
      alert("You can only join sessions if your pricing plan is accepted by the trainer.");
      return;
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
        setSessions((prev) =>
          prev.map((session) =>
            session._id === selectedSession._id
              ? { ...session, currentParticipants: (session.currentParticipants || 0) + 1, hasJoined: true }
              : session,
          ),
        )
        setSelectedSession((prev) =>
          prev
            ? {
                ...prev,
                currentParticipants: (prev.currentParticipants || 0) + 1,
                hasJoined: true,
              }
            : null,
        )
        alert("Successfully joined the session!")
      } else {
        const error = await response.json()
        alert(error.message || "Failed to join session")
      }
    } catch (error) {
      console.error("Error joining session:", error)
      alert("Failed to join session. Please try again.")
    } finally {
      setIsJoining(false)
    }
  }

  const handleShowMore = (events: Session[], date: Date) => {
    setSelectedDayEvents(events)
    setSelectedDay(date)
    setIsDayDialogOpen(true)
  }

  const isSessionFull = (session: Session) => {
    return (session.currentParticipants || 0) >= session.maxParticipants
  }

  const isSessionPast = (session: Session) => {
    return moment(session.end).isBefore(moment())
  }

  const calendarHeight = currentView === Views.MONTH ? 800 : height

  return (
    <div className="calendar-container" style={{ height: calendarHeight }}>
      <style>{customStyles}</style>
      {/* Debug button - remove this in production */}
      {process.env.NODE_ENV === "development" && (
        <div style={{ marginBottom: "10px" }}>
          <button
            onClick={() => setCurrentDate(new Date(2025, 6, 16))}
            style={{
              padding: "4px 8px",
              marginRight: "8px",
              backgroundColor: "#f0f0f0",
              border: "1px solid #ccc",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Go to July 2025
          </button>
          <span style={{ fontSize: "12px", color: "#666" }}>
            Current: {currentDate.toDateString()} | View: {currentView} | Sessions: {sessions.length}
          </span>
        </div>
      )}
      {isLoading ? (
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
          views={{ month: true, week: true, day: true }}
          view={currentView}
          onView={(view) => setCurrentView(view)}
          date={currentDate}
          onNavigate={setCurrentDate}
          defaultView={Views.WEEK}
          toolbar={true}
          popup={true}
          popupOffset={30}
          selectable={true}
          dayLayoutAlgorithm={"no-overlap"}
          showMultiDayTimes={true}
          onSelectEvent={handleSelectEvent}
          onShowMore={handleShowMore}
          step={30}
          timeslots={2}
          formats={{
            monthHeaderFormat: "MMMM YYYY",
            dayHeaderFormat: "dddd",
            dayRangeHeaderFormat: ({ start, end }, culture, localizer) =>
              (localizer?.format?.(start, "MMMM DD", culture) ?? "") +
              " - " +
              (localizer?.format?.(end, "MMMM DD", culture) ?? ""),
          }}
          key={`${currentView}-${currentDate.getMonth()}-${currentDate.getFullYear()}`}
          // No custom components prop
        />
      )}
      {/* Session Details Dialog */}
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
                </div>
              </div>
              <Separator className="bg-gray-200" />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <div>
                    <div className="font-medium text-gray-900">
                      {moment(selectedSession.start).format("MMMM Do YYYY, h:mm A")}
                    </div>
                    <div className="text-sm text-gray-500">
                      Duration:{" "}
                      {moment.duration(moment(selectedSession.end).diff(moment(selectedSession.start))).humanize()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">{selectedSession.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-3 h-3 text-gray-500" />
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
                    !planMatch ||
                    isJoining ||
                    isSessionFull(selectedSession) ||
                    isSessionPast(selectedSession) ||
                    selectedSession.hasJoined
                  }
                  className={`flex-1 ${
                    !planMatch ||
                    isJoining ||
                    isSessionFull(selectedSession) ||
                    isSessionPast(selectedSession) ||
                    selectedSession.hasJoined
                      ? "bg-gray-400 hover:bg-gray-400"
                      : "bg-green-600 hover:bg-green-700"
                  } text-white`}
                >
                  {!planMatch ? (
                    "Your plan is not accepted"
                  ) : isJoining ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Joining...
                    </>
                  ) : selectedSession.hasJoined ? (
                    "Already Joined"
                  ) : isSessionFull(selectedSession) ? (
                    "Session Full"
                  ) : isSessionPast(selectedSession) ? (
                    "Session Ended"
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
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Day Events Dialog for '+N more' */}
      <Dialog open={isDayDialogOpen} onOpenChange={setIsDayDialogOpen}>
        <DialogContent className="max-w-md bg-white border-gray-200">
          <DialogHeader>
            <DialogTitle>Sessions on {selectedDay ? moment(selectedDay).format("MMMM Do, YYYY") : ""}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {selectedDayEvents.length > 0 ? (
              selectedDayEvents.map((session) => (
                <div
                  key={session._id}
                  className="p-3 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                  onClick={() => {
                    setSelectedSession(session)
                    setIsDialogOpen(true)
                    setIsDayDialogOpen(false)
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
              onClick={() => setIsDayDialogOpen(false)}
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
