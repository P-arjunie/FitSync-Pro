/* eslint-disable react/no-unescaped-entities */
'use client';

import React, { useEffect, useState } from 'react';
import Link from "next/link";
import { Search, Filter, X, Star, User, Award, Clock } from 'lucide-react';
import Navbar from '../../Components/Navbar';
import Footer from '../../Components/Footer_01';

interface Review {
  trainer: string;
  sessionType: string;
  date: string;
  comments: string;
  rating: number;
  createdAt: string;
  memberEmail?: string;
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
  pricingPlan?: string;
  status?: 'pending' | 'approved' | 'suspended';
}


const TrainerReviewsPage = () => {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [filteredTrainers, setFilteredTrainers] = useState<Trainer[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Auth state
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  // Review edit/delete modal state
  const [editReview, setEditReview] = useState<Review | null>(null);
  const [editComments, setEditComments] = useState('');
  const [editRating, setEditRating] = useState(5);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null); // reviewId
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCertification, setSelectedCertification] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [selectedPricingPlan, setSelectedPricingPlan] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('name');


  // On mount, get user email from localStorage (if logged in)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserEmail(localStorage.getItem('userEmail'));
      setUserName(localStorage.getItem('userName'));
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/trainers/getTrainerWithReviews');
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        const data = await res.json();
        // Use profileImage from backend, fallback to placeholder if missing
        // Filter out suspended trainers
        const trainersWithImages = data.data
          .filter((trainer: Trainer) => trainer.status !== 'suspended')
          .map((trainer: Trainer) => ({
            ...trainer,
            profileImage: trainer.profileImage || "/placeholder.jpg"
          }));
        setTrainers(trainersWithImages);
        setFilteredTrainers(trainersWithImages);
      } catch (err: any) {
        console.error("Error fetching trainers:", err);
        setError("Could not load trainer data.");
      }
    };
    fetchData();
  }, []);

  // Get unique certifications, skills, and pricing plans for filter dropdowns
  const allCertifications = [...new Set(trainers.flatMap(trainer => trainer.certifications || []))];
  const allSkills = [...new Set(trainers.flatMap(trainer => trainer.skills?.map(skill => skill.name) || []))];
  const allPricingPlans = [...new Set(trainers.map(trainer => trainer.pricingPlan).filter(Boolean))];

  // Filter and search logic
  useEffect(() => {
    let filtered = [...trainers];

    // Search by name, email, or biography
    if (searchTerm) {
      filtered = filtered.filter(trainer =>
        trainer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trainer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trainer.biography?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by certification
    if (selectedCertification) {
      filtered = filtered.filter(trainer =>
        trainer.certifications?.includes(selectedCertification)
      );
    }

    // Filter by skill
    if (selectedSkill) {
      filtered = filtered.filter(trainer =>
        trainer.skills?.some(skill => skill.name === selectedSkill)
      );
    }

    // Filter by pricing plan
    if (selectedPricingPlan) {
      filtered = filtered.filter(trainer => trainer.pricingPlan === selectedPricingPlan);
    }

    // Filter by minimum rating
    if (minRating > 0) {
      filtered = filtered.filter(trainer =>
        parseFloat(trainer.averageRating) >= minRating
      );
    }

    // Sort trainers
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.fullName.localeCompare(b.fullName);
        case 'rating':
          return parseFloat(b.averageRating) - parseFloat(a.averageRating);
        case 'reviews':
          return b.reviews.length - a.reviews.length;
        default:
          return 0;
      }
    });

    setFilteredTrainers(filtered);
  }, [trainers, searchTerm, selectedCertification, selectedSkill, selectedPricingPlan, minRating, sortBy]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCertification('');
    setSelectedSkill('');
    setSelectedPricingPlan('');
    setMinRating(0);
    setSortBy('name');
  };

  const activeFiltersCount = [searchTerm, selectedCertification, selectedSkill, selectedPricingPlan, minRating > 0].filter(Boolean).length;

  // Delete review handler
  const handleDeleteReview = async (reviewId: string) => {
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
      // Remove review from selectedTrainer and trainers state
      if (selectedTrainer) {
        const updatedReviews = selectedTrainer.reviews.filter(r => (r as any)._id !== reviewId);
        setSelectedTrainer({ ...selectedTrainer, reviews: updatedReviews });
      }
      setTrainers(prev => prev.map(tr =>
        tr.reviews.some(r => (r as any)._id === reviewId)
          ? { ...tr, reviews: tr.reviews.filter(r => (r as any)._id !== reviewId) }
          : tr
      ));
      setActionMessage('Review deleted successfully.');
    } catch (err: any) {
      setActionMessage(err.message || 'Failed to delete review.');
    } finally {
      setDeleteLoading(null);
    }
  };

  // Open edit modal
  const openEditModal = (review: Review & { _id?: string }) => {
    setEditReview(review);
    setEditComments(review.comments);
    setEditRating(review.rating);
    setActionMessage(null);
  };

  // Submit edit
  const handleEditReview = async () => {
    if (!editReview || !(editReview as any)._id) return;
    setEditLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/feedback/updateReview', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId: (editReview as any)._id,
          trainer: editReview.trainer,
          sessionType: editReview.sessionType,
          date: editReview.date,
          comments: editComments,
          rating: editRating,
          memberEmail: editReview.memberEmail
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Update failed');
      // Update review in selectedTrainer and trainers state
      if (selectedTrainer) {
        const updatedReviews = selectedTrainer.reviews.map(r =>
          (r as any)._id === (editReview as any)._id
            ? { ...r, comments: editComments, rating: editRating }
            : r
        );
        setSelectedTrainer({ ...selectedTrainer, reviews: updatedReviews });
      }
      setTrainers(prev => prev.map(tr =>
        tr.reviews.some(r => (r as any)._id === (editReview as any)._id)
          ? { ...tr, reviews: tr.reviews.map(r => (r as any)._id === (editReview as any)._id ? { ...r, comments: editComments, rating: editRating } : r) }
          : tr
      ));
      setActionMessage('Review updated successfully.');
      setEditReview(null);
    } catch (err: any) {
      setActionMessage(err.message || 'Failed to update review.');
    } finally {
      setEditLoading(false);
    }
  };

  // Cancel edit modal
  const closeEditModal = () => {
    setEditReview(null);
    setEditComments('');
    setEditRating(5);
    setActionMessage(null);
  };

  return (
    <>
      <Navbar />
      <div className="bg-black min-h-screen px-6 py-10 font-sans text-white">
        {/* Greeting for logged-in user */}
        {userEmail && (
          <div className="max-w-4xl mx-auto mb-4 flex justify-end">
            <span className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow">
              Hi{userName ? `, ${userName}` : userEmail}!
            </span>
          </div>
        )}
        <h2 className="text-3xl font-bold text-center mb-8 tracking-wide">
          <span className="text-white">FitSyncPro</span>{' '}
          <span className="text-red-600">- Trainers</span>
        </h2>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        {/* Search and Filter Controls */}
        <div className="max-w-4xl mx-auto mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
            placeholder="Search trainers by name, email, or biography..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-red-600 focus:outline-none"
          />
        </div>

        {/* Filter Toggle and Clear */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="bg-red-600 text-white text-xs rounded-full px-2 py-1">
                {activeFiltersCount}
              </span>
            )}
          </button>
          
          <div className="flex items-center gap-4">
            <span className="text-gray-400 text-sm">
              {filteredTrainers.length} of {trainers.length} trainers
            </span>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-red-600 hover:text-red-400 text-sm flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-gray-800 rounded-lg p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Certification Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Award className="inline w-4 h-4 mr-1" />
                Certification
              </label>
              <select
                value={selectedCertification}
                onChange={(e) => setSelectedCertification(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:border-red-600 focus:outline-none"
              >
                <option value="">All Certifications</option>
                {allCertifications.map(cert => (
                  <option key={cert} value={cert}>{cert}</option>
                ))}
              </select>
            </div>

            {/* Skill Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <User className="inline w-4 h-4 mr-1" />
                Skill
              </label>
              <select
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:border-red-600 focus:outline-none"
              >
                <option value="">All Skills</option>
                {allSkills.map(skill => (
                  <option key={skill} value={skill}>{skill}</option>
                ))}
              </select>
            </div>

            {/* Pricing Plan Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                💲 Pricing Plan
              </label>
              <select
                value={selectedPricingPlan}
                onChange={(e) => setSelectedPricingPlan(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:border-red-600 focus:outline-none"
              >
                <option value="">All Pricing Plans</option>
                {allPricingPlans.map(plan => (
                  <option key={plan} value={plan}>{plan}</option>
                ))}
              </select>
            </div>

            {/* Rating Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Star className="inline w-4 h-4 mr-1" />
                Min Rating
              </label>
              <select
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:border-red-600 focus:outline-none"
              >
                <option value={0}>Any Rating</option>
                <option value={1}>1+ Stars</option>
                <option value={2}>2+ Stars</option>
                <option value={3}>3+ Stars</option>
                <option value={4}>4+ Stars</option>
                <option value={5}>5 Stars</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Clock className="inline w-4 h-4 mr-1" />
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:border-red-600 focus:outline-none"
              >
                <option value="name">Name (A-Z)</option>
                <option value="rating">Highest Rating</option>
                <option value="reviews">Most Reviews</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Trainers Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
        {filteredTrainers.map((trainer) => (
          <div key={trainer._id} className="rounded-xl bg-white text-black shadow-lg p-5 transition duration-300 hover:shadow-2xl">
            <div className="relative mb-4">
              <img
                src={trainer.profileImage}
                alt={trainer.fullName}
                className="rounded-xl w-full h-56 object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/placeholder.jpg";
                }}
              />
              <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded-full text-xs">
                {trainer.reviews.length} review{trainer.reviews.length !== 1 ? 's' : ''}
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900">{trainer.fullName}</h3>
            <p className="text-sm text-gray-700">{trainer.email}</p>
            <p className="text-sm text-gray-700 mb-2">{trainer.phone}</p>
            <p className="text-sm text-gray-700 mb-2 font-semibold">💲 Pricing Plan: <span className="text-red-600">{trainer.pricingPlan || 'N/A'}</span></p>
            <p className="text-red-600 text-sm font-semibold mb-2">⭐ {trainer.averageRating} / 5</p>
            
            {/* Skills Preview */}
            {trainer.skills && trainer.skills.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1">Top Skills:</p>
                <div className="flex flex-wrap gap-1">
                  {trainer.skills.slice(0, 3).map((skill, idx) => (
                    <span key={idx} className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                      {skill.name}
                    </span>
                  ))}
                  {trainer.skills.length > 3 && (
                    <span className="text-xs text-gray-500">+{trainer.skills.length - 3} more</span>
                  )}
                </div>
              </div>
            )}

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
            <Link
              href={`/pasindi/trainer-page/${trainer._id}?name=${encodeURIComponent(trainer.fullName)}`}
              className="mt-2 inline-block"
            >
              <button className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 shadow hover:shadow-xl">
                Join Session
              </button>
            </Link>
          </div>
        ))}
      </div>

      {/* No Results Message */}
      {filteredTrainers.length === 0 && trainers.length > 0 && (
        <div className="text-center py-12">
          <div className="bg-gray-800 rounded-lg p-8 max-w-md mx-auto">
            <Search className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No trainers found</h3>
            <p className="text-gray-400 mb-4">
              Try adjusting your search terms or filters to find trainers.
            </p>
            <button
              onClick={clearFilters}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Clear all filters
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {selectedTrainer && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 px-4">
          <div className="bg-white text-black p-6 rounded-2xl max-w-5xl w-full relative max-h-[90vh] shadow-2xl grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden">
            <button
              onClick={() => setSelectedTrainer(null)}
              className="absolute top-3 right-4 text-red-600 hover:text-black text-2xl font-bold z-10"
            >
              ×
            </button>

            {/* Left: Trainer Info */}
            <div>
              <img
                src={selectedTrainer.profileImage}
                alt={selectedTrainer.fullName}
                className="w-full h-64 object-cover rounded-xl mb-4"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/placeholder.jpg";
                }}
              />
              <h3 className="text-2xl font-bold">{selectedTrainer.fullName}</h3>
              <p className="text-gray-600">{selectedTrainer.email}</p>
              <p className="text-gray-600">{selectedTrainer.phone}</p>
              <p className="text-red-600 font-semibold mt-2">⭐ {selectedTrainer.averageRating} / 5</p>
              <p className="text-sm text-gray-500">{selectedTrainer.reviews.length} review{selectedTrainer.reviews.length !== 1 ? 's' : ''}</p>
              <p className="text-sm text-gray-700 font-semibold mt-2">💲 Pricing Plan: <span className="text-red-600">{selectedTrainer.pricingPlan || 'N/A'}</span></p>

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
                      <div key={idx} className="border-b border-gray-300 pb-3 relative">
                        <p className="italic text-sm">"{review.comments}"</p>
                        <p className="text-xs text-gray-500">
                          {new Date(review.date).toLocaleDateString()} • {review.sessionType}
                        </p>
                        <div className="text-red-600 text-sm">
                          {Array.from({ length: 5 }, (_, i) => (
                            <span key={i}>{i < review.rating ? '★' : '☆'}</span>
                          ))}
                        </div>
                        {/* Show edit/delete only if logged in user is the review owner */}
                        {userEmail && userEmail === review.memberEmail && (
                          <div className="absolute top-2 right-2 flex gap-2">
                            <button
                              className="text-blue-600 hover:underline text-xs px-2 py-1 bg-blue-100 rounded"
                              onClick={() => openEditModal(review as any)}
                              disabled={editLoading || deleteLoading === (review as any)._id}
                            >{editLoading && editReview && (editReview as any)._id === (review as any)._id ? 'Saving...' : 'Edit'}</button>
                            <button
                              className="text-red-600 hover:underline text-xs px-2 py-1 bg-red-100 rounded"
                              onClick={() => handleDeleteReview((review as any)._id)}
                              disabled={deleteLoading === (review as any)._id || editLoading}
                            >{deleteLoading === (review as any)._id ? 'Deleting...' : 'Delete'}</button>
                          </div>
                        )}
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
      {/* Edit Review Modal */}
      {editReview && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 px-4">
          <div className="bg-white text-black p-6 rounded-2xl max-w-md w-full relative shadow-2xl">
            <button
              onClick={closeEditModal}
              className="absolute top-3 right-4 text-red-600 hover:text-black text-2xl font-bold z-10"
            >×</button>
            <h3 className="text-xl font-bold mb-4">Edit Your Review</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Comments</label>
              <textarea
                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                rows={3}
                value={editComments}
                onChange={e => setEditComments(e.target.value)}
                disabled={editLoading}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Rating</label>
              <select
                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                value={editRating}
                onChange={e => setEditRating(Number(e.target.value))}
                disabled={editLoading}
              >
                {[5,4,3,2,1].map(val => (
                  <option key={val} value={val}>{val} Star{val > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={closeEditModal}
                className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                disabled={editLoading}
              >Cancel</button>
              <button
                onClick={handleEditReview}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 font-semibold"
                disabled={editLoading}
              >{editLoading ? 'Saving...' : 'Save'}</button>
            </div>
            {actionMessage && <p className="mt-3 text-center text-sm text-red-600">{actionMessage}</p>}
          </div>
        </div>
      )}

      {/* Action message for delete */}
      {actionMessage && !editReview && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {actionMessage}
        </div>
      )}

      </div>
      <Footer />
    </>
  );
};

export default TrainerReviewsPage;