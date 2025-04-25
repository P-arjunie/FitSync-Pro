/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { AwaitedReactNode, JSXElementConstructor, ReactElement, ReactNode, useEffect, useState } from "react"
import { Calendar, momentLocalizer, Views } from "react-big-calendar"
import moment from "moment"
import "react-big-calendar/lib/css/react-big-calendar.css"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../Components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../Components/ui/dialog"
import { Badge } from "../../Components/ui/badge"
import { Clock, MapPin, Users } from "lucide-react"
import { useToast } from "../components/ui/use-toast"

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
}

export default function SessionCalendar() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentView, setCurrentView] = useState("week")
  const { toast } = useToast()

  // Load sessions from API only once when component mounts
  useEffect(() => {
    // Flag to prevent unnecessary fetches
    let isMounted = true;
    
    const fetchSessions = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/sessions")
        
        if (!response.ok) {
          throw new Error("Failed to fetch sessions")
        }
        
        const data = await response.json()
        
        // Only update state if component is still mounted
        if (isMounted) {
          // Convert string dates to Date objects and ensure they're valid
          const formattedSessions = data.map((session: any) => ({
            ...session,
            start: new Date(session.start),
            end: new Date(session.end),
            // Ensure the title is properly set for display
            title: session.title || "Unnamed Session"
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
      isMounted = false;
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
        backgroundColor: "#0ea5e9",
        borderRadius: "4px",
        color: "white",
        border: "none",
        display: "block",
        overflow: "hidden",
        padding: "2px 5px",
      },
    }
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Session Calendar</CardTitle>
          <CardDescription>View all scheduled gym sessions. Click on a session to see details.</CardDescription>
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
                onSelectEvent={handleSelectEvent}
                eventPropGetter={eventStyleGetter}
                views={{
                  month: true,
                  week: true,
                  day: true
                }}
                view={currentView as any}
                onView={handleViewChange}
                defaultView={Views.WEEK}
                toolbar={true}
                popup={true}
                selectable={true}
                // Add these props for better day/month view handling
                dayLayoutAlgorithm={"no-overlap"}
                showMultiDayTimes={true}
                // Format the events in month view
                components={{
                  event: (props: { title: string | number | bigint | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | Promise<AwaitedReactNode> | null | undefined }) => (
                    <div className="text-xs truncate" title={String(props.title)}>
                      {props.title}
                    </div>
                  )
                }}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Session Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {selectedSession && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedSession.title}</DialogTitle>
              <DialogDescription>
                <Badge variant="outline" className="mt-2">
                  {selectedSession.trainerName}
                </Badge>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  {moment(selectedSession.start).format("MMM D, YYYY • h:mm A")} -{" "}
                  {moment(selectedSession.end).format("h:mm A")}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{selectedSession.location}</span>
              </div>

              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>Max {selectedSession.maxParticipants} participants</span>
              </div>

              {selectedSession.description && (
                <div className="pt-2">
                  <h4 className="text-sm font-medium mb-1">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedSession.description}</p>
                </div>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}