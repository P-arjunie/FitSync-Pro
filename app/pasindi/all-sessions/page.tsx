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
import type { ToolbarProps } from "react-big-calendar"
import { CalendarIcon, Clock, MapPin, Users, User } from "lucide-react"

// Enhanced custom styles with black, gray, red theme
const customStyles = `
  /* Calendar container */
  .rbc-calendar {
    background-color: white !important;
    border: 1px solid #e5e7eb !important;
    border-radius: 8px !important;
  }

  /* Toolbar styling */
  .rbc-toolbar {
    background-color: #111827 !important;
    color: white !important;
    padding: 16px !important;
    border-radius: 8px 8px 0 0 !important;
    margin-bottom: 0 !important;
    border-bottom: 2px solid #ef4444 !important;
  }

  .rbc-toolbar button {
    background-color: #374151 !important;
    color: white !important;
    border: 1px solid #6b7280 !important;
    border-radius: 6px !important;
    padding: 8px 16px !important;
    margin: 0 4px !important;
    font-weight: 500 !important;
    transition: all 0.2s ease !important;
  }

  .rbc-toolbar button:hover {
    background-color: #4b5563 !important;
    border-color: #9ca3af !important;
  }

  .rbc-toolbar button.rbc-active {
    background-color: #ef4444 !important;
    border-color: #dc2626 !important;
    color: white !important;
  }

  .rbc-toolbar-label {
    color: white !important;
    font-weight: 600 !important;
    font-size: 18px !important;
  }

  /* Header styling */
  .rbc-header {
    background-color: #f9fafb !important;
    color: #111827 !important;
    font-weight: 600 !important;
    padding: 12px 8px !important;
    border-bottom: 1px solid #e5e7eb !important;
    text-transform: uppercase !important;
    font-size: 12px !important;
    letter-spacing: 0.5px !important;
  }

  /* Month view specific styles */
  .rbc-month-view .rbc-event {
    font-size: 10px !important;
    padding: 2px 4px !important;
    margin: 1px 0 !important;
    line-height: 1.2 !important;
    border-radius: 4px !important;
    min-height: 16px !important;
    border: none !important;
  }
  
  .rbc-month-view .rbc-event-content {
    font-size: 10px !important;
  }
  
  .rbc-month-view .rbc-day-slot .rbc-events-container {
    margin-right: 0 !important;
  }
  
  .rbc-show-more {
    font-size: 10px !important;
    color: #ef4444 !important;
    cursor: pointer !important;
    font-weight: 600 !important;
    padding: 2px 4px !important;
    border-radius: 2px !important;
    background-color: #fef2f2 !important;
  }
  
  .rbc-show-more:hover {
    background-color: #fee2e2 !important;
  }
  
  .rbc-month-view .rbc-date-cell {
    padding: 4px 6px !important;
    font-weight: 500 !important;
    color: #374151 !important;
  }

  /* Day grid styling */
  .rbc-day-bg {
    background-color: white !important;
    border-right: 1px solid #f3f4f6 !important;
  }

  .rbc-day-bg:hover {
    background-color: #f9fafb !important;
  }

  .rbc-today {
    background-color: #fef2f2 !important;
  }

  .rbc-off-range-bg {
    background-color: #f8fafc !important;
  }

  .rbc-off-range {
    color: #9ca3af !important;
  }

  /* Week and day view time slots */
  .rbc-time-slot {
    border-top: 1px solid #f3f4f6 !important;
  }

  .rbc-time-header {
    background-color: #f9fafb !important;
    border-bottom: 1px solid #e5e7eb !important;
  }

  .rbc-time-header-content {
    border-left: 1px solid #e5e7eb !important;
  }

  .rbc-time-content {
    border-left: 1px solid #e5e7eb !important;
  }

  .rbc-time-view .rbc-time-header {
    color: #374151 !important;
  }

  .rbc-label {
    color: #6b7280 !important;
    font-weight: 500 !important;
  }

  /* Current time indicator */
  .rbc-current-time-indicator {
    background-color: #ef4444 !important;
    height: 2px !important;
  }

  .rbc-current-time-indicator::before {
    background-color: #ef4444 !important;
  }

  /* Popup styling */
  .rbc-overlay {
    background-color: white !important;
    border: 1px solid #e5e7eb !important;
    border-radius: 8px !important;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
  }

  .rbc-overlay-header {
    background-color: #111827 !important;
    color: white !important;
    padding: 12px 16px !important;
    border-radius: 8px 8px 0 0 !important;
    font-weight: 600 !important;
    border-bottom: 2px solid #ef4444 !important;
  }

  /* Event selection */
  .rbc-selected {
    background-color: #374151 !important;
    border: 2px solid #ef4444 !important;
  }

  /* Slots */
  .rbc-slot-selection {
    background-color: rgba(239, 68, 68, 0.1) !important;
    border: 1px solid #ef4444 !important;
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
}

export default function AllSessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentView, setCurrentView] = useState<View>(Views.WEEK)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isJoining, setIsJoining] = useState(false)

  useEffect(() => {
    let isMounted = true
    const fetchSessions = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/sessions")
        const data = await response.json()
        if (isMounted) {
          // Convert string dates to Date objects
          const formattedSessions = data.map((session: Session) => ({
            ...session,
            start: new Date(session.start),
            end: new Date(session.end),
            title: session.title || "Unnamed Session",
            currentParticipants: session.currentParticipants || 0,
          }))
          setSessions(formattedSessions)
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
  }, [])

  const handleSelectEvent = (event: Session) => {
    setSelectedSession(event)
    setIsDialogOpen(true)
  }

  const handleJoinSession = async () => {
    if (!selectedSession) return

    setIsJoining(true)
    try {
      const userId = localStorage.getItem("userId");
      const userName = localStorage.getItem("userName");

      const response = await fetch(`/api/sessions/${selectedSession._id}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, userName }),
      });

      if (response.ok) {
        // Update the session in the local state
        setSessions((prev) =>
          prev.map((session) =>
            session._id === selectedSession._id
              ? { ...session, currentParticipants: (session.currentParticipants || 0) + 1 }
              : session,
          ),
        )

        // Update selected session
        setSelectedSession((prev) =>
          prev
            ? {
                ...prev,
                currentParticipants: (prev.currentParticipants || 0) + 1,
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

  const handleShowMore = (events: Session[], date: Date) => {
    // This will be called when user clicks on "+X more" in month view
    console.log("Show more events for date:", date, events)
    // You could open a custom modal here if needed
  }

  return (
    <div className="min-h-screen bg-white">
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      <Card className="bg-white border-gray-200 shadow-lg">
        <CardHeader className="bg-gray-900 text-white border-b-2 border-red-500">
          <CardTitle className="text-xl font-bold text-white">All Trainers' Sessions</CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-white">
          <div className="h-[600px]">
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
                views={{
                  month: true,
                  week: true,
                  day: true,
                }}
                view={currentView as any}
                onView={setCurrentView}
                onSelectEvent={handleSelectEvent}
                defaultView={Views.WEEK}
                toolbar={true}
                popup={true}
                popupOffset={30}
                selectable={true}
                dayLayoutAlgorithm={"no-overlap"}
                showMultiDayTimes={true}
                onShowMore={handleShowMore}
                components={{
                  event: (props: any) => {
                    const session = props.event as Session
                    const isFull = isSessionFull(session)
                    const isPast = isSessionPast(session)

                    // Different rendering for month view vs other views
                    if (currentView === Views.MONTH) {
                      return (
                        <div
                          className={`text-xs p-1 rounded cursor-pointer overflow-hidden transition-all duration-200 ${
                            isPast ? "opacity-50" : ""
                          } ${
                            isFull 
                              ? "bg-red-100 border-red-400 text-red-800" 
                              : "bg-gray-100 border-gray-400 text-gray-800"
                          }`}
                          title={`${session.title} - ${session.trainerName} (${session.currentParticipants || 0}/${session.maxParticipants})`}
                        >
                          <div className="font-semibold truncate text-[10px] leading-tight">{session.title}</div>
                          <div className="truncate text-[9px] opacity-80">
                            {moment(session.start).format("HH:mm")} - {session.trainerName}
                          </div>
                        </div>
                      )
                    }

                    // Original rendering for week/day views
                    return (
                      <div
                        className={`text-xs p-2 rounded cursor-pointer border-l-4 transition-all duration-200 hover:shadow-md ${
                          isPast ? "opacity-50" : ""
                        } ${
                          isFull 
                            ? "bg-red-50 border-red-500 text-red-800" 
                            : "bg-gray-50 border-gray-600 text-gray-800"
                        }`}
                        title={`${session.title} - ${session.trainerName}`}
                      >
                        <div className="font-semibold truncate text-sm">{session.title}</div>
                        <div className="truncate text-gray-600 text-xs">{session.trainerName}</div>
                        <div className="flex items-center gap-1 mt-1">
                          <Users className="w-3 h-3" />
                          <span className="text-xs font-medium">
                            {session.currentParticipants || 0}/{session.maxParticipants}
                          </span>
                        </div>
                      </div>
                    )
                  },
                }}
              />
            )}
          </div>
        </CardContent>
      </Card>

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
                  disabled={isJoining || isSessionFull(selectedSession) || isSessionPast(selectedSession)}
                  className={`flex-1 ${
                    isJoining || isSessionFull(selectedSession) || isSessionPast(selectedSession)
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
    </div>
  )
}