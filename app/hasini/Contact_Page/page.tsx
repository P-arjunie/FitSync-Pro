"use client";

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Navbar from "@/Components/Navbar";
import Footer1 from '@/Components/Footer_01';
import Image from 'next/image';

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

  // Settings state
  const [contactInfo, setContactInfo] = useState({ address: '', phone: '', email: '' });
  const [social, setSocial] = useState({ facebook: '', instagram: '', linkedin: '', whatsapp: '' });
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [workingHours, setWorkingHours] = useState({ weekdays: '', saturday: '', sunday: '' });
  useEffect(() => {
    const fetchSettings = async () => {
      setSettingsLoading(true);
      try {
        const res = await fetch('/api/settings');
        if (!res.ok) throw new Error('Failed to fetch settings');
        const data = await res.json();
        setContactInfo(data.contact || { address: '', phone: '', email: '' });
        setSocial(data.social || { facebook: '', instagram: '', linkedin: '', whatsapp: '' });
        setWorkingHours(data.workingHours || { weekdays: '', saturday: '', sunday: '' });
      } catch (err) {
        setContactInfo({ address: '', phone: '', email: '' });
        setSocial({ facebook: '', instagram: '', linkedin: '', whatsapp: '' });
        setWorkingHours({ weekdays: '', saturday: '', sunday: '' });
      } finally {
        setSettingsLoading(false);
      }
    };
    fetchSettings();
  }, []);

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
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 px-4 py-8 md:px-8 lg:px-16 items-start">
          {/* Left Section - Company Information */}
          <div className="bg-white shadow-lg rounded-lg p-12 md:p-16 flex flex-col justify-between min-h-[650px]" style={{ minWidth: '420px', justifyContent: 'flex-start', paddingTop: '2.5rem', paddingBottom: '2.5rem' }}>
            <h1 className="text-3xl font-bold mb-5 text-black" style={{ marginBottom: 0, lineHeight: 1.2 }}>
              We are here to help you! 
            </h1>
            <hr className="my-4 border-t border-gray-200 w-full" />
            <p className="text-gray-700 mb-8 leading-relaxed text-justify">
              At FitSync Pro, we're committed to helping you achieve your fitness goals. 
              Whether you have questions about our programs, need guidance, or want to get started, 
              we're here to support your fitness journey every step of the way.
            </p>
            <div style={{ height: '0.1rem' }} />

            {settingsLoading ? (
              <div className="text-gray-500">Loading contact info...</div>
            ) : (
              <>
                {/* 2x2 Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
                  {/* Phone Number */}
                  <div className="flex flex-col items-center border border-gray-200 rounded-lg p-6 bg-gray-50">
                    <span className="mb-3">
                      <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M22 16.92V19a2 2 0 0 1-2.18 2A19.72 19.72 0 0 1 3 5.18 2 2 0 0 1 5 3h2.09a2 2 0 0 1 2 1.72c.13.81.36 1.6.68 2.34a2 2 0 0 1-.45 2.11l-.27.27a16 16 0 0 0 6.29 6.29l.27-.27a2 2 0 0 1 2.11-.45c.74.32 1.53.55 2.34.68A2 2 0 0 1 21 16.91z" /></svg>
                    </span>
                    <h2 className="text-lg font-semibold mb-1 text-black">Phone Number</h2>
                    <p className="text-gray-700 text-center">
                      <a href={`tel:${contactInfo.phone}`}>{contactInfo.phone || "+94 71 2781 444"}</a>
                    </p>
                  </div>
                  {/* Follow Us */}
                  <div className="flex flex-col items-center border border-gray-200 rounded-lg p-6 bg-gray-50">
                    <span className="mb-3">
                      {/* Share/Network icon for Follow Us */}
                      <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                    </span>
                    <h2 className="text-lg font-semibold mb-3 text-black">Follow Us</h2>
                    <div className="flex items-center space-x-4">
                      <a href={social.linkedin || "https://www.linkedin.com"} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                        <img src="/linkedin.png" alt="LinkedIn" className="w-8 h-8" style={{ filter: 'none' }} />
                      </a>
                      <a href={social.whatsapp || "https://wa.me/+94712781444"} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                        <img src="/whatsapp.png" alt="WhatsApp" className="w-8 h-8" style={{ filter: 'none' }} />
                      </a>
                      <a href={social.facebook || "https://www.facebook.com"} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                        <img src="/facebook.png" alt="Facebook" className="w-8 h-8" style={{ filter: 'none' }} />
                      </a>
                      <a href={social.instagram || "https://www.instagram.com"} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                        <img src="/insta.png" alt="Instagram" className="w-8 h-8" style={{ filter: 'none' }} />
                      </a>
                    </div>
                  </div>
                  {/* Working Hours */}
                  <div className="flex flex-col items-center border border-gray-200 rounded-lg p-6 bg-gray-50">
                    <span className="mb-3">
                      <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" /></svg>
                    </span>
                    <h2 className="text-lg font-semibold mb-1 text-black">Opening Hours</h2>
                    <div className="text-gray-700 text-center">
                      <div>Monday to Friday</div>
                      <div className="pl-2">{workingHours.weekdays || "7:30 AM-1:00 AM"}</div>
                      <div className="mt-2">Saturday</div>
                      <div className="pl-2">{workingHours.saturday || "8:00 AM-11:00 PM"}</div>
                      <div className="mt-2">Sunday</div>
                      <div className="pl-2">{workingHours.sunday || "8:00 AM-11:00 PM"}</div>
                    </div>
                  </div>
                  {/* Location */}
                  <div className="flex flex-col items-center border border-gray-200 rounded-lg p-6 bg-gray-50">
                    <span className="mb-3">
                      {/* Map Pin icon for Location */}
                      <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21C12 21 7 16.5 7 12A5 5 0 0 1 17 12C17 16.5 12 21 12 21Z" /><circle cx="12" cy="12" r="2.5" /></svg>
                    </span>
                    <h2 className="text-lg font-semibold mb-1 text-black">Location</h2>
                    <p className="text-gray-700 text-center">{contactInfo.address || "4/1, Sapumal Place, Colombo, Sri Lanka"}</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right Section - Contact Form (now styled to match left) */}
          <div className="bg-white shadow-lg rounded-lg p-10 md:p-12 flex flex-col justify-between min-h-[650px]" style={{ minWidth: '340px', justifyContent: 'flex-start', paddingTop: '2.5rem', paddingBottom: '2.5rem' }}>
            <div className="flex items-center mb-0">
              <svg className="w-8 h-8 text-red-600 mr-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 0 0 2.22 0L21 8" /><rect x="2" y="6" width="20" height="12" rx="2" ry="2" /></svg>
              <h2 className="text-2xl font-bold text-black" style={{ marginBottom: 0, lineHeight: 1.2 }}>
                Leave Us Your Info
              </h2>
            </div>
            <hr className="my-4 border-t border-gray-200 w-full" />

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
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
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
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  RESET
                </button>
              </div>
            </form>

            
          </div>
        </div>
        
        <Footer1 />
      </div>
    </>
  );
}