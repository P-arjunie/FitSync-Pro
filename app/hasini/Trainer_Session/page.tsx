"use client";
import React, { useState } from "react";
import '@fortawesome/fontawesome-free/css/all.min.css';

// Main AddSession component
export default function AddSession() {
  // useState to handle form input values
  const [form, setForm] = useState({
    trainer: "",
    sessionType: "",
    duration: "",
    date: "",
    comments: "",
    onlineLink: "",
  });

  // Update form state when user types into input/textarea
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form refresh

    try {
      // Send form data to API endpoint
      const res = await fetch("/api/trainerV-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json(); // Parse response
      console.log("Server response:", data);

      alert("Session created!"); // Notify user
    } catch (err) {
      console.error("Error submitting form:", err);
      alert("Something went wrong!"); // Error notification
    }
  };

  return (
    // Page layout and background styling
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="relative bg-black text-white bg-opacity-80 p-8 rounded-lg w-full max-w-md shadow-xl"
        style={{
          backgroundImage: `url('/trainer session.jpg')`, // Background image
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Form container with semi-transparent background */}
        <div className="bg-black bg-opacity-70 p-6 rounded-lg">
          <h2 className="text-3xl font-bold text-center mb-6">ADD SESSION</h2>

          {/* Trainer input */}
          <label className="block mb-2">Trainer:</label>
          <input
            type="text"
            name="trainer"
            value={form.trainer}
            onChange={handleChange}
            className="w-full p-2 mb-4 rounded text-black"
          />

          {/* Session Type input */}
          <label className="block mb-2">Session Type:</label>
          <input
            type="text"
            name="sessionType"
            value={form.sessionType}
            onChange={handleChange}
            className="w-full p-2 mb-4 rounded text-black"
          />

          {/* Duration input */}
          <label className="block mb-2">Time Duration:</label>
          <input
            type="text"
            name="duration"
            value={form.duration}
            onChange={handleChange}
            className="w-full p-2 mb-4 rounded text-black"
          />

          {/* Date input */}
          <label className="block mb-2">Date:</label>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            className="w-full p-2 mb-4 rounded text-black"
          />

          {/* Comments input */}
          <label className="block mb-2">Comments:</label>
          <textarea
            name="comments"
            value={form.comments}
            onChange={handleChange}
            className="w-full p-2 mb-4 rounded text-black"
          ></textarea>

          {/* Online session link input */}
          <label className="block mb-2">Online Session:</label>
          <input
            type="text"
            name="onlineLink"
            placeholder="Add Zoom/Google Meet link"
            value={form.onlineLink}
            onChange={handleChange}
            className="w-full p-2 mb-6 rounded text-black"
          />

          {/* Form buttons: CREATE, UPDATE, DELETE (only CREATE is functional now) */}
          <div className="flex justify-between">
            <button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded"
            >
              CREATE
            </button>
            <button
              type="button"
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold px-4 py-2 rounded"
            >
              UPDATE
            </button>
            <button
              type="button"
              className="bg-gray-400 hover:bg-gray-500 text-white font-bold px-4 py-2 rounded"
            >
              DELETE
            </button>
          </div>
        </div>
      </form>

      {/* Floating headset support button */}
      <div className="fixed bottom-4 right-4">
        <button className="bg-red-500 p-3 rounded-full shadow-lg hover:bg-red-600">
          <i className="fas fa-headset text-white text-xl"></i>
        </button>
      </div>
    </div>
  );
}
