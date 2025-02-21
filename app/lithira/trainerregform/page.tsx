"use client";

import React, { useState } from "react";
import { FaCamera } from "react-icons/fa";

interface TrainerFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string;
  gender: string;
  address: string;
  specialization: string;
  certifications: string;
  preferredTrainingHours: string;
  yearsOfExperience: string;
  availability: string;
  pricingPlan: string;
  emergencyName: string;
  emergencyPhone: string;
  relationship: string;
  startDate: string;
  termsAccepted: boolean;
}

const TrainerRegistrationForm: React.FC = () => {
  const [formData, setFormData] = useState<TrainerFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dob: "",
    gender: "",
    address: "",
    specialization: "",
    certifications: "",
    preferredTrainingHours: "",
    yearsOfExperience: "",
    availability: "",
    pricingPlan: "",
    emergencyName: "",
    emergencyPhone: "",
    relationship: "",
    startDate: "",
    termsAccepted: false,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.termsAccepted) {
      alert("Please accept the terms and conditions.");
      return;
    }
    console.log("Trainer Registration Data:", formData);
    alert("Trainer Registration Successful!");
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-gray-200 to-gray-300">
      <form
        onSubmit={handleSubmit}
        className="w-[800px] bg-gray-100 p-6 rounded-lg shadow-xl relative"
      >
        {/* Camera Icon */}
        <div className="absolute top-6 right-6 border-4 border-red-500 rounded-full w-16 h-16 flex justify-center items-center cursor-pointer">
          <label className="cursor-pointer">
            <FaCamera className="text-3xl text-gray-800" />
            <input type="file" className="hidden" accept="image/*" />
          </label>
        </div>

        {/* Title */}
        <h2 className="text-3xl font-bold text-center mb-2">
          Registration Form - Trainer
        </h2>
        <p className="text-center text-sm mb-6">
          Join Our Team & Inspire Fitness!
        </p>

        {/* Personal Information */}
        <fieldset className="mb-6">
          <legend className="text-lg font-bold border-b-4 border-red-500 mb-4">
            Personal Information
          </legend>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "First Name", name: "firstName" },
              { label: "Last Name", name: "lastName" },
              { label: "Email Address", name: "email" },
              { label: "Phone Number", name: "phone" },
              { label: "Date of Birth", name: "dob" },
              { label: "Address", name: "address" },
            ].map(({ label, name }) => (
              <div key={name} className="flex flex-col">
                <label className="text-sm font-semibold">{label}</label>
                <input
                  type={name === "dob" ? "date" : "text"}
                  name={name}
                  placeholder={`Enter ${label}`}
                  className="border border-red-500 p-2 rounded"
                  value={formData[name as keyof TrainerFormData]}
                  onChange={handleChange}
                  required
                />
              </div>
            ))}
          </div>

          {/* Gender Selection */}
          <div className="flex items-center gap-4 mt-4">
            <span className="font-semibold">Gender:</span>
            {["Male", "Female", "Other"].map((gender) => (
              <label key={gender} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="gender"
                  value={gender}
                  checked={formData.gender === gender}
                  onChange={handleChange}
                  required
                />
                <span>{gender}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Emergency Contact Information */}
        <fieldset className="mb-6">
          <legend className="text-lg font-bold border-b-4 border-red-500 mb-4">
            Emergency Contact Information
          </legend>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Emergency Contact Name", name: "emergencyName" },
              { label: "Emergency Contact Phone Number", name: "emergencyPhone" },
            ].map(({ label, name }) => (
              <div key={name} className="flex flex-col">
                <label className="text-sm font-semibold">{label}</label>
                <input
                  type="text"
                  name={name}
                  placeholder={`Enter ${label}`}
                  className="border border-red-500 p-2 rounded"
                  value={formData[name as keyof TrainerFormData]}
                  onChange={handleChange}
                  required
                />
              </div>
            ))}
            <div className="col-span-2">
              <label className="text-sm font-semibold">Relationship</label>
              <input
                type="text"
                name="relationship"
                placeholder="Enter Relationship"
                className="border border-red-500 p-2 rounded w-full"
                value={formData.relationship}
                onChange={handleChange}
              />
            </div>
          </div>
        </fieldset>

        {/* Professional Qualifications */}
        <fieldset className="mb-6">
          <legend className="text-lg font-bold border-b-4 border-red-500 mb-4">
            Professional Qualifications
          </legend>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Specialization", name: "specialization" },
              { label: "Years of Experience", name: "yearsOfExperience" },
              { label: "Certifications", name: "certifications" },
              { label: "Availability", name: "availability" },
              { label: "Preferred Training Hours", name: "preferredTrainingHours" },
            ].map(({ label, name }) => (
              <div key={name} className="flex flex-col">
                <label className="text-sm font-semibold">{label}</label>
                <input
                  type="text"
                  name={name}
                  placeholder={`Enter ${label}`}
                  className="border border-red-500 p-2 rounded"
                  value={formData[name as keyof TrainerFormData]}
                  onChange={handleChange}
                  required
                />
              </div>
            ))}

            {/* Pricing Plan Dropdown */}
            <div className="col-span-2">
              <label className="text-sm font-semibold">Pricing Plan</label>
              <select
                name="pricingPlan"
                className="border border-red-500 p-2 rounded w-full"
                value={formData.pricingPlan}
                onChange={handleChange}
                required
              >
                <option value="">Select a Plan</option>
                <option value="hourly">Hourly Rate</option>
                <option value="session">Per Session</option>
                <option value="monthly">Monthly Package</option>
              </select>
            </div>
          </div>
        </fieldset>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-red-600 text-white font-semibold p-3 rounded-lg hover:bg-red-700 transition"
        >
          Submit
        </button>
      </form>
    </div>
  );
};

export default TrainerRegistrationForm;
