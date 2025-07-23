'use client';

import React, { useState, useEffect } from 'react';

interface Review {
  _id: string;
  trainer: string;
  sessionType: string;
  date: string;
  comments: string;
  rating: number;
  createdAt: string;
  userName: string;
  memberEmail: string;
}

interface TrainerStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: number[];
}

const ReviewsPage = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'byTrainer'>('all');
  const [trainerGroups, setTrainerGroups] = useState<Record<string, Review[]>>({});
  const [trainerStats, setTrainerStats] = useState<Record<string, TrainerStats>>({});

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/feedback/getReviews');
      if (!response.ok) throw new Error(`Server responded with status: ${response.status}`);
      const data = await response.json();

      if (!Array.isArray(data.reviews)) {
        setError(data.message || 'Invalid review data format');
        setLoading(false);
        return;
      }
      
      const fetchedReviews = data.reviews;
      updateStateWithReviews(fetchedReviews);

    } catch (err: any) {
      setError(err.message || 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  const updateStateWithReviews = (currentReviews: Review[]) => {
    setReviews(currentReviews);

    const groups: Record<string, Review[]> = {};
    const stats: Record<string, TrainerStats> = {};

    currentReviews.forEach((review: Review) => {
      if (!groups[review.trainer]) {
        groups[review.trainer] = [];
        stats[review.trainer] = { averageRating: 0, totalReviews: 0, ratingDistribution: [0, 0, 0, 0, 0] };
      }
      groups[review.trainer].push(review);
      if (review.rating >= 1 && review.rating <= 5) {
        stats[review.trainer].ratingDistribution[review.rating - 1]++;
      }
    });

    Object.keys(groups).forEach((trainer) => {
      const trainerReviews = groups[trainer];
      const totalRating = trainerReviews.reduce((sum, r) => sum + r.rating, 0);
      stats[trainer].averageRating = totalRating > 0 ? totalRating / trainerReviews.length : 0;
      stats[trainer].totalReviews = trainerReviews.length;
    });

    setTrainerGroups(groups);
    setTrainerStats(stats);
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;

    try {
      const response = await fetch(`/api/feedback/deleteReview?id=${reviewId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Failed to delete review');
      }

      const updatedReviews = reviews.filter((r) => r._id !== reviewId);
      updateStateWithReviews(updatedReviews);

    } catch (err: any) {
      setError(err.message);
    }
  };

  const renderReviewCard = (review: Review) => (
    <div key={review._id} className="bg-gray-800 p-6 rounded-lg shadow-md relative hover:shadow-lg transition-shadow duration-200 border-l-4 border-red-500">
      <div className="text-sm text-red-400 mb-2 font-semibold">
        By: {review.userName || 'Anonymous'} ({review.memberEmail})
      </div>
  
      <div className="absolute top-3 right-3">
        <button 
          onClick={() => handleDeleteReview(review._id)} 
          className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full"
        >
          🗑️
        </button>
      </div>
  
      <div className="flex justify-between items-center mb-2">
        <div className="text-lg text-white font-bold">{review.sessionType} Session</div>
        <div className="text-yellow-500 text-sm">
          {Array.from({ length: 5 }, (_, i) => (<span key={i}>{i < review.rating ? '★' : '☆'}</span>))}
        </div>
      </div>
  
      <p className="text-gray-300 mb-4 italic">"{review.comments}"</p>
  
      <div className="text-gray-400 text-sm flex justify-between pt-2 border-t border-gray-700">
        <span>For: <span className="font-medium text-gray-200">{review.trainer}</span></span>
        <span>{new Date(review.date).toLocaleDateString()}</span>
      </div>
    </div>
  );

  // Add this function to render trainer statistics
  const renderTrainerStatistics = (trainer: string, stats: TrainerStats) => (
    <div className="bg-gray-900 p-6 rounded-lg shadow mb-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <div className="text-yellow-500 text-3xl font-bold mr-3">{stats.averageRating.toFixed(1)}</div>
          <div className="text-yellow-500 text-xl">
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i}>{i < Math.round(stats.averageRating) ? '★' : '☆'}</span>
            ))}
          </div>
        </div>
        <div className="text-gray-400 text-sm bg-gray-800 px-3 py-1 rounded-full">
          Based on {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
        </div>
      </div>
      <div className="space-y-2 mt-4">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = stats.ratingDistribution[rating - 1] || 0;
          const percentage = stats.totalReviews ? (count / stats.totalReviews) * 100 : 0;
          return (
            <div key={rating} className="flex items-center text-sm">
              <div className="w-8 text-gray-300">{rating}★</div>
              <div className="flex-1 mx-2 h-3 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
              </div>
              <div className="w-8 text-right text-gray-400">{count}</div>
            </div>
          );
        })}
      </div>
    </div>
  );

return (
  <div className="w-full min-h-screen bg-white text-black px-4 sm:px-8 py-8">
    <h2 className="text-4xl font-bold text-center mb-10 text-black">Feedback Management</h2>
  
      <div className="flex mb-10 bg-gray-900 rounded-lg overflow-hidden max-w-sm mx-auto shadow-lg">
        {(['all', 'byTrainer'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 px-4 text-center font-semibold transition-all duration-300 ${
              activeTab === tab ? 'bg-red-600 text-white shadow-inner' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {tab === 'all' ? 'All Feedbacks' : 'By Trainer'}
          </button>
        ))}
      </div>
  
      {loading ? (
        <div className="flex justify-center my-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-900 border-l-4 border-red-500 text-red-100 p-4 mb-6 max-w-4xl mx-auto rounded-r-lg">{error}</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-20 text-gray-400 text-lg">No reviews have been submitted yet.</div>
      ) : activeTab === 'all' ? (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 px-2 sm:px-4 md:px-6">
          {reviews.map(renderReviewCard)}
        </div>
      ) : (
        <div className="px-2 sm:px-4 md:px-6 max-w-7xl mx-auto">
          {Object.entries(trainerGroups).map(([trainer, trainerReviews]) => (
            <div key={trainer} className="mb-16">
              <div className="bg-gray-800 text-white py-4 px-6 rounded-t-lg flex items-center shadow-md">
                <span className="mr-3 text-2xl text-red-500">👤</span>
                <h4 className="font-bold text-2xl tracking-wide">{trainer}</h4>
              </div>
              <div className="bg-gray-900/50 px-4 py-4 backdrop-blur-sm">
                {renderTrainerStatistics(trainer, trainerStats[trainer])}
              </div>
              <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 p-6 bg-gray-900/50 rounded-b-lg mb-8 backdrop-blur-sm">
                {trainerReviews.map(renderReviewCard)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewsPage;