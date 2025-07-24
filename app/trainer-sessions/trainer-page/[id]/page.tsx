/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useParams, useSearchParams } from 'next/navigation'
import { User, CalendarIcon, Plus, DollarSign } from 'lucide-react'
import SessionCalendar from '../../components/session-calendar' // Assuming this path is correct
import JoinableSessionCalendar from '../../components/JoinableSessionCalendar' // Assuming this path is correct
import { useState, useEffect } from 'react'

export default function TrainerDetailsPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const trainerId = params.id as string
  const trainerName = searchParams.get('name') || `Trainer ${trainerId}`

  const [userPlan, setUserPlan] = useState<any>(null)
  const [trainerPlan, setTrainerPlan] = useState<any>(null)
  const [isLoadingPlans, setIsLoadingPlans] = useState(true)
  const [planMatch, setPlanMatch] = useState<boolean | null>(null)
  const [virtualSessions, setVirtualSessions] = useState<any[]>([]);
  const [trainerPricingPlans, setTrainerPricingPlans] = useState<string[]>([]);

  // Log the trainer ID and name for debugging
  console.log("TrainerPage: Trainer ID from URL:", trainerId)
  console.log("TrainerPage: Trainer Name from URL:", trainerName)
  console.log("TrainerPage: Full URL params:", Object.fromEntries(searchParams.entries()))

  useEffect(() => {
    const fetchPlans = async () => {
      setIsLoadingPlans(true)
      console.log("useEffect: Starting fetchPlans function.")
      // const userId = localStorage.getItem("userId")
      const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
      console.log("useEffect: userId from localStorage:", userId)

      if (!userId) {
        console.log("No userId found in localStorage. Cannot fetch user plan.")
        setUserPlan(null)
      }

      try {
        let fetchedUserPlan: any = null;
        if (userId) {
          console.log("useEffect: Fetching user plan...")
          const userRes = await fetch(`/api/fix-pending-pricing-plans?userId=${userId}`)
          const userData = await userRes.json()
          console.log("Fetched userData:", userData);
          fetchedUserPlan = (userData.paidPlans && userData.paidPlans[0]) || null
          setUserPlan(fetchedUserPlan)
          console.log("User plan fetched:", fetchedUserPlan)
        }

        let fetchedTrainerPlans: string[] = [];
        if (trainerId) {
          console.log("useEffect: Fetching trainer plans for ID:", trainerId)
          const trainerRes = await fetch(`/api/approved-trainer/${trainerId}`)
          const trainerData = await trainerRes.json()
          fetchedTrainerPlans = trainerData.pricingPlans || [];
          setTrainerPlan(fetchedTrainerPlans)
          console.log("Trainer plans fetched:", fetchedTrainerPlans)

          if (userId && fetchedUserPlan && fetchedTrainerPlans.length > 0) {
            const match = fetchedTrainerPlans.includes(fetchedUserPlan.planName);
            setPlanMatch(match)
            console.log("Do user and trainer have a matching plan?", match)
          } else {
            setPlanMatch(false)
            console.log("Plan comparison skipped: Missing user or trainer plan data.")
          }
        } else {
          console.log("useEffect: No trainerId, skipping trainer plan fetch.")
        }
      } catch (err) {
        console.error("Failed to fetch pricing plan status:", err)
        setUserPlan(null)
        setTrainerPlan(null)
        setPlanMatch(false)
      } finally {
        setIsLoadingPlans(false)
        console.log("useEffect: fetchPlans function finished.")
      }
    }

    fetchPlans()
  }, [trainerId]) // Re-run when trainerId changes

  // Fetch virtual sessions and trainer pricingPlans
  useEffect(() => {
    if (!trainerId) return;
    // Fetch virtual sessions
    fetch(`/api/virtual-sessions?trainerId=${trainerId}`)
      .then(res => res.json())
      .then(data => {
        setVirtualSessions(Array.isArray(data) ? data : data.sessions || []);
      });
    // Fetch trainer pricingPlans
    fetch(`/api/approved-trainer/${trainerId}`)
      .then(res => res.json())
      .then(data => {
        setTrainerPricingPlans(Array.isArray(data.pricingPlans) ? data.pricingPlans : []);
      });
  }, [trainerId]);

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
        </div>

        {/* Trainer's Pricing Plans Section */}
        <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-6 w-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-black">Trainer's Pricing Plans</h2>
          </div>
          {trainerPricingPlans.length > 0 ? (
            <div>
              <p className="text-lg font-medium text-gray-800">Plans: <span className="font-bold text-purple-700">{trainerPricingPlans.join(", ")}</span></p>
            </div>
          ) : (
            <p className="text-gray-500">No pricing plans found for this trainer.</p>
          )}
        </div>

        {/* Trainer's Pricing Plan Section
        <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-6 w-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-black">Trainer's Pricing Plan</h2>
          </div>
          {isLoadingPlans ? (
            <p className="text-gray-500">Loading pricing plan...</p>
          ) : trainerPlan ? (
            <div>
              <p className="text-lg font-medium text-gray-800">Plan: <span className="font-bold text-purple-700">{trainerPlan}</span></p>
            </div>
          ) : (
            <p className="text-gray-500">No pricing plan found for this trainer.</p>
          )}
        </div> */}

        {/* Plan Comparison Section */}
        {userPlan && trainerPlan && !isLoadingPlans && (
          <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl font-semibold text-black">Your Plan vs. Trainer's Plan</h2>
            </div>
            {planMatch ? (
              <p className="text-green-600 font-semibold">
                Your plan (<span className="font-bold">{userPlan.planName}</span>) matches {trainerName}'s plan (<span className="font-bold">{trainerPlan}</span>).
              </p>
            ) : (
              <p className="text-red-600 font-semibold">
                Your plan (<span className="font-bold">{userPlan?.planName || 'N/A'}</span>) does <span className="font-bold">not</span> match {trainerName}'s plan (<span className="font-bold">{trainerPlan || 'N/A'}</span>).
              </p>
            )}
          </div>
        )}
        {!userPlan && !isLoadingPlans && (
          <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
            <p className="text-gray-500">Log in to compare your pricing plan with the trainer's.</p>
          </div>
        )}

        {/* Virtual Sessions Section */}
        <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <CalendarIcon className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-black">Virtual Sessions</h2>
          </div>
          {virtualSessions.length > 0 ? (
            <ul>
              {virtualSessions.map((session) => (
                <li key={session._id} className="mb-2">
                  <span className="font-bold">{session.title}</span> — {session.start} to {session.end} at {session.location}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No virtual sessions found for this trainer.</p>
          )}
        </div>

        {/* Joinable Session Calendar */}
        {console.log("Rendering JoinableSessionCalendar with planMatch:", planMatch)}
        <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <CalendarIcon className="h-6 w-6 text-green-600" />
            <h2 className="text-xl font-semibold text-black">Join a Session</h2>
          </div>
          <JoinableSessionCalendar
            trainerId={trainerId}
            height={600}
            planMatch={!!planMatch}
          />
        </div>
      </div>
    </div>
  )
}
