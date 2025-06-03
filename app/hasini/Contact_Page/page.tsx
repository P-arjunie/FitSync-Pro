"use client";

import React, { useState } from 'react';
import Head from 'next/head';
import Navbar from "@/Components/Navbar";
import Footer1 from '@/Components/Footer_01';

export default function Contact() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  // 🆕 Added error state to show validation feedback
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(''); // 🆕 Clear previous errors when user starts typing
  };

  // 🆕 Helper function to validate email format
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 🆕 Client-side validation
    if (!form.name || !form.email || !form.subject) {
      setError('Please fill out all required fields.');
      return;
    }

    if (!isValidEmail(form.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (data.success) {
        alert('Message sent successfully!');
        setForm({ name: '', email: '', subject: '', message: '' });
      } else {
        alert(`Something went wrong! Error: ${data.error}`);
      }
    } catch (error) {
      console.error(error);
      alert('Error sending message.');
    }
  };

  return (
    <>
      <div
        className="bg-gray-100 min-h-screen w-full"
        style={{
          backgroundImage: 'url("https://img.freepik.com/free-photo/black-white-marble-textured-background_53876-100058.jpg?t=st=1739687985~exp=1739691585~hmac=4dc8f93362a1179a310d146af89d4a714f933bc781857e6bc4ae6f53f19f3bda&w=996")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <Navbar />
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 px-4 py-8 md:px-8 lg:px-16">
          
          {/* Left Section */}
          <div className="bg-white shadow-md rounded-lg p-8 md:p-10">
            <h1 className="text-3xl font-bold mb-5 text-black">
              We are here for help you! To Shape Your Body.
            </h1>
            <p className="text-black mb-8">
              When an unknown printer took a galley of type and scrambled it to make a type specimen book.
              It has survived not only five centuries, but also the leap into electronic typesetting.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-xl font-bold mb-3 text-black underline-custom">Colombo</h2>
                <p className="text-black">4/1, Sapumal Place, Colombo.</p>
              </div>
              <div>
                <h2 className="text-xl font-bold mb-3 text-black underline-custom">Opening Hours</h2>
                <p className="text-black">Mon to Fri: 7:30 am — 1:00 am</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <h2 className="text-xl font-bold mb-3 text-black underline-custom">Information</h2>
                <p className="text-black">+9471 2781 444</p>
                <p className="text-black">fitsyncpro@gmail.com</p>
              </div>
              <div>
                <h2 className="text-xl font-bold mb-3 text-black underline-custom">Follow Us On</h2>
                <div className="flex space-x-3">
                  <a href="#" className="text-black"><i className="fab fa-facebook fa-lg"></i></a>
                  <a href="#" className="text-black"><i className="fab fa-twitter fa-lg"></i></a>
                  <a href="#" className="text-black"><i className="fab fa-instagram fa-lg"></i></a>
                  <a href="#" className="text-black"><i className="fab fa-pinterest fa-lg"></i></a>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section - Contact Form */}
          <div className="bg-gray-50 shadow-md rounded-lg p-8 md:p-10">
            <h2 className="text-xl font-bold mb-5 text-black underline-custom">Leave Us Your Info</h2>

            {/* 🆕 Show validation error */}
            {error && <p className="text-red-600 mb-4">{error}</p>}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block font-medium mb-1 text-black">
                  Full Name<span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                  value={form.name}
                  onChange={handleChange}
                />
              </div>
              <div className="mb-4">
                <label className="block font-medium mb-1 text-black">
                  E-mail Address<span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                  value={form.email}
                  onChange={handleChange}
                />
              </div>
              <div className="mb-4">
                <label className="block font-medium mb-1 text-black">
                  Subject<span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="subject"
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                  value={form.subject}
                  onChange={handleChange}
                />
              </div>
              <div className="mb-4">
                <label className="block font-medium mb-1 text-black">Comment</label>
                <textarea
                  name="message"
                  className="w-full p-2 border border-gray-300 rounded"
                  value={form.message}
                  onChange={handleChange}
                ></textarea>
              </div>
              <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded">
                SUBMIT NOW
              </button>
            </form>
          </div>
        </div>
        <Footer1 />
      </div>
    </>
  );
}
