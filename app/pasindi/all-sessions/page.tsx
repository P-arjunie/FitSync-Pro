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

// Add custom styles for month view
const customStyles = `
  .rbc-month-view .rbc-event {
    font-size: 10px !important;
    padding: 1px 3px !important;
    margin: 1px 0 !important;
    line-height: 1.2 !important;
    border-radius: 2px !important;
    min-height: 16px !important;
  }
  
  .rbc-month-view .rbc-event-content {
    font-size: 10px !important;
  }
  
  .rbc-month-view .rbc-day-slot .rbc-events-container {
    margin-right: 0 !important;
  }
  
  .rbc-show-more {
    font-size: 10px !important;
    color: #0066cc !important;
    cursor: pointer !important;
    font-weight: 500 !important;
  }
  
  .rbc-month-view .rbc-date-cell {
    padding: 2px 4px !important;
  }
`

function CustomToolbar({ label, onView, views }: ToolbarProps) {
  return (
    <div className="flex items-center justify-between mb-2">
      <span className="font-bold">{label}</span>
      <div className="space-x-2">
        {Object.keys(views).map((view) => (
          <button
            key={view}
            onClick={() => onView(view as View)}
            className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {view.charAt(0).toUpperCase() + view.slice(1)}
          </button>
        ))}
      </div>
    </div>
  )
}

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
          const formattedSessions = data.map((session: any) => ({
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
    <div>
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      <Card>
        <CardHeader>
          <CardTitle>All Trainers' Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[600px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
                // Remove the invalid 'max' prop, which expects a Date, not a number
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
                          className={`text-xs p-1 rounded cursor-pointer overflow-hidden ${
                            isPast ? "opacity-60" : ""
                          } ${isFull ? "bg-red-100 border-red-300" : "bg-blue-100 border-blue-300"}`}
                          title={`${session.title} - ${session.trainerName} (${session.currentParticipants || 0}/${session.maxParticipants})`}
                        >
                          <div className="font-semibold truncate text-[10px] leading-tight">{session.title}</div>
                          <div className="truncate text-gray-600 text-[9px]">
                            {moment(session.start).format("HH:mm")} - {session.trainerName}
                          </div>
                        </div>
                      )
                    }

                    // Original rendering for week/day views
                    return (
                      <div
                        className={`text-xs p-1 rounded cursor-pointer ${
                          isPast ? "opacity-60" : ""
                        } ${isFull ? "bg-red-100 border-red-300" : "bg-blue-100 border-blue-300"}`}
                        title={`${session.title} - ${session.trainerName}`}
                      >
                        <div className="font-semibold truncate">{session.title}</div>
                        <div className="truncate text-gray-600">{session.trainerName}</div>
                        <div className="flex items-center gap-1 mt-1">
                          <Users className="w-3 h-3" />
                          <span>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Session Details
            </DialogTitle>
          </DialogHeader>

          {selectedSession && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{selectedSession.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Trainer: {selectedSession.trainerName}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <div>
                    <div className="font-medium">{formatDateTime(selectedSession.start)}</div>
                    <div className="text-sm text-gray-500">
                      Duration: {formatDuration(selectedSession.start, selectedSession.end)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span>{selectedSession.location}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <div className="flex items-center gap-2">
                    <span>
                      {selectedSession.currentParticipants || 0} / {selectedSession.maxParticipants} participants
                    </span>
                    {isSessionFull(selectedSession) && <Badge variant="destructive">Full</Badge>}
                    {isSessionPast(selectedSession) && <Badge variant="secondary">Past</Badge>}
                  </div>
                </div>
              </div>

              {selectedSession.description && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-sm text-gray-600">{selectedSession.description}</p>
                  </div>
                </>
              )}

              <Separator />

              <div className="flex gap-2">
                <Button
                  onClick={handleJoinSession}
                  disabled={isJoining || isSessionFull(selectedSession) || isSessionPast(selectedSession)}
                  className="flex-1"
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
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
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
