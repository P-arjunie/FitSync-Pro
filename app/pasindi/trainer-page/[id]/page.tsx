/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useParams, useSearchParams } from 'next/navigation'
import { User, Calendar as CalendarIcon, Plus } from "lucide-react"
import SessionCalendar from '../../components/session-calendar'
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

  const createSampleSession = async () => {
    try {
      setIsCreatingSession(true)
      
      const sessionData = {
        title: "Sample Training Session",
        trainerName: trainerName,
        trainerId: trainerId,
        start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        end: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // Tomorrow + 1 hour
        location: "Main Gym Floor",
        maxParticipants: 10,
        description: "A sample training session for testing purposes"
      }

      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      })

      if (response.ok) {
        alert('Sample session created successfully! Refresh the page to see it.')
        window.location.reload()
      } else {
        const error = await response.json()
        alert(`Failed to create session: ${error.error}`)
      }
    } catch (error) {
      console.error('Error creating session:', error)
      alert('Failed to create session')
    } finally {
      setIsCreatingSession(false)
    }
  }

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
          <div className="mt-4">
            <button
              onClick={createSampleSession}
              disabled={isCreatingSession}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              {isCreatingSession ? 'Creating...' : 'Create Sample Session'}
            </button>
            <p className="text-xs text-gray-500 mt-2">Click to create a test session for this trainer</p>
          </div>
        </div>

        {/* Session Calendar */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <CalendarIcon className="h-6 w-6 text-red-600" />
            <h2 className="text-xl font-semibold text-black">Available Sessions</h2>
          </div>
          <SessionCalendar 
            trainerId={trainerId}
            mode="public"
            showHeader={true}
            height="600px"
            title="Available Sessions"
            description="View trainer's available sessions. Click on a session to see details and join."
          />
        </div>
      </div>
    </div>
  )
} 