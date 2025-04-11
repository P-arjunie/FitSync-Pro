/*'use client';

import React, { useState, useEffect } from 'react';

const AdminReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [trainers, setTrainers] = useState({});

  // Fetch reviews and trainers data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch reviews
        const reviewsResponse = await fetch('/api/feedback/getReviews');
        if (!reviewsResponse.ok) {
          throw new Error('Failed to fetch reviews');
        }
        const reviewsData = await reviewsResponse.json();
        setReviews(reviewsData.reviews);

        // Fetch trainers to match IDs with names
        const trainersResponse = await fetch('/api/trainers');
        if (!trainersResponse.ok) {
          throw new Error('Failed to fetch trainers');
        }
        const trainersData = await trainersResponse.json();
        
        // Convert trainers array to object for easy lookup
        const trainersMap = {};
        trainersData.trainers.forEach(trainer => {
          trainersMap[trainer.id] = trainer;
        });
        setTrainers(trainersMap);
      } catch (err) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle review deletion
  const handleDeleteReview = async (reviewId) => {
    if (!confirm('Are you sure you want to delete this review?')) {
      return;
    }

    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/feedback/deleteReview?id=${reviewId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove the deleted review from state
        setReviews(reviews.filter(review => review._id !== reviewId));
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete review');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Render star rating
  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`text-2xl ${i < rating ? 'text-yellow-500' : 'text-gray-300'}`}>
        ★
      </span>
    ));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500 font-semibold">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Manage Reviews</h1>
      
      {reviews.length === 0 ? (
        <p className="text-center text-gray-500">No reviews found</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review) => (
            <div key={review._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-xl">
                    {trainers[review.trainer]?.name || 'Unknown Trainer'}
                  </h3>
                  <p className="text-gray-600">{review.sessionType}</p>
                </div>
                <button
                  onClick={() => handleDeleteReview(review._id)}
                  disabled={deleteLoading}
                  className="text-red-500 hover:text-red-700 transition"
                  title="Delete review"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
              
              <div className="mb-3 flex">
                {renderStars(review.rating)}
              </div>
              
              <p className="text-gray-700 mb-4">{review.comments}</p>
              
              <div className="flex justify-between text-sm text-gray-500">
                <span>Session Date: {formatDate(review.date)}</span>
                <span>Posted: {formatDate(review.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminReviewsPage;
*/