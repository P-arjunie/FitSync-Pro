/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useParams, useSearchParams } from 'next/navigation'
import { User, CalendarIcon, Plus, DollarSign, Shield, AlertCircle, CheckCircle } from 'lucide-react'
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
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Enhanced Trainer Header */}
        <div className="mb-8 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-red-600 to-black p-8 text-white">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="bg-white/20 p-3 rounded-full">
                <User className="h-10 w-10 text-white" />
              </div>
              <div className="text-center">
                <h1 className="text-4xl font-bold mb-2">
                  {trainerName}
                </h1>
                <p className="text-red-100 text-lg font-medium">Professional Gym Trainer</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Trainer's Pricing Plans Section */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-black text-white p-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-6 w-6 text-red-500" />
                  <h2 className="text-xl font-bold">Available Plans</h2>
                </div>
              </div>
              <div className="p-6">
                {trainerPricingPlans.length > 0 ? (
                  <div className="space-y-3">
                    {trainerPricingPlans.map((plan, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border-l-4 border-red-500">
                        <Shield className="h-5 w-5 text-red-600" />
                        <span className="font-semibold text-gray-800">{plan}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No pricing plans available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Plan Comparison Section */}
            {userPlan && trainerPlan && !isLoadingPlans && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className={`${planMatch ? 'bg-green-600' : 'bg-red-600'} text-white p-4`}>
                  <div className="flex items-center gap-3">
                    {planMatch ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      <AlertCircle className="h-6 w-6" />
                    )}
                    <h2 className="text-xl font-bold">Plan Compatibility</h2>
                  </div>
                </div>
                <div className="p-6">
                  {planMatch ? (
                    <div className="text-center py-4">
                      <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                      <p className="text-lg font-semibold text-gray-800 mb-2">Perfect Match!</p>
                      <p className="text-gray-600">
                        Your <span className="font-bold text-black">{userPlan.planName}</span> plan is compatible with {trainerName}'s training sessions.
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                      <p className="text-lg font-semibold text-gray-800 mb-2">Plan Mismatch</p>
                      <p className="text-gray-600 mb-4">
                        Your <span className="font-bold text-black">{userPlan?.planName || 'N/A'}</span> plan doesn't match this trainer's available plans.
                      </p>
                      <p className="text-sm text-gray-500">Consider upgrading your plan to access this trainer's sessions.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!userPlan && !isLoadingPlans && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                <div className="text-center py-8">
                  <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Sign In Required</h3>
                  <p className="text-gray-600">Log in to compare your pricing plan with the trainer's available plans.</p>
                </div>
              </div>
            )}

            {isLoadingPlans && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                <div className="text-center py-8">
                  <div className="animate-spin h-12 w-12 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600 font-medium">Loading plan information...</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Calendar */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-black text-white p-4">
              <div className="flex items-center gap-3">
                <CalendarIcon className="h-6 w-6 text-red-500" />
                <h2 className="text-xl font-bold">Available Sessions</h2>
              </div>
            </div>
            <div className="p-8">
              <JoinableSessionCalendar
                trainerId={trainerId}
                height={700}
                planMatch={!!planMatch}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}