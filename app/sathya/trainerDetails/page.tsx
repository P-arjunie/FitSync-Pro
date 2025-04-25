'use client';

import React, { useEffect, useState } from 'react';

interface Review {
  trainer: string;
  sessionType: string;
  date: string;
  comments: string;
  rating: number;
  createdAt: string;
}

interface Trainer {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  profileImage: string;
  averageRating: string;
  reviews: Review[];
  biography?: string;
  skills?: { name: string; level: number }[];
  certifications?: string[];
  preferredTrainingHours?: string;
}

const TrainerReviewsPage = () => {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/trainers/getTrainerWithReviews');
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        const data = await res.json();
        setTrainers(data.data);
      } catch (err: any) {
        console.error("Error fetching trainers:", err);
        setError("Could not load trainer data.");
      }
    };

    fetchData();
  }, []);

  return (
    <div className="bg-black min-h-screen px-6 py-10 font-sans text-white">
      <h2 className="text-3xl font-bold text-center mb-8 tracking-wide">
        <span className="text-white">FitSyncPro</span>{' '}
        <span className="text-red-600">- Trainers</span>
      </h2>

      {error && <p className="text-red-500 text-center mb-4">{error}</p>}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
        {trainers.map((trainer) => (
          <div key={trainer._id} className="rounded-xl bg-white text-black shadow-lg p-5 transition duration-300 hover:shadow-2xl">
            <div className="relative mb-4">
              <img
                src={trainer.profileImage || "/placeholder.jpg"}
                alt={trainer.fullName}
                className="rounded-xl w-full h-56 object-cover"
              />
            </div>
            <h3 className="text-xl font-bold text-gray-900">{trainer.fullName}</h3>
            <p className="text-sm text-gray-700">{trainer.email}</p>
            <p className="text-sm text-gray-700 mb-2">{trainer.phone}</p>
            <p className="text-red-600 text-sm font-semibold mb-4">⭐ {trainer.averageRating} / 5</p>

            <div className="bg-gray-100 rounded-md p-3 text-sm text-gray-800 space-y-3">
              {trainer.reviews.slice(0, 2).map((review, i) => (
                <div key={i} className="border-t border-gray-300 pt-2">
                  <p className="italic">"{review.comments}"</p>
                  <p className="text-xs text-gray-500">
                    {new Date(review.date).toLocaleDateString()} • {review.sessionType}
                  </p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setSelectedTrainer(trainer)}
              className="mt-4 text-sm text-red-600 hover:underline font-medium"
            >
              See more
            </button>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedTrainer && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 px-4">
          <div className="bg-white text-black p-6 rounded-2xl max-w-5xl w-full relative max-h-[90vh] shadow-2xl grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden">
            <button
              onClick={() => setSelectedTrainer(null)}
              className="absolute top-3 right-4 text-red-600 hover:text-black text-2xl font-bold"
            >
              ×
            </button>

            {/* Left: Trainer Info */}
            <div>
              <img
                src={selectedTrainer.profileImage || "/placeholder.jpg"}
                alt={selectedTrainer.fullName}
                className="w-full h-64 object-cover rounded-xl mb-4"
              />
              <h3 className="text-2xl font-bold">{selectedTrainer.fullName}</h3>
              <p className="text-gray-600">{selectedTrainer.email}</p>
              <p className="text-gray-600">{selectedTrainer.phone}</p>
              <p className="text-red-600 font-semibold mt-2">⭐ {selectedTrainer.averageRating} / 5</p>

              <div className="mt-6">
                <h4 className="text-lg font-bold mb-2">Class Schedule</h4>
                <p>Weekday Slots: <span className="text-gray-700">{selectedTrainer.preferredTrainingHours || 'N/A'}</span></p>
              </div>
            </div>

            {/* Right: Scrollable Panel */}
            <div className="space-y-4 overflow-y-auto max-h-[80vh] pr-2">
              {/* Biography */}
              <div>
                <h4 className="text-xl font-bold mb-2">Biography</h4>
                <p className="text-gray-800 text-sm">
                  {selectedTrainer.biography || 'No biography available.'}
                </p>
              </div>

              {/* Qualifications */}
              <div>
                <h4 className="text-xl font-bold mb-2">Qualifications</h4>
                <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                  {selectedTrainer.certifications?.length
                    ? selectedTrainer.certifications.map((cert, idx) => <li key={idx}>{cert}</li>)
                    : <li>No certifications listed.</li>}
                </ul>
              </div>

              {/* Skills */}
              <div>
                <h4 className="text-xl font-bold mb-2">Skills</h4>
                {selectedTrainer.skills?.map((skill, idx) => (
                  <div key={idx} className="mb-2">
                    <div className="flex justify-between text-sm">
                      <span>{skill.name}</span>
                      <span>{skill.level}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full">
                      <div
                        className="h-full bg-red-600 rounded-full"
                        style={{ width: `${skill.level}%` }}
                      ></div>
                    </div>
                  </div>
                )) || <p className="text-sm text-gray-600">No skills available.</p>}
              </div>

              {/* Feedbacks */}
              <div>
                <h4 className="text-xl font-bold mb-2">All Feedback</h4>
                <div className="max-h-60 overflow-y-auto pr-2 space-y-4">
                  {selectedTrainer.reviews.length ? (
                    selectedTrainer.reviews.map((review, idx) => (
                      <div key={idx} className="border-b border-gray-300 pb-3">
                        <p className="italic text-sm">"{review.comments}"</p>
                        <p className="text-xs text-gray-500">
                          {new Date(review.date).toLocaleDateString()} • {review.sessionType}
                        </p>
                        <div className="text-red-600 text-sm">
                          {Array.from({ length: 5 }, (_, i) => (
                            <span key={i}>{i < review.rating ? '★' : '☆'}</span>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-600">No reviews yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainerReviewsPage;