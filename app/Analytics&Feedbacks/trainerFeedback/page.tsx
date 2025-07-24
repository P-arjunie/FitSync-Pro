/*
  Trainer Feedback Management Page
  - Shows all feedback for the logged-in trainer (by email)
  - Allows trainer to delete any feedback on themselves
*/
'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '../../Components/Navbar';
import Footer from '../../Components/Footer_01';

interface Review {
  _id: string;
  trainer: string;
  sessionType: string;
  date: string;
  comments: string;
  rating: number;
  createdAt: string;
  memberEmail?: string;
}

const TrainerFeedbackPage = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [trainerEmail, setTrainerEmail] = useState<string | null>(null);
  const [trainerName, setTrainerName] = useState<string | null>(null);
  const [trainerRole, setTrainerRole] = useState<string | null>(null);
  const [trainerFullName, setTrainerFullName] = useState<string | null>(null);

  // Color palette (same as analytics page)
  const colors = {
    red: '#dc2626',
    darkBlue: '#1e293b',
    white: '#fff',
    black: '#000',
    gray: '#6b7280',
    lightGray: '#f3f4f6',
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setTrainerEmail(localStorage.getItem('userEmail'));
      setTrainerName(localStorage.getItem('userName'));
      setTrainerRole(localStorage.getItem('userRole'));
      // Try to get full name (for filtering reviews)
      const firstName = localStorage.getItem('firstName') || '';
      const lastName = localStorage.getItem('lastName') || '';
      const fullName = (firstName + ' ' + lastName).trim();
      setTrainerFullName(fullName || localStorage.getItem('userName') || '');
    }
  }, []);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!trainerFullName || trainerRole !== 'trainer') return;
      setLoading(true);
      setError(null);
      try {
        // Use the new secure API endpoint
        const res = await fetch('/api/feedback/getTrainerReviews?fullName=' + encodeURIComponent(trainerFullName));
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch reviews');
        setReviews(data.reviews || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load reviews');
      } finally {
        setLoading(false);
      }
    };
    if (trainerFullName && trainerRole === 'trainer') fetchReviews();
  }, [trainerFullName, trainerRole]);

  const handleDelete = async (reviewId: string) => {
    if (!reviewId) return;
    setDeleteLoading(reviewId);
    setActionMessage(null);
    try {
      const res = await fetch('/api/feedback/deleteReview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, _method: 'DELETE' })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Delete failed');
      setReviews(prev => prev.filter(r => r._id !== reviewId));
      setActionMessage('Review deleted successfully.');
    } catch (err: any) {
      setActionMessage(err.message || 'Failed to delete review.');
    } finally {
      setDeleteLoading(null);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white px-6 py-10 font-sans">
        {/* Greeting for logged-in approved trainer */}
        {trainerEmail && trainerRole === 'trainer' && (
          <div className="max-w-2xl mx-auto mb-4 flex justify-end">
            <span className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow">
              Hi{trainerName ? `, ${trainerName}` : `, ${trainerEmail}`}! Welcome back 👋
            </span>
          </div>
        )}
        <h2 className="text-3xl font-bold text-center mb-8 tracking-wide text-gray-900">
          <span className="text-gray-900">FitSyncPro</span>{' '}
          <span className="text-red-600">- My Feedback</span>
        </h2>
        {!trainerEmail || trainerRole !== 'trainer' ? (
          <div className="text-center py-12 text-gray-400">
            Please log in as an approved trainer to view your feedback.
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-900 border-l-4 border-red-500 text-red-100 p-4 mb-6 max-w-2xl mx-auto rounded-r-lg">
                {error}
              </div>
            )}
            {actionMessage && (
              <div className="bg-green-900 border-l-4 border-green-500 text-green-100 p-4 mb-6 max-w-2xl mx-auto rounded-r-lg">
                {actionMessage}
              </div>
            )}
            {loading ? (
              <div className="flex justify-center my-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-red-500"></div>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto space-y-6">
                {reviews.length === 0 ? (
                  <div className="bg-gray-100 rounded-lg p-8 text-center text-gray-500">
                    No feedback found for your trainer profile.
                  </div>
                ) : (
                  reviews.map((review) => (
                    <div 
                      key={review._id} 
                      className="bg-gray-900 text-white rounded-lg shadow-lg p-5 relative border-l-4 border-red-600"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-red-500 text-sm">
                          {Array.from({ length: 5 }, (_, i) => (
                            <span key={i}>{i < review.rating ? '★' : '☆'}</span>
                          ))}
                        </div>
                        <button
                          className="text-white bg-red-600 hover:bg-red-700 text-xs px-3 py-1 rounded transition-colors"
                          onClick={() => handleDelete(review._id)}
                          disabled={deleteLoading === review._id}
                        >
                          {deleteLoading === review._id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                      <p className="italic mb-2 text-gray-100">"{review.comments}"</p>
                      <div className="text-xs text-gray-400 mb-1">
                        {new Date(review.date).toLocaleDateString()} • {review.sessionType}
                      </div>
                      <div className="text-xs text-gray-500">By: {review.memberEmail || 'Anonymous'}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </>
  );
};

export default TrainerFeedbackPage;