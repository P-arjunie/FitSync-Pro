"use client";

import React, { useState, useEffect } from "react";
import { FaCamera } from "react-icons/fa";
import { useRouter } from "next/navigation";

const MemberRegistrationForm: React.FC = () => {
  const router = useRouter();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    contactNumber: "",
    dob: "",
    gender: "",
    address: "",
    currentWeight: "",
    height: "",
    bmi: "",
    goalWeight: "",
    image: "",
    emergencyContact: {
      name: "",
      phone: "",
      relationship: "",
    },
    membershipInfo: {
      plan: "",
      startDate: "",
    },
    termsAccepted: false,
  });

  useEffect(() => {
    // Load stored profile image from localStorage on mount
    const storedImage = localStorage.getItem("memberProfileImage");
    if (storedImage) {
      setFormData((prev) => ({ ...prev, image: storedImage }));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<any>) => {
    const { name, value, checked, type } = e.target;

    if (name.startsWith("emergencyContact.")) {
      const key = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        emergencyContact: {
          ...prev.emergencyContact,
          [key]: value,
        },
      }));
    } else if (name.startsWith("membershipInfo.")) {
      const key = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        membershipInfo: {
          ...prev.membershipInfo,
          [key]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  // Simple email regex for basic validation
  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Simple phone number validation (digits only, length 7-15)
  const isValidPhone = (phone: string) =>
    /^\d{7,15}$/.test(phone.replace(/\D/g, ""));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Terms must be accepted
    if (!formData.termsAccepted) {
      alert("Please accept the terms and conditions.");
      return;
    }

    // Image is required
    if (!formData.image) {
      alert("Profile image is required.");
      return;
    }

    // Validate email format
    if (!isValidEmail(formData.email)) {
      alert("Please enter a valid email address.");
      return;
    }

    // Validate contact number format
    if (!isValidPhone(formData.contactNumber)) {
      alert("Please enter a valid contact number (digits only).");
      return;
    }

    // Validate emergency contact phone
    if (!isValidPhone(formData.emergencyContact.phone)) {
      alert("Please enter a valid emergency contact phone number (digits only).");
      return;
    }

    // Validate currentWeight, height, bmi, goalWeight as positive numbers if filled
    const numericFields = ["currentWeight", "height", "bmi", "goalWeight"] as const;
    for (const field of numericFields) {
      const val = formData[field];
      if (val !== "" && (isNaN(Number(val)) || Number(val) <= 0)) {
        alert(`Please enter a valid positive number for ${field}.`);
        return;
      }
    }

    try {
      // Submit form data to backend API
      const res = await fetch("/api/member/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Registration failed");
      }

      alert("Registration submitted for admin approval.");
      localStorage.removeItem("memberProfileImage");
      router.push("/some/confirmation-page");
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Registration failed.");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-gray-200 to-gray-300">
      <form
        onSubmit={handleSubmit}
        className="w-[800px] bg-gray-100 p-6 rounded-lg shadow-xl relative"
      >
        {/* Profile Image Preview */}
        <div className="absolute top-6 right-6 w-20 h-20 rounded-full overflow-hidden border-4 border-red-500 bg-white flex items-center justify-center">
          {formData.image ? (
            <img
              src={formData.image}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <label className="cursor-pointer flex items-center justify-center w-full h-full">
              <FaCamera className="text-2xl text-gray-600" />
              <input type="file" className="hidden" accept="image/*" />
            </label>
          )}
        </div>

        <h2 className="text-3xl font-bold text-center mb-2">
          Registration Form - Member
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
              { label: "Email Address", name: "email" },
              { label: "Phone Number", name: "contactNumber" },
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
                  className="border border-red-500 p-2 rounded"
                  value={(formData as any)[name]}
                  onChange={handleChange}
                  required
                />
              </div>
            ))}
          </div>

          {/* Gender selection */}
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

        {/* Emergency Contact */}
        <fieldset className="mb-6">
          <legend className="text-lg font-bold border-b-4 border-red-500 mb-4">
            Emergency Contact Information
          </legend>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-sm font-semibold">Name</label>
              <input
                type="text"
                name="emergencyContact.name"
                className="border border-red-500 p-2 rounded"
                value={formData.emergencyContact.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-semibold">Phone</label>
              <input
                type="text"
                name="emergencyContact.phone"
                className="border border-red-500 p-2 rounded"
                value={formData.emergencyContact.phone}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-semibold">Relationship</label>
              <input
                type="text"
                name="emergencyContact.relationship"
                className="border border-red-500 p-2 rounded w-full"
                value={formData.emergencyContact.relationship}
                onChange={handleChange}
              />
            </div>
          </div>
        </fieldset>

        {/* Membership Info */}
        <fieldset className="mb-6">
          <legend className="text-lg font-bold border-b-4 border-red-500 mb-4">
            Membership Information
          </legend>
          <div className="flex flex-col gap-4">
            <div>
              <span className="font-semibold">Choose Membership Type:</span>
              <div className="flex gap-4 mt-2">
                {["Monthly Membership", "Annual Membership", "Day Pass"].map(
                  (type) => (
                    <label key={type} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="membershipInfo.plan"
                        value={type}
                        checked={formData.membershipInfo.plan === type}
                        onChange={handleChange}
                        required
                      />
                      <span>{type}</span>
                    </label>
                  )
                )}
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-semibold">
                Preferred Start Date
              </label>
              <input
                type="date"
                name="membershipInfo.startDate"
                className="border border-red-500 p-2 rounded"
                value={formData.membershipInfo.startDate}
                onChange={handleChange}
                required
              />
            </div>

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

        {/* Submit button */}
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

