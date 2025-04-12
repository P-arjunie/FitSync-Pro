'use client';

import React, { useState, useEffect } from 'react';

const ReviewPage = () => {
  const [trainer, setTrainer] = useState('');
  const [trainers, setTrainers] = useState<string[]>([]);
  const [sessionType, setSessionType] = useState('');
  const [date, setDate] = useState('');
  const [comments, setComments] = useState('');
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ✅ Fetch trainer names from API
  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        const response = await fetch('/api/trainers/getnames');
        const data = await response.json();
        if (response.ok) {
          setTrainers(data.trainers.map((t: { name: string }) => t.name));
        } else {
          console.error(data.message);
        }
      } catch (err) {
        console.error('Failed to fetch trainers', err);
      }
    };

    fetchTrainers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/feedback/submitReview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trainer, sessionType, date, comments, rating }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Review submitted successfully!');
        // Clear form
        setTrainer('');
        setSessionType('');
        setDate('');
        setComments('');
        setRating(0);
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
        {/* Trainer Dropdown */}
        <div className="mb-4">
          <label htmlFor="trainer" className="block text-gray-600 font-semibold mb-2">
            Trainer:
          </label>
          <select
            id="trainer"
            value={trainer}
            onChange={(e) => setTrainer(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            required
          >
            <option value="">Select a Trainer</option>
            {trainers.map((trainerName, index) => (
              <option key={index} value={trainerName}>
                {trainerName}
              </option>
            ))}
          </select>
        </div>

        {/* Session Type */}
        <div className="mb-4">
          <label htmlFor="sessionType" className="block text-gray-600 font-semibold mb-2">
            Session Type:
          </label>
          <input
            type="text"
            id="sessionType"
            value={sessionType}
            onChange={(e) => setSessionType(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            required
          />
        </div>

        {/* Date */}
        <div className="mb-4">
          <label htmlFor="date" className="block text-gray-600 font-semibold mb-2">
            Date:
          </label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            required
          />
        </div>

        {/* Comments */}
        <div className="mb-4">
          <label htmlFor="comments" className="block text-gray-600 font-semibold mb-2">
            Comments:
          </label>
          <textarea
            id="comments"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            required
          />
        </div>

        {/* Rating */}
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

        {/* Submit Button */}
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
