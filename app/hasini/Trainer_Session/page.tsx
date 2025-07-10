"use client";
import React, { useState } from "react";
import '@fortawesome/fontawesome-free/css/all.min.css';

export default function AddSession() {
  const [form, setForm] = useState({
    title: "",
    trainer: "",
    date: "",
    startTime: "",
    endTime: "",
    maxParticipants: 10,
    description: "",
    onlineLink: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitted", form);
    // Add API POST request here
  };

  const minDate = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-3xl"
      >
        <h2 className="text-2xl font-bold mb-6">Schedule a New Session</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Session Title */}
          <div>
            <label className="block font-medium mb-1">Session Title</label>
            <input
              type="text"
              name="title"
              placeholder="e.g., HIIT Workout, Yoga Class"
              value={form.title}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>

          {/* Trainer Name */}
          <div>
            <label className="block font-medium mb-1">Trainer Name</label>
            <input
              type="text"
              name="trainer"
              placeholder="Your name"
              value={form.trainer}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>

          {/* Date, Start, End */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-medium mb-1">Date</label>
              <input
                type="date"
                name="date"
                min={minDate}
                value={form.date}
                onChange={handleChange}
                className="w-full border p-2 rounded text-gray-700"
              />
            </div>

            <div className="relative">
              <label className="block font-medium mb-1">Start Time</label>
              <input
                type="time"
                name="startTime"
                value={form.startTime}
                onChange={handleChange}
                className="w-full border p-2 rounded text-gray-700 placeholder-gray-400"
                placeholder="Select start time"
              />
            </div>

            <div className="relative">
              <label className="block font-medium mb-1">End Time</label>
              <input
                type="time"
                name="endTime"
                value={form.endTime}
                onChange={handleChange}
                className="w-full border p-2 rounded text-gray-700 placeholder-gray-400"
                placeholder="Select end time"
              />
            </div>
          </div>

          {/* Zoom Link */}
          <div>
            <label className="block font-medium mb-1">Zoom Link</label>
            <input
              type="text"
              name="onlineLink"
              placeholder="Paste your Zoom/Google Meet link"
              value={form.onlineLink}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>

          {/* Max Participants */}
          <div>
            <label className="block font-medium mb-1">Maximum Participants</label>
            <input
              type="number"
              name="maxParticipants"
              value={form.maxParticipants}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              min={1}
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block font-medium mb-1">Description (Optional)</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="w-full border p-2 rounded h-24"
              placeholder="Add any additional details about the session"
            ></textarea>
          </div>
        </div>

        <div className="mt-6">
          <button
            type="submit"
            className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800"
          >
            Schedule Session
          </button>
        </div>
      </form>
    </div>
  );
}
