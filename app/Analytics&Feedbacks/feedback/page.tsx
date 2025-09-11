'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '../../Components/Navbar';
import Footer1 from '@/Components/Footer_01';
import Link from 'next/link'; // Import Link for navigation to the login page
import FloatingChatButton from "@/Components/ui/FloatingChatButton";

// Define TypeScript types for the data structures
type Trainer = {
  name: string;
};

type ApiResponse = {
  trainers?: Trainer[];
  message?: string;
};

type ReviewData = {
  memberEmail: string;
  trainer: string;
  sessionType: string;
  date: string;
  comments: string;
  rating: number;
};

const ReviewPage = () => {
  // State for form fields
  const [trainer, setTrainer] = useState<string>('');
  const [trainers, setTrainers] = useState<string[]>([]);
  const [sessionType, setSessionType] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [comments, setComments] = useState<string>('');
  const [rating, setRating] = useState<number>(0);

  // State for UI feedback and authentication
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

  // Effect to check authentication status on component mount
  useEffect(() => {
    const userEmail = localStorage.getItem("userEmail");
    const storedUsername = localStorage.getItem("userName");

    if (userEmail && storedUsername) {
      setIsLoggedIn(true);
      setUsername(storedUsername);
    }
    setIsCheckingAuth(false);
  }, []);

  // Effect to fetch trainer names only if the user is logged in
  useEffect(() => {
    if (isLoggedIn) {
      const fetchTrainers = async () => {
        try {
          const response = await fetch('/api/trainers/getnames');
          const data: ApiResponse = await response.json();
          if (response.ok && data.trainers) {
            setTrainers(data.trainers.map((t) => t.name));
          } else {
            console.error(data.message || 'Failed to fetch trainers');
          }
        } catch (err) {
          console.error('Failed to fetch trainers', err);
        }
      };
      fetchTrainers();
    }
  }, [isLoggedIn]);

  // Handles the form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const memberEmail = localStorage.getItem("userEmail");

    if (!memberEmail) {
      setError('Authentication error. Please log in again.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate > today) {
      setError('The review date cannot be in the future.');
      setLoading(false);
      return;
    }

    try {
      const reviewData: ReviewData = {
        memberEmail,
        trainer,
        sessionType,
        date,
        comments,
        rating
      };

      const response = await fetch('/api/feedback/submitReview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccessMessage(`${username}, your review has been submitted successfully!`);
        setTrainer('');
        setSessionType('');
        setDate('');
        setComments('');
        setRating(0);
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setError(result.message || 'Something went wrong.');
      }
    } catch {
      setError('Failed to submit the review.');
    } finally {
      setLoading(false);
    }
  };

  const starRatingLabels = ["Click to rate your experience", "Poor", "Fair", "Good", "Very Good", "Excellent"];

  if (isCheckingAuth) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gray-200 text-gray-800">
          <p>Loading...</p>
        </div>
        <Footer1 />
      </>
    );
  }

  if (!isLoggedIn) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-200 text-gray-800 p-8 text-center">
          <div className="bg-black bg-opacity-80 p-8 rounded-lg shadow-lg">
            <h2 className="text-3xl font-bold text-red-500 mb-4">Access Denied</h2>
            <p className="text-lg mb-6 text-gray-300">You must be logged in to submit feedback.</p>
            <Link href="/login" className="bg-red-600 text-white py-2 px-6 font-bold hover:bg-red-700 transition duration-200 rounded">
              Go to Login
            </Link>
          </div>
        </div>
        <Footer1 />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <FloatingChatButton />
      <div 
        className="min-h-screen flex flex-col relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #e0e0e0 0%, #d0d0d0 25%, #c0c0c0 50%, #b0b0b0 75%, #a0a0a0 100%)',
          backgroundImage: `
            radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(0,0,0,0.05) 0%, transparent 50%),
            linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.05) 50%, transparent 60%)
          `,
          backgroundSize: '100px 100px, 150px 150px, 200px 200px'
        }}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-red-500 to-transparent opacity-10 transform -skew-x-12 z-0"></div>
        
        <div className="relative z-10 flex-1 p-8 flex flex-col">
          {/* Header */}
          <div className="mb-8 text-center">
            <span className="inline-block bg-red-600 text-white text-sm font-bold py-2 px-4 rounded-sm shadow-md">
              RATE YOUR EXPERIENCE
            </span>
            <h2 className="text-4xl font-bold mt-4 mb-2 text-gray-800">Hello {username}</h2>
            <p className="text-lg text-gray-600">Take Your Feedback To The Next Level</p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-600 bg-opacity-90 border border-green-500 text-white p-4 mb-6 flex items-center rounded-lg shadow-lg max-w-2xl mx-auto">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              {successMessage}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-600 bg-opacity-90 border border-red-500 text-white p-4 mb-6 flex items-center rounded-lg shadow-lg max-w-2xl mx-auto">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              {error}
            </div>
          )}

          <div className="flex-1 flex flex-wrap max-w-7xl mx-auto w-full">
            {/* Form Section */}
            <div className="w-full md:w-1/2 md:pr-6 flex flex-col">
              <div className="bg-black bg-opacity-80 rounded-lg shadow-2xl p-8 backdrop-blur-sm">
                <form onSubmit={handleSubmit} className="space-y-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="trainer" className="block text-gray-200 font-semibold mb-2 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>
                        Trainer
                      </label>
                      <div className="relative">
                        <select id="trainer" value={trainer} onChange={(e) => setTrainer(e.target.value)} className="w-full p-3 bg-gray-700 bg-opacity-80 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-white backdrop-blur-sm" required>
                          <option value="">Select a Trainer</option>
                          {trainers.map((trainerName, index) => (<option key={index} value={trainerName}>{trainerName}</option>))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"><svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg></div>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="sessionType" className="block text-gray-200 font-semibold mb-2 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        Session Type
                      </label>
                      <div className="relative">
                        <select id="sessionType" value={sessionType} onChange={(e) => setSessionType(e.target.value)} className="w-full p-3 bg-gray-700 bg-opacity-80 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-white backdrop-blur-sm" required>
                          <option value="">Select Session Type</option>
                          <option value="Virtual">Virtual</option>
                          <option value="Physical">Physical</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"><svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg></div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="date" className="block text-gray-200 font-semibold mb-2 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>
                        Date
                      </label>
                      <div className="relative">
                        <input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-3 bg-gray-700 bg-opacity-80 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-white backdrop-blur-sm" required/>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="comments" className="block text-gray-200 font-semibold mb-2 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" /></svg>
                        Comments
                      </label>
                      <textarea id="comments" value={comments} onChange={(e) => setComments(e.target.value)} className="w-full p-3 bg-gray-700 bg-opacity-80 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-white h-36 backdrop-blur-sm" placeholder="Tell us about your experience..." required />
                    </div>
                    
                    <div>
                      <label className="block text-gray-200 font-semibold mb-2 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        Rating
                      </label>
                      <div className="flex space-x-2">
                        {[1, 2, 3, 4, 5].map((star) => (<span key={star} onClick={() => setRating(star)} className={`cursor-pointer text-4xl ${star <= rating ? 'text-yellow-400' : 'text-gray-600'} hover:text-yellow-300 transition-colors`}>★</span>))}
                      </div>
                      <p className="text-sm text-gray-400 mt-2">{starRatingLabels[rating]}</p>
                    </div>
                  </div>

                  <button type="submit" className="w-full bg-red-600 text-white py-3 px-6 font-bold hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-200 flex items-center justify-center mt-8 rounded-lg shadow-lg" disabled={loading}>
                    {loading ? (<>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        SUBMITTING...
                      </>) : ('SUBMIT REVIEW')}
                  </button>
                </form>
              </div>
            </div>
            
            {/* Right Side Content */}
            <div className="w-full md:w-1/2 mt-8 md:mt-0 md:pl-6 flex flex-col">
              <div className="flex justify-center md:justify-end mb-8">
                <div className="relative w-64 h-64">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-red-700 rounded-full shadow-2xl"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-white px-6">
                    <div className="text-center">
                      <h3 className="text-2xl font-bold mb-3">FITSYNC PRO</h3>
                      <p className="text-sm leading-relaxed">Your feedback helps us improve our services and deliver the best fitness experience.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[{icon: "M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z", title: "Professional Trainers"}, {icon: "M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z", title: "Modern Equipment"}, {icon: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z", title: "Results Tracking"}].map((item, idx) => (
                  <div key={idx} className="text-center bg-white bg-opacity-20 p-4 rounded-lg shadow-lg backdrop-blur-sm">
                    <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center bg-red-600 rounded-full">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d={item.icon} clipRule="evenodd" /></svg>
                    </div>
                    <p className="font-semibold text-sm text-gray-800">{item.title}</p>
                  </div>
                ))}
              </div>
              
              <div className="bg-black bg-opacity-80 p-6 rounded-lg shadow-2xl backdrop-blur-sm flex-1">
                <h3 className="text-xl font-bold mb-4 text-red-500">Member Testimonials</h3>
                <div className="space-y-4">
                  {[{quote: "The trainers at FitSync Pro have completely transformed my fitness journey. Highly recommended!", author: "Alex M."}, {quote: "I've seen incredible results in just 3 months. The personalized approach makes all the difference.", author: "Jamie K."}].map((testimonial, idx) => (
                    <div key={idx} className="border-l-4 border-red-500 pl-4 bg-gray-800 bg-opacity-50 p-3 rounded-r-lg">
                      <p className="italic text-gray-200">{`"${testimonial.quote}"`}</p>
                      <p className="text-sm text-gray-400 mt-2">- {testimonial.author}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer1 />
    </>
  );
};

export default ReviewPage;