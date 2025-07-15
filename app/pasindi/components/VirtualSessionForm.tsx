"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import "@fortawesome/fontawesome-free/css/all.min.css"

export default function AddSession() {
  const router = useRouter()

  const [checked, setChecked] = useState(false)
  const [role, setRole] = useState<string | null>(null)

  const [members, setMembers] = useState<any[]>([])
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")

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
    if (checked && role !== "trainer") {
      router.replace("/")
    }
  }, [checked, role, router])

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await fetch("/api/member/profile")
        const data = await res.json()
        setMembers(data)
      } catch (error) {
        console.error("Failed to load members", error)
      }
    }
    fetchMembers()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleCheckboxChange = (id: string) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((mid) => mid !== id) : [...prev, id]
    )
  }

  const filteredMembers = members.filter(
    (m: any) =>
      m.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // ✅ Include full participant info: id, name, email
    const fullSelectedMembers = selectedMembers.map((id) => {
      const member = members.find((m) => m._id === id)
      return {
        id,
        firstName: member?.firstName || "",
        lastName: member?.lastName || "",
        email: member?.email || "",
      }
    })

    try {
      const response = await fetch("/api/trainerV-sessionForm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...form, participants: fullSelectedMembers }),
      })

      const data = await response.json()

      if (response.ok) {
        alert("Virtual session created successfully!")
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
        setSearchTerm("")
      } else {
        alert(data.error || "Failed to create session")
      }
    } catch (error) {
      console.error("Error creating session:", error)
      alert("Failed to create session")
    }
  }

  const minDate = new Date().toISOString().split("T")[0]

  if (!checked) return null

  if (role !== "trainer") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center text-red-600 bg-red-50 border border-red-200 rounded-lg p-8">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Access Denied</h2>
          <p className="text-red-600">Only trainers can access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 rounded-lg shadow-md p-8 w-full max-w-3xl"
      >
        <div className="mb-6 border-b pb-4">
          <h2 className="text-2xl font-bold text-black mb-1">Schedule a New Virtual Session</h2>
          <p className="text-gray-600">Fill out the details below to create a new virtual training session</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block font-medium text-black mb-1">Session Title</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g., HIIT Workout, Yoga Class"
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block font-medium text-black mb-1">Trainer Name</label>
            <input
              type="text"
              name="trainer"
              value={form.trainer}
              readOnly
              className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block font-medium text-black mb-1">Date</label>
            <div className="relative">
              <input
                type="date"
                name="date"
                value={form.date}
                min={minDate}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 pr-10"
                required
              />
              <i className="fa fa-calendar-alt absolute right-3 top-3 text-gray-400"></i>
            </div>
          </div>

          <div>
            <label className="block font-medium text-black mb-1">Start Time</label>
            <input
              type="time"
              name="startTime"
              value={form.startTime}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block font-medium text-black mb-1">End Time</label>
            <input
              type="time"
              name="endTime"
              value={form.endTime}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block font-medium mb-1">Online Session Link</label>
            <input
              type="url"
              name="onlineLink"
              placeholder="https://zoom.us/j/... or https://meet.google.com/..."
              value={form.onlineLink}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              required
            />
          </div>

          <div>
            <label className="block font-medium text-black mb-1">Maximum Participants</label>
            <input
              type="number"
              name="maxParticipants"
              value={form.maxParticipants}
              onChange={handleChange}
              min={1}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block font-medium text-black mb-2">Search Members</label>
          <input
            type="text"
            placeholder="Search by name or email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 mb-2"
          />

          <div className="max-h-40 overflow-y-auto border border-gray-200 rounded p-2">
            {filteredMembers.map((member) => (
              <label key={member._id} className="block mb-1 cursor-pointer">
                <input
                  type="checkbox"
                  value={member._id}
                  checked={selectedMembers.includes(member._id)}
                  onChange={() => handleCheckboxChange(member._id)}
                  className="mr-2"
                />
                {member.firstName} {member.lastName} ({member.email})
              </label>
            ))}
            {filteredMembers.length === 0 && (
              <p className="text-gray-500 text-sm">No matching members found.</p>
            )}
          </div>
        </div>

        {selectedMembers.length > 0 && (
          <div className="mb-6 text-sm text-gray-700">
            <strong>Selected Members:</strong>
            <ul className="list-disc list-inside">
              {selectedMembers.map((id) => {
                const member = members.find((m) => m._id === id)
                return (
                  <li key={id}>
                    {member?.firstName} {member?.lastName} ({member?.email})
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        <div className="mb-6">
          <label className="block font-medium text-black mb-1">Description (Optional)</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 h-24"
            placeholder="Add any additional details about the session"
          ></textarea>
        </div>

        <button
          type="submit"
          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded"
        >
          Schedule Virtual Session
        </button>
      </form>
    </div>
  )
}
