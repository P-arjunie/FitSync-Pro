"use client";

import React, { useState } from "react";
import { FaCamera } from "react-icons/fa";

// Define form data interface
interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string;
  gender: string;
  address: string;
  currentWeight: string;
  height: string;
  bmi: string;
  goalWeight: string;
  emergencyName: string;
  emergencyPhone: string;
  relationship: string;
  membershipType: string;
  startDate: string;
  termsAccepted: boolean;
}

const MemberRegistrationForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dob: "",
    gender: "",
    address: "",
    currentWeight: "",
    height: "",
    bmi: "",
    goalWeight: "",
    emergencyName: "",
    emergencyPhone: "",
    relationship: "",
    membershipType: "",
    startDate: "",
    termsAccepted: false,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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
    console.log("Form submitted:", formData);
    alert("Registration Successful!");
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
          Registration Form - Member
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
              { label: "Current Weight", name: "currentWeight" },
              { label: "Height", name: "height" },
              { label: "BMI", name: "bmi" },
              { label: "Goal Weight", name: "goalWeight" },
            ].map(({ label, name }) => (
              <div key={name} className="flex flex-col">
                <label className="text-sm font-semibold">{label}</label>
                <input
                  type={name === "dob" ? "date" : "text"}
                  name={name}
                  placeholder={`Enter ${label}`}
                  className="border border-red-500 p-2 rounded"
                  value={formData[name as keyof FormData]}
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
                  value={formData[name as keyof FormData]}
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

        {/* Membership Information */}
        <fieldset className="mb-6">
          <legend className="text-lg font-bold border-b-4 border-red-500 mb-4">
            Membership Information
          </legend>
          <div className="flex flex-col gap-4">
            {/* Membership Type */}
            <div>
              <span className="font-semibold">Choose Membership Type:</span>
              <div className="flex gap-4 mt-2">
                {["Monthly Membership", "Annual Membership", "Day Pass"].map(
                  (type) => (
                    <label key={type} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="membershipType"
                        value={type}
                        checked={formData.membershipType === type}
                        onChange={handleChange}
                        required
                      />
                      <span>{type}</span>
                    </label>
                  )
                )}
              </div>
            </div>

            {/* Preferred Start Date */}
            <div className="flex flex-col">
              <label className="text-sm font-semibold">Preferred Start Date</label>
              <input
                type="date"
                name="startDate"
                className="border border-red-500 p-2 rounded"
                value={formData.startDate}
                onChange={handleChange}
                required
              />
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="termsAccepted"
                checked={formData.termsAccepted}
                onChange={handleChange}
                required
              />
              <span className="text-sm">I agree to terms & conditions</span>
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

export default MemberRegistrationForm;

