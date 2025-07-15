"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../Components/ui/tabs"
import SessionForm from "../components/session-form"
import SessionCalendar from "../components/session-calendar"
import VirtualSessionForm from "../components/VirtualSessionForm" // ✅ Import Virtual Session Form

export default function Home() {
  const router = useRouter()
  const [role, setRole] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)
  const [tab, setTab] = useState("calendar") // ✅ Manage active tab

  // ✅ Fetch user role on load
  useEffect(() => {
    const userRole = localStorage.getItem("userRole")
    setRole(userRole ? userRole.toLowerCase() : null)
    setChecked(true)
  }, [])

  // ✅ Redirect if not trainer
  useEffect(() => {
    if (checked && role !== "trainer") {
      router.replace("/")
    }
  }, [checked, role, router])

  if (!checked) return null

  if (role !== "trainer") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center text-red-600 bg-red-50 border border-red-200 rounded-lg p-8">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Access Denied</h2>
          <p className="text-red-600">This area is restricted to trainers only.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto py-10 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-black mb-2">Gym Session Scheduler</h1>
          <p className="text-gray-600">Manage your training sessions and view your schedule</p>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="flex justify-start w-full mb-8 bg-gray-100 border border-gray-200 space-x-6">


  <TabsTrigger
    value="calendar"
    className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-gray-700 font-medium px-6"
  >
    Calendar View
  </TabsTrigger>
  <TabsTrigger
    value="schedule"
    className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-gray-700 font-medium px-6"
  >
    Schedule Physical Session
  </TabsTrigger>
  <TabsTrigger
    value="virtual"
    className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-gray-700 font-medium px-6"
  >
    Schedule Virtual Session
  </TabsTrigger>
</TabsList>


          <TabsContent value="calendar" className="mt-0">
            <SessionCalendar />
          </TabsContent>

          <TabsContent value="schedule" className="mt-0">
            <SessionForm />
          </TabsContent>

          <TabsContent value="virtual" className="mt-0">
            <VirtualSessionForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
