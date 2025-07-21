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
import { useParams } from 'next/navigation'
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
  canceled?: boolean // Added for canceled sessions
}

interface SessionCalendarProps {
  trainerId?: string // Optional prop to override the trainerId
  mode?: 'trainer' | 'public' // Different modes for different use cases
  showHeader?: boolean // Whether to show the card header
  height?: string // Custom height for the calendar
  title?: string // Custom title for the calendar
  description?: string // Custom description for the calendar
}

export default function SessionCalendar({ 
  trainerId: propTrainerId,
  mode = 'trainer',
  showHeader = true,
  height = '600px',
  title,
  description
}: SessionCalendarProps) {
  const params = useParams()
  const urlTrainerId = params?.id as string
  
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentView, setCurrentView] = useState("week")
  const [currentDate, setCurrentDate] = useState(new Date())
  const { toast } = useToast()

  // Add state for participants
  const [participants, setParticipants] = useState([])
  const [showParticipants, setShowParticipants] = useState(false)

  // Add state for ApprovedTrainer ID
  const [approvedTrainerId, setApprovedTrainerId] = useState<string | null>(null)
  const [loadingTrainerId, setLoadingTrainerId] = useState(true)
  const trainerEmail = typeof window !== "undefined" ? localStorage.getItem("userEmail") || "" : ""

  // Determine which trainer ID to use based on mode and available sources
  const getTrainerId = () => {
    if (propTrainerId) return propTrainerId;
    if (urlTrainerId) return urlTrainerId;
    if (mode === 'trainer') return approvedTrainerId;
    return null;
  };

  // Get default title and description based on mode
  const getDefaultTitle = () => {
    if (title) return title
    return mode === 'trainer' ? 'Session Calendar' : 'Available Sessions'
  }

  const getDefaultDescription = () => {
    if (description) return description
    return mode === 'trainer' 
      ? 'View all scheduled gym sessions. Click on a session to see details.'
      : 'View trainer\'s available sessions. Click on a session to see details and join.'
  }

  // Add function to fetch participants
  const fetchParticipants = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/participants`)
      if (response.ok) {
        const data = await response.json()
        setParticipants(data.all || data) // Handle both old and new format
      }
    } catch (error) {
      console.error("Error fetching participants:", error)
    }
  }

  // Function to approve booking
  const handleApproveBooking = async (participantId: string) => {
    try {
      const response = await fetch(`/api/sessions/${selectedSession?._id}/approve-booking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ participantId }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Booking approved successfully!",
        })
        // Refresh participants
        if (selectedSession) {
          fetchParticipants(selectedSession._id)
        }
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to approve booking.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error approving booking:", error)
      toast({
        title: "Error",
        description: "Failed to approve booking. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Function to reject booking
  const handleRejectBooking = async (participantId: string, rejectionReason?: string) => {
    try {
      const response = await fetch(`/api/sessions/${selectedSession?._id}/reject-booking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ participantId, rejectionReason }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Booking rejected successfully!",
        })
        // Refresh participants
        if (selectedSession) {
          fetchParticipants(selectedSession._id)
        }
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to reject booking.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error rejecting booking:", error)
      toast({
        title: "Error",
        description: "Failed to reject booking. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Load sessions from API
  useEffect(() => {
    // Only fetch if not loading and ID is available (for trainer mode)
    if (mode === 'trainer') {
      if (loadingTrainerId) return; // Wait until ID is loaded
      if (!approvedTrainerId) return; // Don't fetch if ID is missing
    }

    let isMounted = true
    const trainerId = getTrainerId()
    if (mode === 'trainer') {
      console.log("SessionCalendar: Using trainerId for fetch:", trainerId); // <-- Log the ID being used
    }
    console.log("Fetching sessions for trainerId:", trainerId, "Mode:", mode)

    const fetchSessions = async () => {
      try {
        setIsLoading(true)
        
        // Different API endpoints based on mode
        let apiUrl = ''
        if (mode === 'trainer' && trainerId) {
          apiUrl = `/api/sessions?trainerId=${trainerId}`
        } else if (mode === 'public' && trainerId) {
          apiUrl = `/api/sessions?trainerId=${trainerId}`
        } else if (mode === 'public' && !trainerId) {
          apiUrl = `/api/sessions`
        } else {
          throw new Error("Invalid configuration")
        }

        console.log("SessionCalendar: Making API call to:", apiUrl)
        const response = await fetch(apiUrl)

        console.log("SessionCalendar: Response status:", response.status)
        console.log("SessionCalendar: Response headers:", Object.fromEntries(response.headers.entries()))

        if (!response.ok) {
          const errorText = await response.text()
          console.log("SessionCalendar: Error response:", errorText)
          throw new Error("Failed to fetch sessions")
        }

        const data = await response.json()
        console.log("SessionCalendar: Fetched sessions data:", data)
        console.log("SessionCalendar: Number of sessions:", data.length)

        // If no sessions found for specific trainer, try to get all sessions
        if (data.length === 0 && trainerId && mode === 'public') {
          console.log("SessionCalendar: No sessions found for trainer, fetching all sessions")
          const allSessionsResponse = await fetch('/api/sessions?public=true')
          if (allSessionsResponse.ok) {
            const allSessionsData = await allSessionsResponse.json()
            console.log("SessionCalendar: All sessions data:", allSessionsData)
            
            if (isMounted) {
              const formattedSessions = allSessionsData.map((session: any) => ({
                ...session,
                start: new Date(session.start),
                end: new Date(session.end),
                title: session.title || "Unnamed Session",
              }))
              console.log("SessionCalendar: Formatted all sessions:", formattedSessions)
              setSessions(formattedSessions)
              return
            }
          }
        }

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

          console.log("SessionCalendar: Formatted sessions:", formattedSessions)
          setSessions(formattedSessions)
        }
      } catch (error) {
        console.error("SessionCalendar: Error loading sessions:", error)
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
  }, [propTrainerId, urlTrainerId, mode, loadingTrainerId, approvedTrainerId]) // Add mode and approvedTrainerId to dependencies

  // Effect to fetch ApprovedTrainer ID if in trainer mode
  useEffect(() => {
    async function fetchApprovedTrainerId() {
      if (!trainerEmail) {
        setLoadingTrainerId(false)
        return
      }
      try {
        const res = await fetch(`/api/trainer/getByEmail?email=${trainerEmail}`)
        const data = await res.json()
        if (res.ok && data.data && data.data._id) {
          setApprovedTrainerId(data.data._id)
          localStorage.setItem("approvedTrainerId", data.data._id)
          console.log("Fetched ApprovedTrainer ID (calendar):", data.data._id)
        } else {
          setApprovedTrainerId(null)
        }
      } catch (err) {
        setApprovedTrainerId(null)
      } finally {
        setLoadingTrainerId(false)
      }
    }
    if (mode === 'trainer') {
      const localId = localStorage.getItem("approvedTrainerId")
      if (localId) {
        setApprovedTrainerId(localId)
        setLoadingTrainerId(false)
      } else {
        fetchApprovedTrainerId()
      }
    } else {
      setLoadingTrainerId(false)
    }
  }, [trainerEmail, mode])

  // Log trainerEmail for debugging
  console.log("Trainer email for ApprovedTrainer fetch:", trainerEmail)

  // After sessions are loaded, if in month view and no sessions in current month, go to first session's month
  useEffect(() => {
    if (sessions.length > 0 && currentView === 'month') {
      const sessionMonths = sessions.map(s => s.start.getMonth() + '-' + s.start.getFullYear())
      const currentMonth = currentDate.getMonth() + '-' + currentDate.getFullYear()
      if (!sessionMonths.includes(currentMonth)) {
        setCurrentDate(sessions[0].start)
      }
    }
  }, [sessions, currentView])

  // Add a Go to Today button
  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Handle session click to show details
  const handleSelectEvent = (session: Session) => {
    setSelectedSession(session)
    setIsDialogOpen(true)
  }

  // Handle view change
  const handleViewChange = (newView: string) => {
    setCurrentView(newView)
  }

  const handleNavigate = (newDate: Date) => {
    setCurrentDate(newDate)
  }

  // Custom event styling - different colors for different modes
  const eventStyleGetter = (event: Session) => {
    const baseStyle = {
      borderRadius: "6px",
      color: "white",
      display: "block",
      overflow: "hidden",
      padding: "4px 8px",
      fontSize: "12px",
      fontWeight: "500",
    }

    if (mode === 'trainer') {
      return {
        style: {
          ...baseStyle,
          backgroundColor: "#dc2626", // red-600
          border: "1px solid #b91c1c", // red-700
        },
      }
    } else {
      return {
        style: {
          ...baseStyle,
          backgroundColor: "#059669", // green-600
          border: "1px solid #047857", // green-700
        },
      }
    }
  }

  // Function to handle joining a session (only for public mode)
  const handleJoinSession = async (sessionId: string) => {
    try {
      const userId = localStorage.getItem("userId")
      if (!userId) {
        toast({
          title: "Error",
          description: "Please log in to join sessions.",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(`/api/sessions/${sessionId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Successfully joined the session!",
        })
        // Refresh sessions to update participant count
        window.location.reload()
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.message || "Failed to join session.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error joining session:", error)
      toast({
        title: "Error",
        description: "Failed to join session. Please try again.",
        variant: "destructive",
      })
    }
  }

  const calendarContent = (
    <div className="calendar-container" style={{ height }}>
      <div className="flex justify-end mb-2">
        <Button size="sm" variant="outline" onClick={goToToday}>
          Go to Today
        </Button>
      </div>
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
          view={currentView as any}
          onView={handleViewChange}
          date={currentDate}
          onNavigate={handleNavigate}
          defaultView={Views.WEEK}
          toolbar={true}
          popup={true}
          selectable={true}
          dayLayoutAlgorithm={"no-overlap"}
          showMultiDayTimes={true}
          onSelectEvent={handleSelectEvent}
          components={{
            event: (props: any) => (
              <div className="text-xs truncate font-medium" title={String(props.title)}>
                {props.title}
              </div>
            ),
          }}
        />
      )}
    </div>
  )

  if (mode === 'trainer') {
    if (loadingTrainerId) {
      return <div>Loading trainer information...</div>
    }
    if (!approvedTrainerId) {
      return <div className="text-red-600">Could not find your trainer profile. Please contact support.</div>
    }
  }

  return (
    <div className="space-y-6">
      {showHeader ? (
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle className="text-black text-xl">{getDefaultTitle()}</CardTitle>
            <CardDescription className="text-gray-600">
              {getDefaultDescription()}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 bg-white">
            {loadingTrainerId ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-red-600"></div>
              </div>
            ) : approvedTrainerId ? (
              calendarContent
            ) : (
              <div className="text-red-600 text-center py-8">
                Could not find your trainer profile. Please contact support.
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        loadingTrainerId ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-red-600"></div>
          </div>
        ) : approvedTrainerId ? (
          calendarContent
        ) : (
          <div className="text-red-600 text-center py-8">
            Could not find your trainer profile. Please contact support.
          </div>
        )
      )}

      {/* Session Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {selectedSession && (
          <DialogContent className="sm:max-w-md bg-white border-gray-200">
            <DialogHeader>
              <DialogTitle className="text-black text-xl">{selectedSession.title}</DialogTitle>
              <DialogDescription>
                Trainer
              </DialogDescription>
              <Badge variant="outline" className="mt-2 border-red-200 text-red-700 bg-red-50">
                {selectedSession.trainerName}
              </Badge>
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
                <span className="text-gray-700">
                  {selectedSession.currentParticipants || 0} / {selectedSession.maxParticipants} participants
                </span>
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

              {/* Join Session Button - Only show in public mode */}
              {mode === 'public' && (
                <div className="pt-2">
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleJoinSession(selectedSession._id)}
                    disabled={(selectedSession.currentParticipants ?? 0) >= selectedSession.maxParticipants}
                  >
                    {(selectedSession.currentParticipants ?? 0) >= selectedSession.maxParticipants 
                      ? 'Session Full' 
                      : 'Join Session'
                    }
                  </Button>
                </div>
              )}
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
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-black">{participant.userName}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        participant.status === 'approved' ? 'bg-green-100 text-green-800' :
                        participant.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {participant.status}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">{new Date(participant.joinedAt).toLocaleDateString()}</span>
                  </div>
                  
                  {/* Approval/Rejection buttons - only show for pending bookings */}
                  {participant.status === 'pending' && mode === 'trainer' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleApproveBooking(participant._id)}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-50"
                        onClick={() => handleRejectBooking(participant._id)}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
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