"use client";

import React, { useState } from 'react';
import Head from 'next/head';
import Navbar from "@/Components/Navbar";
import Footer1 from '@/Components/Footer_01';

// Interface for form data
interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// Interface for API response
interface ApiResponse {
  success: boolean;
  error?: string;
  message?: string;
  details?: string;
}

export default function Contact() {
  // Form state
  const [form, setForm] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  // UI state
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    // Clear messages when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
  };

  // Email validation helper
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Form validation
  const validateForm = (): boolean => {
    // Check required fields
    if (!form.name.trim()) {
      setError('Please enter your full name.');
      return false;
    }

    if (!form.email.trim()) {
      setError('Please enter your email address.');
      return false;
    }

    if (!form.subject.trim()) {
      setError('Please enter a subject.');
      return false;
    }

    // Validate email format
    if (!isValidEmail(form.email)) {
      setError('Please enter a valid email address.');
      return false;
    }

    // Check minimum lengths
    if (form.name.trim().length < 2) {
      setError('Name must be at least 2 characters long.');
      return false;
    }

    if (form.subject.trim().length < 3) {
      setError('Subject must be at least 3 characters long.');
      return false;
    }

    // Check maximum lengths
    if (form.name.length > 100) {
      setError('Name must be less than 100 characters.');
      return false;
    }

    if (form.subject.length > 200) {
      setError('Subject must be less than 200 characters.');
      return false;
    }

    if (form.message.length > 1000) {
      setError('Message must be less than 1000 characters.');
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Clear previous messages
    setError('');
    setSuccess('');

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      console.log('🚀 Submitting form:', {
        name: form.name,
        email: form.email,
        subject: form.subject,
        hasMessage: !!form.message
      });

      const response = await fetch('/api/Contact', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          subject: form.subject.trim(),
          message: form.message.trim()
        }),
      });

      console.log('📡 Response status:', response.status);
      
      const data: ApiResponse = await response.json();
      console.log('📨 Response data:', data);

      if (data.success) {
        setSuccess(data.message || 'Message sent successfully!');
        setForm({ name: '', email: '', subject: '', message: '' });
        
        // Scroll to success message
        setTimeout(() => {
          const successElement = document.getElementById('success-message');
          if (successElement) {
            successElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      } else {
        setError(data.error || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('❌ Network error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setForm({ name: '', email: '', subject: '', message: '' });
    setError('');
    setSuccess('');
  };

  return (
    <>
      <Head>
        <title>Contact Us - FitSync Pro</title>
        <meta name="description" content="Get in touch with FitSync Pro. We're here to help you shape your body and achieve your fitness goals." />
        <meta name="keywords" content="contact, fitness, gym, FitSync Pro, support" />
        <link rel="canonical" href="/contact" />
      </Head>

      <div
        className="bg-gray-100 min-h-screen w-full"
        style={{
          backgroundImage: 'url("https://img.freepik.com/free-photo/black-white-marble-textured-background_53876-100058.jpg?t=st=1739687985~exp=1739691585~hmac=4dc8f93362a1179a310d146af89d4a714f933bc781857e6bc4ae6f53f19f3bda&w=996")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        <Navbar />
        
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 px-4 py-8 md:px-8 lg:px-16">
          
          {/* Left Section - Company Information */}
          <div className="bg-white shadow-lg rounded-lg p-8 md:p-10 transform hover:scale-105 transition-transform duration-300">
            <h1 className="text-3xl font-bold mb-5 text-black">
              We are here to help you! To Shape Your Body.
            </h1>
            <p className="text-gray-700 mb-8 leading-relaxed">
              At FitSync Pro, we're committed to helping you achieve your fitness goals. 
              Whether you have questions about our programs, need guidance, or want to get started, 
              we're here to support your fitness journey every step of the way.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="group">
                <h2 className="text-xl font-bold mb-3 text-black flex items-center">
                  <span className="inline-block w-8 h-8 bg-gray-600 text-white rounded-full text-center leading-8 mr-3 text-sm">📍</span>
                  Location
                </h2>
                <p className="text-gray-700 ml-11">4/1, Sapumal Place, Colombo, Sri Lanka</p>
              </div>
              
              <div className="group">
                <h2 className="text-xl font-bold mb-3 text-black flex items-center">
                  <span className="inline-block w-8 h-8 bg-gray-600 text-white rounded-full text-center leading-8 mr-3 text-sm">🕒</span>
                  Opening Hours
                </h2>
                <p className="text-gray-700 ml-11">
                  Mon to Fri: 7:30 AM — 1:00 AM<br />
                  Sat to Sun: 8:00 AM — 11:00 PM
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="group">
                <h2 className="text-xl font-bold mb-3 text-black flex items-center">
                  <span className="inline-block w-8 h-8 bg-gray-600 text-white rounded-full text-center leading-8 mr-3 text-sm">📞</span>
                  Contact Info
                </h2>
                <div className="ml-11 space-y-2">
                  <p className="text-gray-700">
                    <a href="tel:+94712781444" className="hover:text-red-600 transition-colors">
                      +94 71 2781 444
                    </a>
                  </p>
                  <p className="text-gray-700">
                    <a href="mailto:fitsyncpro@gmail.com" className="hover:text-red-600 transition-colors">
                      fitsyncpro@gmail.com
                    </a>
                  </p>
                </div>
              </div>
              
              <div className="group">
                <h2 className="text-xl font-bold mb-3 text-black flex items-center">
                  <span className="inline-block w-8 h-8 bg-gray-600 text-white rounded-full text-center leading-8 mr-3 text-sm">🌐</span>
                  Follow Us
                </h2>
                <div className="flex space-x-4 ml-11">
                  <a 
                    href="#" 
                    className="text-gray-600 hover:text-blue-600 transition-colors transform hover:scale-110"
                    aria-label="Facebook"
                  >
                    <i className="fab fa-facebook fa-lg"></i>
                  </a>
                  <a 
                    href="#" 
                    className="text-gray-600 hover:text-blue-400 transition-colors transform hover:scale-110"
                    aria-label="Twitter"
                  >
                    <i className="fab fa-twitter fa-lg"></i>
                  </a>
                  <a 
                    href="#" 
                    className="text-gray-600 hover:text-pink-600 transition-colors transform hover:scale-110"
                    aria-label="Instagram"
                  >
                    <i className="fab fa-instagram fa-lg"></i>
                  </a>
                  <a 
                    href="#" 
                    className="text-gray-600 hover:text-red-600 transition-colors transform hover:scale-110"
                    aria-label="Pinterest"
                  >
                    <i className="fab fa-pinterest fa-lg"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section - Contact Form */}
          <div className="bg-white shadow-lg rounded-lg p-8 md:p-10">
            <h2 className="text-2xl font-bold mb-5 text-black flex items-center">
              <span className="inline-block w-8 h-8 bg-red-600 text-white rounded-full text-center leading-8 mr-3 text-sm">✉️</span>
              Leave Us Your Info
            </h2>

            {/* Success Message */}
            {success && (
              <div 
                id="success-message"
                className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6 flex items-center"
              >
                <span className="text-green-500 mr-2">✓</span>
                {success}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6 flex items-center">
                <span className="text-red-500 mr-2">⚠</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-4">
                <label htmlFor="name" className="block font-medium mb-2 text-black">
                  Full Name <span className="text-red-600">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                  placeholder="Enter your full name"
                  required
                  maxLength={100}
                  value={form.name}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                <small className="text-gray-500 text-xs mt-1 block">
                  {form.name.length}/100 characters
                </small>
              </div>

              <div className="mb-4">
                <label htmlFor="email" className="block font-medium mb-2 text-black">
                  Email Address <span className="text-red-600">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                  placeholder="Enter your email address"
                  required
                  value={form.email}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>

              <div className="mb-4">
                <label htmlFor="subject" className="block font-medium mb-2 text-black">
                  Subject <span className="text-red-600">*</span>
                </label>
                <input
                  id="subject"
                  type="text"
                  name="subject"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                  placeholder="What's this about?"
                  required
                  maxLength={200}
                  value={form.subject}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                <small className="text-gray-500 text-xs mt-1 block">
                  {form.subject.length}/200 characters
                </small>
              </div>

              <div className="mb-6">
                <label htmlFor="message" className="block font-medium mb-2 text-black">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors resize-vertical"
                  placeholder="Tell us more about your inquiry..."
                  maxLength={1000}
                  value={form.message}
                  onChange={handleChange}
                  disabled={isLoading}
                ></textarea>
                <small className="text-gray-500 text-xs mt-1 block">
                  {form.message.length}/1000 characters
                </small>
              </div>

              <div className="flex gap-3">
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      SENDING...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">📧</span>
                      SEND MESSAGE
                    </>
                  )}
                </button>

                <button 
                  type="button" 
                  onClick={resetForm}
                  disabled={isLoading}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  RESET
                </button>
              </div>
            </form>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 text-center">
                <span className="font-semibold">Response Time:</span> We typically respond within 24 hours. 
                For urgent inquiries, please call us directly.
              </p>
            </div>
          </div>
        </div>
        
        <Footer1 />
      </div>
    </>
  );
}