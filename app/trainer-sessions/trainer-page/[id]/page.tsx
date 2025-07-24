/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useParams, useSearchParams } from 'next/navigation'
import { User, CalendarIcon, Plus, DollarSign, MessageCircle } from 'lucide-react'
import SessionCalendar from '../../components/session-calendar' // Assuming this path is correct
import JoinableSessionCalendar from '../../components/JoinableSessionCalendar' // Assuming this path is correct
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Input } from '@/Components/ui/input';
import { Button } from '@/Components/ui/button';

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

  // Add session request state and logic
  const [sessionType, setSessionType] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [pricingPlan, setPricingPlan] = useState('');
  const [memberName, setMemberName] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [sessionName, setSessionName] = useState('');
  const [canRequestSession, setCanRequestSession] = useState(false);
  const [restrictionMsg, setRestrictionMsg] = useState('');

  // On mount, get member name
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setMemberName(localStorage.getItem('userName') || '');
    }
    setPricingPlan('');
  }, []);

  // Eligibility logic
  useEffect(() => {
    async function checkEligibility() {
      if (typeof window === 'undefined') return;
      const memberId = localStorage.getItem('userId');
      if (!memberId) {
        setCanRequestSession(false);
        setRestrictionMsg('You must be logged in as a member to request a session.');
        return;
      }
      // Fetch purchased plans
      const plansRes = await fetch(`/api/fix-pending-pricing-plans?userId=${memberId}`);
      if (!plansRes.ok) {
        setCanRequestSession(false);
        setRestrictionMsg('Could not verify your plan. Please try again later.');
        return;
      }
      const plansData = await plansRes.json();
      const paidPlans = Array.isArray(plansData.paidPlans) ? plansData.paidPlans : [];
      const activePlans = paidPlans.filter((p: any) => ['paid', 'active'].includes(p.status));
      const planNames = activePlans.map((p: any) => p.planName);
      if (planNames.includes('Professional')) {
        setCanRequestSession(true);
        setRestrictionMsg('');
        return;
      }
      if (planNames.includes('Golden')) {
        // Fetch session requests for this member
        const reqRes = await fetch(`/api/session-request?memberId=${memberId}`);
        const reqData = await reqRes.json();
        const requests = reqData.requests || [];
        const physCount = requests.filter((r: any) => r.sessionType === 'Physical' && ['pending','approved'].includes(r.status)).length;
        const virtCount = requests.filter((r: any) => r.sessionType === 'Virtual' && ['pending','approved'].includes(r.status)).length;
        if (physCount < 1 || virtCount < 1) {
          setCanRequestSession(true);
          setRestrictionMsg('');
        } else {
          setCanRequestSession(false);
          setRestrictionMsg('Golden plan: You have already requested 1 physical and 1 virtual session.');
        }
        return;
      }
      setCanRequestSession(false);
      setRestrictionMsg('You must purchase the Professional or Golden plan to request a session.');
    }
    checkEligibility();
  }, []);

  // Handler for request form submit
  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    const memberEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
    const memberId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    if (!memberEmail || !memberId) {
      setError('You must be logged in as a member to request a session.');
      setLoading(false);
      return;
    }
    if (!memberName.trim()) {
      setError('Member name is required.');
      setLoading(false);
      return;
    }
    if (!sessionName.trim()) {
      setError('Session name is required.');
      setLoading(false);
      return;
    }
    if (!sessionType) {
      setError('Session type is required.');
      setLoading(false);
      return;
    }
    if (!preferredDate) {
      setError('Preferred date is required.');
      setLoading(false);
      return;
    }
    if (!preferredTime) {
      setError('Preferred time is required.');
      setLoading(false);
      return;
    }
    if (!pricingPlan) {
      setError('Pricing plan is required.');
      setLoading(false);
      return;
    }
    // Prevent past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(preferredDate);
    if (selectedDate < today) {
      setError('You cannot request a session for a past date.');
      setLoading(false);
      return;
    }
    try {
      // Fetch trainer email
      const trainerEmail = await fetch(`/api/trainer/getById?id=${trainerId}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => data?.trainer?.email || null);
      if (!trainerEmail) {
        setError('Could not find trainer email.');
        setLoading(false);
        return;
      }
      // Call API to create session request and send emails
      const res = await fetch('/api/session-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainerEmail,
          memberEmail,
          requestDetails: {
            memberName,
            memberEmail,
            trainerId,
            trainerName,
            sessionName,
            sessionType,
            preferredDate,
            preferredTime,
            pricingPlan,
            notes,
          },
          dashboardLink: '/communication-and-notifications/session-request',
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to submit request.');
        setLoading(false);
        return;
      }
      setSuccess('Your request has been submitted! The trainer will review it soon.');
      setSessionType('');
      setPreferredDate('');
      setPreferredTime('');
      setNotes('');
      setSessionName('');
      setPricingPlan('');
    } catch (err) {
      setError('Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // For date input min value
  const todayStr = new Date().toISOString().split('T')[0];

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
        {/* Trainer Header Box */}
        <div className="mb-8 flex flex-col items-center">
          <div className="flex items-center justify-center gap-3 mb-4 bg-gray-100 rounded-lg px-6 py-4 w-full max-w-xl shadow">
            <User className="h-8 w-8 text-red-600" />
            <h1 className="text-3xl font-bold text-black mr-2">
              {trainerName}
            </h1>
            <a
              href={`/communication-and-notifications/User-chat?trainerId=${trainerId}&trainerName=${encodeURIComponent(trainerName)}`}
              className="ml-2 bg-red-600 hover:bg-red-700 text-white rounded-full shadow p-2 flex items-center justify-center"
              title="Message Trainer"
              style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}
            >
              <MessageCircle className="w-6 h-6" />
            </a>
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
        <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <CalendarIcon className="h-6 w-6 text-green-600" />
            <h2 className="text-xl font-semibold text-black">Join a Session</h2>
          </div>
          <JoinableSessionCalendar
            trainerId={trainerId}
            height={600}
          />
        </div>
        {/* Session Request Section */}
        <div className="max-w-xl mx-auto">
          <div className="my-8 border-t border-gray-300"></div>
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-bold mb-4 text-black text-center">Request to Join Session</h3>
            {error && <div className="text-red-600 mb-2">{error}</div>}
            {success && <div className="text-green-600 mb-2">{success}</div>}
            {canRequestSession ? (
              <form onSubmit={handleRequestSubmit} className="space-y-4">
                <div>
                  <label className="block font-medium mb-1">Member Name <span className="text-red-600">*</span></label>
                  <Input type="text" value={memberName} readOnly required className="bg-gray-100" />
                </div>
                <div>
                  <label className="block font-medium mb-1">Session Name <span className="text-red-600">*</span></label>
                  <Input type="text" value={sessionName} onChange={e => setSessionName(e.target.value)} required placeholder="Enter session name" />
                </div>
                <div>
                  <label className="block font-medium mb-1">Session Type <span className="text-red-600">*</span></label>
                  <select value={sessionType} onChange={e => setSessionType(e.target.value)} required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm bg-white">
                    <option value="" disabled>Select session type</option>
                    <option value="Physical">Physical</option>
                    <option value="Virtual">Virtual</option>
                  </select>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block font-medium mb-1">Preferred Date <span className="text-red-600">*</span></label>
                    <Input type="date" value={preferredDate} onChange={e => setPreferredDate(e.target.value)} required min={todayStr} />
                  </div>
                  <div className="flex-1">
                    <label className="block font-medium mb-1">Preferred Time <span className="text-red-600">*</span></label>
                    <Input type="time" value={preferredTime} onChange={e => setPreferredTime(e.target.value)} required />
                  </div>
                </div>
                <div>
                  <label className="block font-medium mb-1">Pricing Plan <span className="text-red-600">*</span></label>
                  <Input type="text" value={pricingPlan} onChange={e => setPricingPlan(e.target.value)} required placeholder="Enter pricing plan" />
                </div>
                <div>
                  <label className="block font-medium mb-1">Notes</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full border rounded p-2" rows={3} />
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white">
                  {loading ? 'Submitting...' : 'Submit Request'}
                </Button>
              </form>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="bg-red-50 border border-red-200 rounded-lg px-6 py-6 shadow-sm flex flex-col items-center max-w-md">
                  <svg className="w-10 h-10 text-red-400 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m0-6v2m-6 4V7a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2z" />
                  </svg>
                  <div className="text-lg font-semibold text-red-700 text-center mb-1">
                    To request an individual session, you need to buy the <span className="font-bold">Professional</span> or <span className="font-bold">Golden</span> plan.
                  </div>
                  <div className="text-sm text-red-500 text-center">
                    Upgrade your plan to unlock exclusive 1-on-1 sessions with our trainers!
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
