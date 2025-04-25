import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../Components/ui/tabs"
import SessionForm from "../components/session-form"
import SessionCalendar from "../components/session-calendar"

export default function Home() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Gym Session Scheduler</h1>

      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="schedule">Schedule Session</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-0">
          <SessionCalendar />
        </TabsContent>

        <TabsContent value="schedule" className="mt-0">
          <SessionForm />
        </TabsContent>
      </Tabs>
    </div>
  )
}
