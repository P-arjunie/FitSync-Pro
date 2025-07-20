/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useParams, useSearchParams } from 'next/navigation'
import { User, Calendar as CalendarIcon, Plus } from "lucide-react"
import SessionCalendar from '../../components/session-calendar'
import JoinableSessionCalendar from '../../components/JoinableSessionCalendar'
import { useState } from 'react'

export default function TrainerDetailsPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const trainerId = params.id as string
  const trainerName = searchParams.get('name') || `Trainer ${trainerId}`
  const [isCreatingSession, setIsCreatingSession] = useState(false)

  // Log the trainer ID and name for debugging
  console.log("TrainerPage: Trainer ID from URL:", trainerId)
  console.log("TrainerPage: Trainer Name from URL:", trainerName)
  console.log("TrainerPage: Full URL params:", Object.fromEntries(searchParams.entries()))


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Simple Trainer Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <User className="h-8 w-8 text-red-600" />
            <h1 className="text-3xl font-bold text-black">
              {trainerName}
            </h1>
          </div>
          <p className="text-gray-600">Professional Gym Trainer</p>
          
          {/* Create Sample Session Button */}
          
        </div>

        
        {/* New: Joinable Session Calendar */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <CalendarIcon className="h-6 w-6 text-green-600" />
            <h2 className="text-xl font-semibold text-black">Join a Session</h2>
          </div>
          <JoinableSessionCalendar 
            trainerId={trainerId}
            height={600}
          />
        </div>
      </div>
    </div>
  )
} 