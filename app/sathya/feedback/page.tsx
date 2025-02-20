'use client';  

import React, { useState } from 'react';

const ReviewPage = () => {
  const [trainer, setTrainer] = useState('');
  const [sessionType, setSessionType] = useState('');
  const [date, setDate] = useState('');
  const [comments, setComments] = useState('');
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/reviewmanagement/submitReview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trainer, sessionType, date, comments, rating }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Review submitted successfully!');
      } else {
        setError(data.message || 'Something went wrong');
      }
    } catch (err) {
      setError('Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">RATE US</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-600 font-semibold mb-2" htmlFor="trainer">
            Trainer:
          </label>
          <input
            type="text"
            id="trainer"
            value={trainer}
            onChange={(e) => setTrainer(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-600 font-semibold mb-2" htmlFor="sessionType">
            Session Type:
          </label>
          <input
            type="text"
            id="sessionType"
            value={sessionType}
            onChange={(e) => setSessionType(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-600 font-semibold mb-2" htmlFor="date">
            Date:
          </label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-600 font-semibold mb-2" htmlFor="comments">
            Comments:
          </label>
          <textarea
            id="comments"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>

        <div className="mb-6">
  <label className="block text-gray-600 font-semibold mb-2">Rating:</label>
  <div className="flex space-x-2">
    {[1, 2, 3, 4, 5].map((star) => (
      <span
        key={star}
        onClick={() => setRating(star)}
        className={`cursor-pointer text-4xl ${star <= rating ? 'text-yellow-500' : 'text-gray-300'}`}
      >
        ★
      </span>
    ))}
  </div>
</div>


        <button
          type="submit"
          className="w-full bg-red-500 text-white py-3 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Submit'}
        </button>

        {error && <p className="mt-4 text-red-500 text-center">{error}</p>}
      </form>
    </div>
  );
};

export default ReviewPage;
