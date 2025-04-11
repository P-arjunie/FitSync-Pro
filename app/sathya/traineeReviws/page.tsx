'use client';

import React, { useState, useEffect } from 'react';

interface Review {
  trainer: string;
  sessionType: string;
  date: string;
  comments: string;
  rating: number;
  createdAt: Date;
}

const ReviewsPage = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        console.log('Fetching all reviews...');

        const response = await fetch('/api/feedback/getReviews');
        const data = await response.json();

        console.log('Fetched reviews:', data);

        if (response.ok && Array.isArray(data.reviews)) {
          // Sort reviews by date (newest first)
          const sortedReviews = data.reviews.sort(
            (a: Review, b: Review) =>
              new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          setReviews(sortedReviews);
        } else {
          setError(data.message || 'Something went wrong');
        }
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setError('Failed to fetch reviews');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
        All Reviews
      </h2>

      {loading && <p>Loading reviews...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && reviews.length === 0 && <p>No reviews yet.</p>}

      {reviews.length > 0 && (
        <div className="space-y-6">
          {reviews.map((review, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
            >
              <div className="flex justify-between items-center mb-2">
                <div className="text-lg font-semibold text-gray-800">
                  {review.sessionType}
                </div>
                <div className="text-yellow-500 text-sm">
                  {Array.from({ length: 5 }, (_, i) => (
                    <span key={i}>{i < review.rating ? '★' : '☆'}</span>
                  ))}
                </div>
              </div>
              <p className="text-gray-700 mb-2">{review.comments}</p>
              <div className="text-gray-500 text-sm flex justify-between">
                <span>Trainer: {review.trainer}</span>
                <span>{new Date(review.date).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewsPage;
