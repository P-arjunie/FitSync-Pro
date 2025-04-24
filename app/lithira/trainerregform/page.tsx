"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaCamera } from "react-icons/fa";

interface Skill {
  name: string;
  level: number;
}

interface TrainerFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string;
  gender: string;
  address: string;
  specialization: string;
  certifications: string[];
  preferredTrainingHours: string;
  yearsOfExperience: string;
  availability: string;
  pricingPlan: string;
  emergencyName: string;
  emergencyPhone: string;
  relationship: string;
  startDate: string;
  termsAccepted: boolean;
  biography: string;
  skills: Skill[];
}

export default function TrainerRegistrationForm() {
  const router = useRouter();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [newSkill, setNewSkill] = useState<Skill>({ name: "", level: 1 });
  const [formData, setFormData] = useState<TrainerFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dob: "",
    gender: "",
    address: "",
    specialization: "",
    certifications: [""],
    preferredTrainingHours: "",
    yearsOfExperience: "",
    availability: "",
    pricingPlan: "",
    emergencyName: "",
    emergencyPhone: "",
    relationship: "",
    startDate: "",
    termsAccepted: false,
    biography: "",
    skills: [],
  });

  useEffect(() => {
    const storedImage = localStorage.getItem("trainerProfileImage");
    if (storedImage) setProfileImage(storedImage);
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const target = e.target;
    const { name, type, value } = target;

    const newValue =
      type === "checkbox" && target instanceof HTMLInputElement
        ? target.checked
        : value;

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handleAddSkill = () => {
    if (newSkill.name.trim()) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, newSkill],
      }));
      setNewSkill({ name: "", level: 1 });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.termsAccepted) {
      alert("Please accept the terms and conditions.");
      return;
    }

    const payload = {
      ...formData,
      profileImage,
      status: "pending",
      submittedAt: new Date(),
    };

    try {
      const res = await fetch("/api/pending-trainers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert("Trainer registration submitted for approval.");
        router.push("/thank-you");
      } else {
        const err = await res.json();
        alert("Submission failed: " + err.message);
      }
    } catch (err) {
      console.error("Submission error:", err);
      alert("Something went wrong. Please try again later.");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-gray-200 to-gray-300">
      <form
        onSubmit={handleSubmit}
        className="w-[800px] bg-gray-100 p-6 rounded-lg shadow-xl relative"
      >
        {/* Profile Image Upload */}
        <div className="absolute top-6 right-6 border-4 border-red-500 rounded-full w-16 h-16 overflow-hidden cursor-pointer">
          <label className="cursor-pointer">
            {profileImage ? (
              <img
                src={profileImage}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <FaCamera className="text-3xl text-gray-800 mx-auto mt-3" />
            )}
            <input type="file" className="hidden" accept="image/*" disabled />
          </label>
        </div>

        <h2 className="text-3xl font-bold text-center mb-2">
          Registration Form - Trainer
        </h2>
        <p className="text-center text-sm mb-6">
          Join Our Team & Inspire Fitness!
        </p>

        {/* Personal Info */}
        <fieldset className="mb-6">
          <legend className="text-lg font-bold border-b-4 border-red-500 mb-4">
            Personal Information
          </legend>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "First Name", name: "firstName" },
              { label: "Last Name", name: "lastName" },
              { label: "Email", name: "email" },
              { label: "Phone", name: "phone" },
              { label: "DOB", name: "dob" },
              { label: "Address", name: "address" },
            ].map(({ label, name }) => (
              <div key={name} className="flex flex-col">
                <label className="text-sm font-semibold">{label}</label>
                <input
                  type={name === "dob" ? "date" : "text"}
                  name={name}
                  className="border border-red-500 p-2 rounded"
                  value={formData[name as keyof TrainerFormData] as string}
                  onChange={handleChange}
                  required
                />
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-4">
            <span className="font-semibold">Gender:</span>
            {["Male", "Female", "Other"].map((g) => (
              <label key={g} className="flex items-center gap-1">
                <input
                  type="radio"
                  name="gender"
                  value={g}
                  checked={formData.gender === g}
                  onChange={handleChange}
                  required
                />
                {g}
              </label>
            ))}
          </div>
        </fieldset>

        {/* Emergency Contact */}
        <fieldset className="mb-6">
          <legend className="text-lg font-bold border-b-4 border-red-500 mb-4">
            Emergency Contact
          </legend>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              name="emergencyName"
              placeholder="Contact Name"
              value={formData.emergencyName}
              onChange={handleChange}
              className="border border-red-500 p-2 rounded"
              required
            />
            <input
              type="text"
              name="emergencyPhone"
              placeholder="Contact Phone"
              value={formData.emergencyPhone}
              onChange={handleChange}
              className="border border-red-500 p-2 rounded"
              required
            />
            <input
              type="text"
              name="relationship"
              placeholder="Relationship"
              value={formData.relationship}
              onChange={handleChange}
              className="border border-red-500 p-2 rounded col-span-2"
              required
            />
          </div>
        </fieldset>

        {/* Professional Qualifications */}
        <fieldset className="mb-6">
          <legend className="text-lg font-bold border-b-4 border-red-500 mb-4">
            Qualifications
          </legend>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Specialization", name: "specialization" },
              { label: "Experience", name: "yearsOfExperience" },
              { label: "Availability", name: "availability" },
              { label: "Preferred Hours", name: "preferredTrainingHours" },
            ].map(({ label, name }) => (
              <div key={name} className="flex flex-col">
                <label className="text-sm font-semibold">{label}</label>
                <input
                  type="text"
                  name={name}
                  value={formData[name as keyof TrainerFormData] as string}
                  onChange={handleChange}
                  className="border border-red-500 p-2 rounded"
                  required
                />
              </div>
            ))}
            <div className="flex flex-col">
  <label className="text-sm font-semibold">Pricing Plan</label>
  <select
    name="pricingPlan"
    value={formData.pricingPlan}
    onChange={handleChange}
    className="border border-red-500 p-2 rounded"
    required
  >
    <option value="">Select a plan</option>
    <option value="Basic">Basic - $30/month</option>
    <option value="Standard">Standard - $50/month</option>
    <option value="Premium">Premium - $80/month</option>
  </select>
</div>

            <div className="col-span-2">
              <label className="text-sm font-semibold">
                Certifications (comma separated)
              </label>
              <input
                type="text"
                name="certifications"
                value={formData.certifications.join(", ")}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    certifications: e.target.value
                      .split(",")
                      .map((c) => c.trim()),
                  }))
                }
                className="border border-red-500 p-2 rounded w-full"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-semibold">Biography</label>
              <textarea
                name="biography"
                className="border border-red-500 p-2 rounded w-full h-24"
                value={formData.biography}
                onChange={handleChange}
                required
              />
            </div>

            {/* Skills */}
            <div className="col-span-2">
              <label className="text-sm font-semibold">Skills</label>
              <div className="flex gap-4 mb-2">
                <input
                  type="text"
                  placeholder="Skill name"
                  value={newSkill.name}
                  onChange={(e) =>
                    setNewSkill({ ...newSkill, name: e.target.value })
                  }
                  className="border border-red-500 p-2 rounded w-1/2"
                />
                <input
                  type="number"
                  placeholder="Level (1-5)"
                  min={1}
                  max={5}
                  value={newSkill.level}
                  onChange={(e) =>
                    setNewSkill({
                      ...newSkill,
                      level: parseInt(e.target.value),
                    })
                  }
                  className="border border-red-500 p-2 rounded w-1/4"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="bg-red-600 text-white px-4 rounded hover:bg-red-700"
                >
                  Add
                </button>
              </div>
              <ul className="text-sm list-disc list-inside">
                {formData.skills.map((skill, idx) => (
                  <li key={idx}>
                    {skill.name} (Level {skill.level})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </fieldset>

        {/* Terms and Submit */}
        <div className="flex items-center my-4">
          <input
            type="checkbox"
            id="termsAccepted"
            name="termsAccepted"
            checked={formData.termsAccepted}
            onChange={handleChange}
            className="mr-2"
          />
          <label htmlFor="termsAccepted" className="text-sm">
            I agree to the{" "}
            <a href="#" className="text-blue-600 underline">
              terms and conditions
            </a>
            .
          </label>
        </div>

        <button
          type="submit"
          className="w-full bg-red-600 text-white font-semibold p-3 rounded-lg hover:bg-red-700"
        >
          Submit
        </button>
      </form>
    </div>
  );
}
