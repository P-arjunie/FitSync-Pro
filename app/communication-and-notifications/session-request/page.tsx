"use client";
import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/Components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Input } from '@/Components/ui/input';
import { MessageCircle } from 'lucide-react';

interface SessionRequest {
  id: string;
  memberName: string;
  memberEmail: string;
  sessionName: string;
  sessionType: string;
  preferredDate: string;
  preferredTime: string;
  pricingPlan: string;
  notes: string;
  status: string;
  place?: string;
  meetingLink?: string;
  rejectionReason?: string;
  startTime?: string;
  endTime?: string;
  description?: string;
}

export default function TrainerSessionRequests() {
  const [requests, setRequests] = useState<SessionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [approveFields, setApproveFields] = useState({ place: '', meetingLink: '', startTime: '', endTime: '', description: '' });
  const [rejectReason, setRejectReason] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<SessionRequest | null>(null);

  // Add state for reschedule/cancel modals
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [rescheduleFields, setRescheduleFields] = useState({ startTime: '', endTime: '', place: '', meetingLink: '', description: '' });
  const [cancelReason, setCancelReason] = useState('');
  const [selectedApprovedRequest, setSelectedApprovedRequest] = useState<SessionRequest | null>(null);
  const rescheduleLoading = useRef(false);
  const cancelLoading = useRef(false);

  // Get logged-in trainer ID
  const trainerId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;

  useEffect(() => {
    setLoading(true);
    setError('');
    const fetchRequests = async () => {
      try {
        let url = '/api/session-request';
        if (trainerId) {
          url += `?trainerId=${trainerId}`;
        }
        const res = await fetch(url);
        const data = await res.json();
        setRequests(data.requests || []);
      } catch (err) {
        setError('Failed to load requests.');
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, [trainerId]);

  const openApproveModal = (req: SessionRequest) => {
    setSelectedRequest(req);
    setApproveFields({ place: '', meetingLink: '', startTime: '', endTime: '', description: '' });
    setShowApproveModal(true);
  };
  const openRejectModal = (req: SessionRequest) => {
    setSelectedRequest(req);
    setRejectReason('');
    setShowRejectModal(true);
  };
  const handleApproveSubmit = async () => {
    if (!selectedRequest) return;
    const isPhysical = selectedRequest.sessionType === 'Physical';
    if (!approveFields.startTime.trim()) return alert('Start time is required');
    if (!approveFields.endTime.trim()) return alert('End time is required');
    if (isPhysical && !approveFields.place.trim()) return alert('Place is required');
    if (!isPhysical && !approveFields.meetingLink.trim()) return alert('Meeting link is required');
    setActionLoading(selectedRequest.id);
    try {
      await fetch('/api/session-request', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedRequest.id,
          action: 'approved',
          memberEmail: selectedRequest.memberEmail,
          trainerEmail: selectedRequest.trainerEmail,
          trainerName: selectedRequest.trainerName,
          sessionName: selectedRequest.sessionName,
          sessionType: selectedRequest.sessionType,
          preferredDate: selectedRequest.preferredDate,
          startTime: approveFields.startTime,
          endTime: approveFields.endTime,
          pricingPlan: selectedRequest.pricingPlan,
          place: isPhysical ? approveFields.place : undefined,
          meetingLink: !isPhysical ? approveFields.meetingLink : undefined,
          description: approveFields.description,
        }),
      });
      setRequests(reqs => reqs.map(r => r.id === selectedRequest.id ? { ...r, status: 'approved', place: approveFields.place, meetingLink: approveFields.meetingLink, startTime: approveFields.startTime, endTime: approveFields.endTime, description: approveFields.description } : r));
      setShowApproveModal(false);
    } catch (err) {
      alert('Failed to approve request.');
    } finally {
      setActionLoading(null);
    }
  };
  const handleRejectSubmit = async () => {
    if (!selectedRequest) return;
    if (!rejectReason.trim()) return alert('Reason is required');
    setActionLoading(selectedRequest.id);
    try {
      await fetch('/api/session-request', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedRequest.id,
          action: 'rejected',
          memberEmail: selectedRequest.memberEmail,
          trainerEmail: selectedRequest.trainerEmail,
          trainerName: selectedRequest.trainerName,
          sessionName: selectedRequest.sessionName,
          sessionType: selectedRequest.sessionType,
          preferredDate: selectedRequest.preferredDate,
          preferredTime: selectedRequest.preferredTime,
          pricingPlan: selectedRequest.pricingPlan,
          rejectionReason: rejectReason,
        }),
      });
      setRequests(reqs => reqs.map(r => r.id === selectedRequest.id ? { ...r, status: 'rejected', rejectionReason: rejectReason } : r));
      setShowRejectModal(false);
    } catch (err) {
      alert('Failed to reject request.');
    } finally {
      setActionLoading(null);
    }
  };

  const openRescheduleModal = (req: SessionRequest) => {
    setSelectedApprovedRequest(req);
    setRescheduleFields({
      startTime: req.startTime || '',
      endTime: req.endTime || '',
      place: req.place || '',
      meetingLink: req.meetingLink || '',
      description: req.description || '',
    });
    setShowRescheduleModal(true);
  };
  const openCancelModal = (req: SessionRequest) => {
    setSelectedApprovedRequest(req);
    setCancelReason('');
    setShowCancelModal(true);
  };
  const handleRescheduleSubmit = async () => {
    if (!selectedApprovedRequest) return;
    const isPhysical = selectedApprovedRequest.sessionType === 'Physical';
    if (!rescheduleFields.startTime.trim()) return alert('Start time is required');
    if (!rescheduleFields.endTime.trim()) return alert('End time is required');
    if (isPhysical && !rescheduleFields.place.trim()) return alert('Place is required');
    if (!isPhysical && !rescheduleFields.meetingLink.trim()) return alert('Meeting link is required');
    rescheduleLoading.current = true;
    try {
      await fetch('/api/session-request', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedApprovedRequest.id,
          action: 'approved',
          memberEmail: selectedApprovedRequest.memberEmail,
          trainerEmail: selectedApprovedRequest.trainerEmail,
          trainerName: selectedApprovedRequest.trainerName,
          sessionName: selectedApprovedRequest.sessionName,
          sessionType: selectedApprovedRequest.sessionType,
          preferredDate: selectedApprovedRequest.preferredDate,
          startTime: rescheduleFields.startTime,
          endTime: rescheduleFields.endTime,
          pricingPlan: selectedApprovedRequest.pricingPlan,
          place: isPhysical ? rescheduleFields.place : undefined,
          meetingLink: !isPhysical ? rescheduleFields.meetingLink : undefined,
          description: rescheduleFields.description,
        }),
      });
      setRequests(reqs => reqs.map(r => r.id === selectedApprovedRequest.id ? { ...r, ...rescheduleFields } : r));
      setShowRescheduleModal(false);
    } catch (err) {
      alert('Failed to reschedule session.');
    } finally {
      rescheduleLoading.current = false;
    }
  };
  const handleCancelSubmit = async () => {
    if (!selectedApprovedRequest) return;
    if (!cancelReason.trim()) return alert('Reason is required');
    cancelLoading.current = true;
    try {
      await fetch('/api/session-request', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedApprovedRequest.id,
          action: 'rejected',
          memberEmail: selectedApprovedRequest.memberEmail,
          trainerEmail: selectedApprovedRequest.trainerEmail,
          trainerName: selectedApprovedRequest.trainerName,
          sessionName: selectedApprovedRequest.sessionName,
          sessionType: selectedApprovedRequest.sessionType,
          preferredDate: selectedApprovedRequest.preferredDate,
          preferredTime: selectedApprovedRequest.preferredTime,
          pricingPlan: selectedApprovedRequest.pricingPlan,
          rejectionReason: cancelReason,
        }),
      });
      setRequests(reqs => reqs.map(r => r.id === selectedApprovedRequest.id ? { ...r, status: 'rejected', rejectionReason: cancelReason } : r));
      setShowCancelModal(false);
    } catch (err) {
      alert('Failed to cancel session.');
    } finally {
      cancelLoading.current = false;
    }
  };

  // Group requests by status and type
  const approvedPhysical = requests.filter(r => r.status === 'approved' && r.sessionType === 'Physical');
  const approvedVirtual = requests.filter(r => r.status === 'approved' && r.sessionType === 'Virtual');
  const pending = requests.filter(r => r.status === 'pending');
  const rejected = requests.filter(r => r.status === 'rejected');
  const approved = requests.filter(r => r.status === 'approved');

  // Unique participants for each type
  const uniquePhysicalMembers = Array.from(new Map(approvedPhysical.map(r => [r.memberEmail, r])).values());
  const uniqueVirtualMembers = Array.from(new Map(approvedVirtual.map(r => [r.memberEmail, r])).values());

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 relative">
      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold mb-8 text-black text-center">Individual Session Handling</h1>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <>
            {/* Counts Row */}
            <div className="flex flex-col md:flex-row gap-6 mb-10 justify-center">
              <div className="flex-1 flex items-center justify-center">
                <div className="bg-yellow-100 border-l-4 border-yellow-500 rounded-lg px-6 py-4 w-full text-center shadow-sm">
                  <span className="text-yellow-700 font-semibold text-lg">Pending Requests</span>
                  <div className="text-3xl font-bold text-yellow-700 mt-1">{pending.length}</div>
                </div>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <div className="bg-green-100 border-l-4 border-green-500 rounded-lg px-6 py-4 w-full text-center shadow-sm">
                  <span className="text-green-700 font-semibold text-lg">Approved</span>
                  <div className="text-3xl font-bold text-green-700 mt-1">{approved.length}</div>
                </div>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <div className="bg-red-100 border-l-4 border-red-500 rounded-lg px-6 py-4 w-full text-center shadow-sm">
                  <span className="text-red-700 font-semibold text-lg">Rejected</span>
                  <div className="text-3xl font-bold text-red-700 mt-1">{rejected.length}</div>
                </div>
              </div>
            </div>
            {/* Participants Lists Row */}
            <div className="flex flex-col md:flex-row gap-6 mb-10">
              {/* Physical Session Participants */}
              <div className="flex-1 bg-green-50 border-l-4 border-green-500 rounded-lg p-4 shadow-sm">
                <h2 className="text-lg font-semibold text-green-700 mb-2 flex items-center gap-2"><span>Physical Session Participants</span></h2>
                {uniquePhysicalMembers.length === 0 ? (
                  <div className="text-gray-500">No approved physical session participants.</div>
                ) : (
                  <ul className="list-disc pl-6">
                    {uniquePhysicalMembers.map(m => (
                      <li key={m.memberEmail} className="mb-1 text-gray-800 font-medium">{m.memberName} <span className="text-xs text-gray-500">({m.memberEmail})</span></li>
                    ))}
                  </ul>
                )}
              </div>
              {/* Virtual Session Participants */}
              <div className="flex-1 bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 shadow-sm">
                <h2 className="text-lg font-semibold text-blue-700 mb-2 flex items-center gap-2"><span>Virtual Session Participants</span></h2>
                {uniqueVirtualMembers.length === 0 ? (
                  <div className="text-gray-500">No approved virtual session participants.</div>
                ) : (
                  <ul className="list-disc pl-6">
                    {uniqueVirtualMembers.map(m => (
                      <li key={m.memberEmail} className="mb-1 text-gray-800 font-medium">{m.memberName} <span className="text-xs text-gray-500">({m.memberEmail})</span></li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            {/* Pending Requests */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-yellow-700 mb-2">Pending Requests</h2>
              {pending.length === 0 ? (
                <div className="text-gray-500">No pending requests.</div>
              ) : (
                <div className="space-y-4">
                  {pending.map(req => (
                    <div key={req.id} className="border rounded-lg p-4 bg-yellow-50">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                        <div>
                          <div className="font-semibold text-black">{req.sessionName}</div>
                          <div className="text-sm text-gray-600">{req.sessionType} | {req.pricingPlan}</div>
                          <div className="text-sm text-gray-600">{req.preferredDate} {req.preferredTime}</div>
                        </div>
                        <div className="mt-2 md:mt-0">
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-200 text-yellow-800">Pending</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-700 mb-1">Member: {req.memberName} ({req.memberEmail})</div>
                      {req.notes && <div className="text-xs text-gray-500 mb-2">Notes: {req.notes}</div>}
                      <div className="flex gap-2 mt-2">
                        <Button onClick={() => openApproveModal(req)} disabled={actionLoading === req.id} className="bg-green-600 hover:bg-green-700 text-white">Approve</Button>
                        <Button onClick={() => openRejectModal(req)} disabled={actionLoading === req.id} className="bg-red-600 hover:bg-red-700 text-white">Reject</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Approved Requests */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-green-700 mb-2">Approved Requests</h2>
              {approved.length === 0 ? (
                <div className="text-gray-500">No approved requests.</div>
              ) : (
                <div className="space-y-4">
                  {approved.map(req => (
                    <div key={req.id} className="border rounded-lg p-4 bg-green-50">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                        <div>
                          <div className="font-semibold text-black">{req.sessionName}</div>
                          <div className="text-sm text-gray-600">{req.sessionType} | {req.pricingPlan}</div>
                          <div className="text-sm text-gray-600">{req.preferredDate} {req.preferredTime}</div>
                        </div>
                        <div className="mt-2 md:mt-0">
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-200 text-green-800">Approved</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-700 mb-1">Member: {req.memberName} ({req.memberEmail})</div>
                      {req.notes && <div className="text-xs text-gray-500 mb-2">Notes: {req.notes}</div>}
                      {req.place && <div className="text-xs text-gray-500 mb-2">Place: {req.place}</div>}
                      {req.meetingLink && <div className="text-xs text-gray-500 mb-2">Meeting Link: <a href={req.meetingLink} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">{req.meetingLink}</a></div>}
                      {req.description && <div className="text-xs text-gray-500 mb-2">Description: {req.description}</div>}
                      <div className="flex gap-2 mt-2">
                        <Button onClick={() => openRescheduleModal(req)} className="bg-[#e53935] hover:bg-[#b71c1c] text-white">Reschedule</Button>
                        <Button onClick={() => openCancelModal(req)} className="bg-gray-200 hover:bg-gray-300 text-[#e53935] border border-[#e53935]">Cancel</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Rejected Requests */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-red-700 mb-2">Rejected Requests</h2>
              {rejected.length === 0 ? (
                <div className="text-gray-500">No rejected requests.</div>
              ) : (
                <div className="space-y-4">
                  {rejected.map(req => (
                    <div key={req.id} className="border rounded-lg p-4 bg-red-50">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                        <div>
                          <div className="font-semibold text-black">{req.sessionName}</div>
                          <div className="text-sm text-gray-600">{req.sessionType} | {req.pricingPlan}</div>
                          <div className="text-sm text-gray-600">{req.preferredDate} {req.preferredTime}</div>
                        </div>
                        <div className="mt-2 md:mt-0">
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-200 text-red-800">Rejected</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-700 mb-1">Member: {req.memberName} ({req.memberEmail})</div>
                      {req.notes && <div className="text-xs text-gray-500 mb-2">Notes: {req.notes}</div>}
                      {req.rejectionReason && <div className="text-xs text-gray-500 mb-2">Reason: {req.rejectionReason}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      {/* Floating Message Button */}
      <a
        href="/communication-and-notifications/Trainer-chat"
        className="fixed bottom-8 right-8 z-50 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg flex items-center justify-center w-16 h-16 transition-colors"
        title="Message (Trainer Chat)"
      >
        <MessageCircle className="w-8 h-8" />
      </a>
      {/* Approve Modal */}
      <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
        <DialogContent className="bg-black bg-opacity-80 text-white backdrop-blur" aria-describedby="modal-description">
          <p id="modal-description" className="sr-only">Fill in the session details to approve this request.</p>
          <DialogHeader>
            <DialogTitle>Schedule Session</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block font-medium mb-1">Start Time <span className="text-red-600">*</span></label>
                  <Input type="time" value={approveFields.startTime} onChange={e => setApproveFields(f => ({ ...f, startTime: e.target.value }))} required className="text-white" style={{ colorScheme: 'dark' }} />
                </div>
                <div className="flex-1">
                  <label className="block font-medium mb-1">End Time <span className="text-red-600">*</span></label>
                  <Input type="time" value={approveFields.endTime} onChange={e => setApproveFields(f => ({ ...f, endTime: e.target.value }))} required className="text-white" style={{ colorScheme: 'dark' }} />
                </div>
              </div>
              {selectedRequest.sessionType === 'Physical' ? (
                <div>
                  <label className="block font-medium mb-1">Place <span className="text-red-600">*</span></label>
                  <Input value={approveFields.place} onChange={e => setApproveFields(f => ({ ...f, place: e.target.value }))} required className="text-white" />
                </div>
              ) : (
                <div>
                  <label className="block font-medium mb-1">Meeting Link <span className="text-red-600">*</span></label>
                  <Input value={approveFields.meetingLink} onChange={e => setApproveFields(f => ({ ...f, meetingLink: e.target.value }))} required className="text-white" />
                </div>
              )}
              <div>
                <label className="block font-medium mb-1">Description</label>
                <textarea value={approveFields.description} onChange={e => setApproveFields(f => ({ ...f, description: e.target.value }))} className="w-full border rounded p-2 bg-black bg-opacity-60 text-white" rows={3} placeholder="Add any notes or description..." />
              </div>
            </div>
          )}
          <div className="flex gap-2 mt-4">
            <Button onClick={handleApproveSubmit} disabled={actionLoading === selectedRequest?.id} className="bg-red-600 hover:bg-red-700 text-white">Confirm</Button>
            <Button variant="outline" onClick={() => setShowApproveModal(false)}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className="bg-black bg-opacity-80 text-white backdrop-blur" aria-describedby="modal-description-reject">
          <p id="modal-description-reject" className="sr-only">Provide a reason for rejecting this session request.</p>
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
          </DialogHeader>
          <div>
            <label className="block font-medium mb-1">Reason <span className="text-red-600">*</span></label>
            <Input value={rejectReason} onChange={e => setRejectReason(e.target.value)} required />
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleRejectSubmit} disabled={actionLoading === selectedRequest?.id} className="bg-red-600 hover:bg-red-700 text-white">Reject</Button>
            <Button variant="outline" onClick={() => setShowRejectModal(false)}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Reschedule Modal */}
      <Dialog open={showRescheduleModal} onOpenChange={setShowRescheduleModal}>
        <DialogContent className="bg-black bg-opacity-80 text-white backdrop-blur" aria-describedby="modal-description-reschedule">
          <p id="modal-description-reschedule" className="sr-only">Edit the session details to reschedule this request.</p>
          <DialogHeader>
            <DialogTitle>Reschedule Session</DialogTitle>
          </DialogHeader>
          {selectedApprovedRequest && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block font-medium mb-1">Start Time <span className="text-red-600">*</span></label>
                  <Input type="time" value={rescheduleFields.startTime} onChange={e => setRescheduleFields(f => ({ ...f, startTime: e.target.value }))} required className="text-white" style={{ colorScheme: 'dark' }} />
                </div>
                <div className="flex-1">
                  <label className="block font-medium mb-1">End Time <span className="text-red-600">*</span></label>
                  <Input type="time" value={rescheduleFields.endTime} onChange={e => setRescheduleFields(f => ({ ...f, endTime: e.target.value }))} required className="text-white" style={{ colorScheme: 'dark' }} />
                </div>
              </div>
              {selectedApprovedRequest.sessionType === 'Physical' ? (
                <div>
                  <label className="block font-medium mb-1">Place <span className="text-red-600">*</span></label>
                  <Input value={rescheduleFields.place} onChange={e => setRescheduleFields(f => ({ ...f, place: e.target.value }))} required className="text-white" />
                </div>
              ) : (
                <div>
                  <label className="block font-medium mb-1">Meeting Link <span className="text-red-600">*</span></label>
                  <Input value={rescheduleFields.meetingLink} onChange={e => setRescheduleFields(f => ({ ...f, meetingLink: e.target.value }))} required className="text-white" />
                </div>
              )}
              <div>
                <label className="block font-medium mb-1">Description</label>
                <textarea value={rescheduleFields.description} onChange={e => setRescheduleFields(f => ({ ...f, description: e.target.value }))} className="w-full border rounded p-2 bg-black bg-opacity-60 text-white" rows={3} placeholder="Add any notes or description..." />
              </div>
            </div>
          )}
          <div className="flex gap-2 mt-4">
            <Button onClick={handleRescheduleSubmit} disabled={rescheduleLoading.current} className="bg-[#e53935] hover:bg-[#b71c1c] text-white">Save Changes</Button>
            <Button variant="outline" onClick={() => setShowRescheduleModal(false)} className="bg-gray-200 hover:bg-gray-300 text-[#e53935] border border-[#e53935]">Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Cancel Modal */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent className="bg-black bg-opacity-80 text-white backdrop-blur" aria-describedby="modal-description-cancel">
          <p id="modal-description-cancel" className="sr-only">Provide a reason for cancelling this session request.</p>
          <DialogHeader>
            <DialogTitle>Cancel Session</DialogTitle>
          </DialogHeader>
          <div>
            <label className="block font-medium mb-1">Reason <span className="text-red-600">*</span></label>
            <Input value={cancelReason} onChange={e => setCancelReason(e.target.value)} required />
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleCancelSubmit} disabled={cancelLoading.current} className="bg-[#e53935] hover:bg-[#b71c1c] text-white">Cancel Session</Button>
            <Button variant="outline" onClick={() => setShowCancelModal(false)} className="bg-gray-200 hover:bg-gray-300 text-[#e53935] border border-[#e53935]">Back</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 