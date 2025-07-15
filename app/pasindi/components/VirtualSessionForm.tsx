"use client"

import React, { useEffect, useState } from "react"

export default function VirtualSessionForm() {
  const [checked, setChecked] = useState(false)
  const [role, setRole] = useState<string | null>(null)
  const [members, setMembers] = useState<any[]>([])
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])

  const [form, setForm] = useState({
    title: "",
    trainer: "",
    date: "",
    startTime: "",
    endTime: "",
    location: "",
    maxParticipants: 10,
    description: "",
    onlineLink: "",
  })

  useEffect(() => {
    const trainerName = localStorage.getItem("userName")
    const userRole = localStorage.getItem("userRole")
    if (trainerName) {
      setForm((prev) => ({ ...prev, trainer: trainerName }))
    }
    if (userRole) {
      setRole(userRole.toLowerCase())
    }
    setChecked(true)
  }, [])

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await fetch("/api/member/profile")
        const data = await res.json()
        console.log("Members fetched:", data) // Debug: log fetched data
        setMembers(data)
      } catch (err) {
        console.error("Failed to fetch members:", err)
      }
    }
    fetchMembers()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleMemberSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.selectedOptions, (option) => option.value)
    setSelectedMembers(selected)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/trainerV-sessionForm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, participants: selectedMembers }),
      })

      const data = await response.json()

      if (response.ok) {
        alert("✅ Virtual session created successfully!")
        setForm({
          title: "",
          trainer: form.trainer,
          date: "",
          startTime: "",
          endTime: "",
          location: "",
          maxParticipants: 10,
          description: "",
          onlineLink: "",
        })
        setSelectedMembers([])
      } else {
        alert(data.error || "❌ Failed to create session")
      }
    } catch (err) {
      console.error("Error:", err)
      alert("❌ Failed to create session")
    }
  }

  const minDate = new Date().toISOString().split("T")[0]
  if (!checked || role !== "trainer") return null

  return (
    <div className="bg-gray-100 p-4 rounded-md">
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 rounded-lg shadow-md p-8 w-full max-w-3xl mx-auto"
      >
        <h2 className="text-2xl font-bold mb-4">Schedule a New Virtual Session</h2>

        {/* DEBUG: Show fetched members count and data */}
        <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded">
          <strong>Members Loaded: {members.length}</strong>
          <pre className="text-xs max-h-40 overflow-auto">{JSON.stringify(members, null, 2)}</pre>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Session Title"
            required
            className="border rounded p-2"
          />
          <input
            type="text"
            name="trainer"
            value={form.trainer}
            readOnly
            className="border rounded p-2 bg-gray-100"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            min={minDate}
            required
            className="border rounded p-2"
          />
          <input
            type="time"
            name="startTime"
            value={form.startTime}
            onChange={handleChange}
            required
            className="border rounded p-2"
          />
          <input
            type="time"
            name="endTime"
            value={form.endTime}
            onChange={handleChange}
            required
            className="border rounded p-2"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input
            type="url"
            name="onlineLink"
            placeholder="Zoom/Google Meet link"
            value={form.onlineLink}
            onChange={handleChange}
            required
            className="border rounded p-2"
          />
          <input
            type="number"
            name="maxParticipants"
            value={form.maxParticipants}
            onChange={handleChange}
            min={1}
            required
            className="border rounded p-2"
          />
        </div>

        {/* Member selection */}
        <div className="mb-6">
          <label className="block font-medium mb-2">Select Participants</label>
          <select
            key={members.length} // Force re-render on members change
            multiple
            value={selectedMembers}
            onChange={handleMemberSelect}
            className="w-full h-40 border-4 border-blue-500 rounded p-2 bg-white"
          >
            {members.map((member: any) => (
              <option key={member._id} value={member._id}>
                {member.firstName} {member.lastName} ({member.email})
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-500 mt-1">Hold Ctrl (Windows) or Command (Mac) to select multiple.</p>
        </div>

        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Description (optional)"
          className="w-full border rounded p-2 h-24 mb-6"
        />

        <button type="submit" className="w-full bg-red-600 text-white py-3 rounded hover:bg-red-700">
          Schedule Virtual Session
        </button>
      </form>
    </div>
  )
}
