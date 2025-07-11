/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import {
  type AwaitedReactNode,
  type JSXElementConstructor,
  type ReactElement,
  type ReactNode,
  useEffect,
  useState,
} from "react"
import { Calendar, momentLocalizer, Views } from "react-big-calendar"
import moment from "moment"
import "react-big-calendar/lib/css/react-big-calendar.css"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../Components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../Components/ui/dialog"
import { Badge } from "../../Components/ui/badge"
import { Clock, MapPin, Users } from "lucide-react"
import { useToast } from "../components/ui/use-toast"
import { Separator } from "../../Components/ui/separator"
import { Button } from "../../Components/ui/button"

// Setup the localizer for the calendar
const localizer = momentLocalizer(moment)

type Session = {
  _id: string
  title: string
  trainerName: string
  start: Date
  end: Date
  location: string
  maxParticipants: number
  description?: string
  currentParticipants?: number
}

export default function SessionCalendar() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentView, setCurrentView] = useState("week")
  const { toast } = useToast()

  // Add state for participants
  const [participants, setParticipants] = useState([])
  const [showParticipants, setShowParticipants] = useState(false)

  // Add function to fetch participants
  const fetchParticipants = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/participants`)
      if (response.ok) {
        const data = await response.json()
        setParticipants(data)
      }
    } catch (error) {
      console.error("Error fetching participants:", error)
    }
  }

  // Load sessions from API only once when component mounts
  useEffect(() => {
    let isMounted = true
    const trainerId = typeof window !== "undefined" ? localStorage.getItem("userId") : null
    console.log("Fetching sessions for trainerId:", trainerId)

    const fetchSessions = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/sessions?trainerId=${trainerId}`)

        if (!response.ok) {
          throw new Error("Failed to fetch sessions")
        }

        const data = await response.json()
        console.log("Fetched sessions:", data)

        // Only update state if component is still mounted
        if (isMounted) {
          // Convert string dates to Date objects and ensure they're valid
          const formattedSessions = data.map((session: any) => ({
            ...session,
            start: new Date(session.start),
            end: new Date(session.end),
            // Ensure the title is properly set for display
            title: session.title || "Unnamed Session",
          }))

          setSessions(formattedSessions)
        }
      } catch (error) {
        console.error("Error loading sessions:", error)
        if (isMounted) {
          toast({
            title: "Error",
            description: "Failed to load sessions. Please try again.",
            variant: "destructive",
          })
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchSessions()

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false
    }
  }, []) // Empty dependency array ensures this runs only once

  // Handle session click to show details
  const handleSelectEvent = (session: Session) => {
    setSelectedSession(session)
    setIsDialogOpen(true)
  }

  // Handle view change
  const handleViewChange = (newView: string) => {
    setCurrentView(newView)
  }

  // Custom event styling
  const eventStyleGetter = (event: Session) => {
    return {
      style: {
        backgroundColor: "#dc2626", // red-600
        borderRadius: "6px",
        color: "white",
        border: "1px solid #b91c1c", // red-700
        display: "block",
        overflow: "hidden",
        padding: "4px 8px",
        fontSize: "12px",
        fontWeight: "500",
      },
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <CardTitle className="text-black text-xl">Session Calendar</CardTitle>
          <CardDescription className="text-gray-600">
            View all scheduled gym sessions. Click on a session to see details.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 bg-white">
          <div className="h-[600px] calendar-container">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-red-600"></div>
              </div>
            ) : (
              <Calendar
                localizer={localizer}
                events={sessions}
                startAccessor="start"
                endAccessor="end"
                style={{ height: "100%" }}
                onSelectEvent={handleSelectEvent}
                eventPropGetter={eventStyleGetter}
                views={{
                  month: true,
                  week: true,
                  day: true,
                }}
                view={currentView as any}
                onView={handleViewChange}
                defaultView={Views.WEEK}
                toolbar={true}
                popup={true}
                selectable={true}
                dayLayoutAlgorithm={"no-overlap"}
                showMultiDayTimes={true}
                components={{
                  event: (props: {
                    title:
                      | string
                      | number
                      | bigint
                      | boolean
                      | ReactElement<any, string | JSXElementConstructor<any>>
                      | Iterable<ReactNode>
                      | Promise<AwaitedReactNode>
                      | null
                      | undefined
                  }) => (
                    <div className="text-xs truncate font-medium" title={String(props.title)}>
                      {props.title}
                    </div>
                  ),
                }}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Session Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {selectedSession && (
          <DialogContent className="sm:max-w-md bg-white border-gray-200">
            <DialogHeader>
              <DialogTitle className="text-black text-xl">{selectedSession.title}</DialogTitle>
              <DialogDescription>
                <Badge variant="outline" className="mt-2 border-red-200 text-red-700 bg-red-50">
                  {selectedSession.trainerName}
                </Badge>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-gray-500" />
                <span className="text-gray-700">
                  {moment(selectedSession.start).format("MMM D, YYYY • h:mm A")} -{" "}
                  {moment(selectedSession.end).format("h:mm A")}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-gray-500" />
                <span className="text-gray-700">{selectedSession.location}</span>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-gray-500" />
                <span className="text-gray-700">Max {selectedSession.maxParticipants} participants</span>
              </div>
              {selectedSession.description && (
                <div className="pt-2">
                  <h4 className="text-sm font-semibold mb-2 text-black">Description</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md border border-gray-200">
                    {selectedSession.description}
                  </p>
                </div>
              )}

              <Separator className="bg-gray-200" />

              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-black">Participants</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 bg-transparent"
                  onClick={() => {
                    fetchParticipants(selectedSession._id)
                    setShowParticipants(true)
                  }}
                >
                  View Participants ({selectedSession.currentParticipants || 0})
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Participants Dialog */}
      <Dialog open={showParticipants} onOpenChange={setShowParticipants}>
        <DialogContent className="sm:max-w-md bg-white border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-black">Session Participants</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {participants.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No participants yet.</p>
              </div>
            ) : (
              participants.map((participant: any) => (
                <div
                  key={participant._id}
                  className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
                >
                  <span className="font-medium text-black">{participant.userName}</span>
                  <span className="text-xs text-gray-500">{new Date(participant.joinedAt).toLocaleDateString()}</span>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        .rbc-calendar {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
        }
        .rbc-header {
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
          color: #111827;
          font-weight: 600;
          padding: 12px 8px;
        }
        .rbc-toolbar {
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
          padding: 16px;
          margin-bottom: 0;
        }
        .rbc-toolbar button {
          background: white;
          border: 1px solid #d1d5db;
          color: #374151;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 500;
        }
        .rbc-toolbar button:hover {
          background: #f3f4f6;
          border-color: #9ca3af;
        }
        .rbc-toolbar button.rbc-active {
          background: #dc2626;
          border-color: #b91c1c;
          color: white;
        }
        .rbc-month-view, .rbc-time-view {
          border: none;
        }
        .rbc-today {
          background-color: #fef2f2;
        }
        .rbc-off-range-bg {
          background: #f9fafb;
        }
        .rbc-time-slot {
          border-top: 1px solid #f3f4f6;
        }
        .rbc-timeslot-group {
          border-bottom: 1px solid #e5e7eb;
        }
        .rbc-day-slot .rbc-time-slot {
          border-top: 1px solid #f3f4f6;
        }
      `}</style>
    </div>
  )
}
