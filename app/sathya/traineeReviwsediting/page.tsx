'use client';

import React, { useState, useEffect } from 'react';
 

interface Review { //define the expected structure of data objects used in your components or functions
  _id: string;
  trainer: string;
  sessionType: string;
  date: string;
  comments: string;
  rating: number;
  createdAt: string;
  user: string; // <-- this field should exist
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
      const response = await fetch('/api/feedback/getReviews');

      if (!response.ok) throw new Error(`Server responded with status: ${response.status}`);

      const text = await response.text();
      if (!text) throw new Error('Empty response from server');

      const data = JSON.parse(text);

      if (!Array.isArray(data.reviews)) {
        setError(data.message || 'Invalid review data format');
        return;
      }

      // Sort newest first
      const sortedReviews = data.reviews.sort(
        (a: Review, b: Review) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setReviews(sortedReviews);

      // Group reviews by trainer
      const groups: Record<string, Review[]> = {};
      const stats: Record<string, TrainerStats> = {};

      sortedReviews.forEach((review: Review) => {
        if (!groups[review.trainer]) {
          groups[review.trainer] = [];
          stats[review.trainer] = {
            averageRating: 0,
            totalReviews: 0,
            ratingDistribution: [0, 0, 0, 0, 0],
          };
        }
        groups[review.trainer].push(review);
        if (review.rating >= 1 && review.rating <= 5) {
          stats[review.trainer].ratingDistribution[review.rating - 1]++;
        }
      });

      Object.keys(groups).forEach((trainer) => {
        const trainerReviews = groups[trainer];
        const totalRating = trainerReviews.reduce((sum, r) => sum + r.rating, 0);
        stats[trainer].averageRating = totalRating / trainerReviews.length;
        stats[trainer].totalReviews = trainerReviews.length;
        // Ensure trainer reviews are also sorted newest first
        groups[trainer].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      });

      setTrainerGroups(groups);
      setTrainerStats(stats);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;

    try {
      const response = await fetch('/api/feedback/deleteReview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, _method: 'DELETE' }),
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const updatedReviews = reviews.filter((r) => r._id !== reviewId);
      setReviews(updatedReviews);

      const updatedGroups: typeof trainerGroups = {};
      const updatedStats: typeof trainerStats = {};

      updatedReviews.forEach((review) => {
        if (!updatedGroups[review.trainer]) {
          updatedGroups[review.trainer] = [];
          updatedStats[review.trainer] = {
            averageRating: 0,
            totalReviews: 0,
            ratingDistribution: [0, 0, 0, 0, 0],
          };
        }
        updatedGroups[review.trainer].push(review);
        if (review.rating >= 1 && review.rating <= 5) {
          updatedStats[review.trainer].ratingDistribution[review.rating - 1]++;
        }
      });

      Object.keys(updatedGroups).forEach((trainer) => {
        const trainerReviews = updatedGroups[trainer];
        const totalRating = trainerReviews.reduce((sum, r) => sum + r.rating, 0);
        updatedStats[trainer].averageRating = totalRating / trainerReviews.length;
        updatedStats[trainer].totalReviews = trainerReviews.length;
        updatedGroups[trainer].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      });

      setTrainerGroups(updatedGroups);
      setTrainerStats(updatedStats);
    } catch (err: any) {
      setError(err.message || 'Failed to delete review');
    }
  };

  const renderReviewCard = (review: Review) => (
    <div
      key={review._id}
      className="bg-gray-800 p-6 rounded-lg shadow-md relative hover:shadow-lg transition-shadow duration-200 border-l-4 border-red-500"
    >
      {/* User name at the top */}
      <div className="text-sm text-red-400 mb-2">By: {review.user || 'Anonymous'}</div>
  
      {/* Delete button */}
      <div className="absolute top-3 right-3">
        <button
          onClick={() => handleDeleteReview(review._id)}
          className="text-gray-400 hover:text-red-500 transition-colors"
        >
          🗑️
        </button>
      </div>
  
      {/* Session type and rating */}
      <div className="flex justify-between items-center mb-2">
        <div className="text-lg text-white">{review.sessionType}</div>
        <div className="text-yellow-500 text-sm">
          {Array.from({ length: 5 }, (_, i) => (
            <span key={i}>{i < review.rating ? '★' : '☆'}</span>
          ))}
        </div>
      </div>
  
      {/* Comments */}
      <p className="text-gray-300 mb-4">{review.comments}</p>
  
      {/* Trainer and date */}
      <div className="text-gray-400 text-sm flex justify-between">
        <span>Trainer: {review.trainer}</span>
        <span>{new Date(review.date).toLocaleDateString()}</span>
      </div>
    </div>
  );
  
  const renderTrainerStatistics = (trainer: string, stats: TrainerStats) => (
    <div className="bg-gray-900 p-6 rounded-lg shadow mb-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <div className="text-yellow-500 text-2xl font-bold mr-2">{stats.averageRating.toFixed(1)}</div>
          <div className="text-yellow-500">
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i}>{i < Math.round(stats.averageRating) ? '★' : '☆'}</span>
            ))}
          </div>
        </div>
        <div className="text-gray-400 text-sm bg-gray-800 px-3 py-1 rounded-full">
          {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
        </div>
      </div>
      <div className="space-y-2 mt-4">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = stats.ratingDistribution[rating - 1];
          const percentage = stats.totalReviews ? (count / stats.totalReviews) * 100 : 0;
          return (
            <div key={rating} className="flex items-center text-sm">
              <div className="w-8 text-gray-300">{rating}★</div>
              <div className="flex-1 mx-2 h-3 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full" style={{ width: `${percentage}%` }}></div>
              </div>
              <div className="w-8 text-right text-gray-400">{count}</div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-black text-white px-4 sm:px-8 py-8">
      <h2 className="text-4xl font-bold text-center mb-10">Feedback Management</h2>
  
      {/* Tab Switcher */}
      <div className="flex mb-10 bg-gray-900 rounded-lg overflow-hidden max-w-3xl mx-auto">
        {(['all', 'byTrainer'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-4 px-6 text-center font-semibold transition-colors ${
              activeTab === tab ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {tab === 'all' ? 'All Feedbacks' : 'Trainer Feedbacks'}
          </button>
        ))}
      </div>
  
      {/* Loading/Error States */}
      {loading ? (
        <div className="flex justify-center my-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-900 border-l-4 border-red-500 text-red-100 p-4 mb-6 max-w-4xl mx-auto">{error}</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-20 text-gray-400 text-lg">No reviews available.</div>
      ) : activeTab === 'all' ? (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 px-2 sm:px-4 md:px-6">
          {reviews.map(renderReviewCard)}
        </div>
      ) : (
        <div className="px-2 sm:px-4 md:px-6">
          {Object.entries(trainerGroups).map(([trainer, trainerReviews]) => (
            <div key={trainer} className="mb-16">
              <div className="bg-gray-800 text-white py-4 px-6 rounded-t-lg flex items-center">
                <span className="mr-2 text-red-500">👤</span>
                <h4 className="font-bold text-xl">{trainer}</h4>
              </div>
              <div className="bg-gray-900 px-4 py-4">
                {renderTrainerStatistics(trainer, trainerStats[trainer])}
              </div>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 p-6 bg-gray-900 rounded-b-lg mb-8">
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
