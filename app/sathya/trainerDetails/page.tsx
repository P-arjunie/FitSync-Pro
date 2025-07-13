'use client';

import React, { useEffect, useState } from 'react';
import { Search, Filter, X, Star, User, Award, Clock } from 'lucide-react';

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
  const [filteredTrainers, setFilteredTrainers] = useState<Trainer[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCertification, setSelectedCertification] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('name');

  // Hardcoded profile images
  const profileImages = [
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    'https://images.unsplash.com/photo-1552058544-f2b08422138a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    'https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/trainers/getTrainerWithReviews');
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        const data = await res.json();
        
        // Add hardcoded images to trainers
        const trainersWithImages = data.data.map((trainer: Trainer, index: number) => ({
          ...trainer,
          profileImage: profileImages[index % profileImages.length] || "/placeholder.jpg"
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

  // Get unique certifications and skills for filter dropdowns
  const allCertifications = [...new Set(trainers.flatMap(trainer => trainer.certifications || []))];
  const allSkills = [...new Set(trainers.flatMap(trainer => trainer.skills?.map(skill => skill.name) || []))];

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
  }, [trainers, searchTerm, selectedCertification, selectedSkill, minRating, sortBy]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCertification('');
    setSelectedSkill('');
    setMinRating(0);
    setSortBy('name');
  };

  const activeFiltersCount = [searchTerm, selectedCertification, selectedSkill, minRating > 0].filter(Boolean).length;

  return (
    <div className="bg-black min-h-screen px-6 py-10 font-sans text-white">
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
          <div className="bg-gray-800 rounded-lg p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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