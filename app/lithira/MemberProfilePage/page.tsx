'use client';

import { useEffect, useState } from 'react';

const MemberProfilePage = () => {
  const [memberData, setMemberData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    const fetchMemberData = async () => {
      try {
        const email = localStorage.getItem("userEmail");
        if (!email) throw new Error("No email found in localStorage");

        const res = await fetch(`/api/member/getByEmail?email=${email}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || 'Failed to fetch member');

        setMemberData(data.data);
        setFormData(data.data);
      } catch (err: any) {
        console.error("Error fetching member profile:", err);
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchMemberData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updatedForm = {
      ...formData,
      [name]: value,
    };

    // Auto-calculate BMI when height or currentWeight changes
    if (name === 'height' || name === 'currentWeight') {
      const height = parseFloat(name === 'height' ? value : updatedForm.height);
      const weight = parseFloat(name === 'currentWeight' ? value : updatedForm.currentWeight);
      if (height && weight) {
        const heightMeters = height / 100;
        updatedForm.bmi = (weight / (heightMeters * heightMeters)).toFixed(2);
      }
    }

    setFormData(updatedForm);
  };

  const handleNestedInputChange = (section: string, key: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev: any) => ({
        ...prev,
        image: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleUpdate = async () => {
    const email = localStorage.getItem("userEmail");
    if (!email) {
      alert("No email found");
      return;
    }

    const res = await fetch(`/api/member/profile?email=${email}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(formData),
    });

    const result = await res.json();

    if (res.ok) {
      alert("Profile updated successfully!");
      setEditMode(false);
      setMemberData(result.data);
    } else {
      alert(result.message || "Failed to update profile");
    }
  };

  if (loading) return <p>Loading your profile...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-6 text-center">Member Profile</h2>

      {formData?.image && (
        <div className="flex justify-center mb-4">
          <img src={formData.image} alt="Profile" className="w-32 h-32 rounded-full object-cover" />
        </div>
      )}

      {editMode && (
        <div className="mb-4">
          <label className="block font-semibold">Upload Image:</label>
          <input type="file" accept="image/*" onChange={handleImageChange} className="file-input" />
        </div>
      )}

      <div className="space-y-4">
        {/* All existing fields retained as-is */}

        {/* First Name */}
        <div>
          <label className="block font-semibold">First Name:</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName || ''}
            onChange={handleInputChange}
            disabled={!editMode}
            className="input input-bordered w-full"
          />
        </div>

        {/* Last Name */}
        <div>
          <label className="block font-semibold">Last Name:</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName || ''}
            onChange={handleInputChange}
            disabled={!editMode}
            className="input input-bordered w-full"
          />
        </div>

        {/* Email (not editable) */}
        <div>
          <label className="block font-semibold">Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email || ''}
            disabled
            className="input input-bordered w-full"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block font-semibold">Phone:</label>
          <input
            type="text"
            name="contactNumber"
            value={formData.contactNumber || ''}
            onChange={handleInputChange}
            disabled={!editMode}
            className="input input-bordered w-full"
          />
        </div>

        {/* Gender */}
        <div>
          <label className="block font-semibold">Gender:</label>
          <input
            type="text"
            value={formData.gender || ''}
            disabled
            className="input input-bordered w-full"
          />
        </div>

        {/* DOB */}
        <div>
          <label className="block font-semibold">Date of Birth:</label>
          <input
            type="date"
            value={formData.dob ? formData.dob.slice(0, 10) : ''}
            disabled
            className="input input-bordered w-full"
          />
        </div>

        {/* Address */}
        <div>
          <label className="block font-semibold">Address:</label>
          <input
            type="text"
            name="address"
            value={formData.address || ''}
            onChange={handleInputChange}
            disabled={!editMode}
            className="input input-bordered w-full"
          />
        </div>

        {/* Emergency Contact */}
        <hr className="my-4" />
        <h3 className="font-semibold text-lg">Emergency Contact</h3>

        <div>
          <label className="block font-semibold">Name:</label>
          <input
            type="text"
            value={formData.emergencyContact?.name || ''}
            onChange={(e) => handleNestedInputChange("emergencyContact", "name", e.target.value)}
            disabled={!editMode}
            className="input input-bordered w-full"
          />
        </div>

        <div>
          <label className="block font-semibold">Phone:</label>
          <input
            type="text"
            value={formData.emergencyContact?.phone || ''}
            onChange={(e) => handleNestedInputChange("emergencyContact", "phone", e.target.value)}
            disabled={!editMode}
            className="input input-bordered w-full"
          />
        </div>

        <div>
          <label className="block font-semibold">Relationship:</label>
          <input
            type="text"
            value={formData.emergencyContact?.relationship || ''}
            onChange={(e) => handleNestedInputChange("emergencyContact", "relationship", e.target.value)}
            disabled={!editMode}
            className="input input-bordered w-full"
          />
        </div>

        {/* Membership Info */}
        <hr className="my-4" />
        <h3 className="font-semibold text-lg">Membership Info</h3>

        <div>
          <label className="block font-semibold">Plan:</label>
          <input
            type="text"
            value={formData.membershipInfo?.plan || ''}
            onChange={(e) => handleNestedInputChange("membershipInfo", "plan", e.target.value)}
            disabled={!editMode}
            className="input input-bordered w-full"
          />
        </div>

        <div>
          <label className="block font-semibold">Start Date:</label>
          <input
            type="date"
            value={formData.membershipInfo?.startDate?.slice(0, 10) || ''}
            onChange={(e) => handleNestedInputChange("membershipInfo", "startDate", e.target.value)}
            disabled={!editMode}
            className="input input-bordered w-full"
          />
        </div>

        {/* Fitness Info */}
        <hr className="my-4" />
        <h3 className="font-semibold text-lg">Fitness Info</h3>

        <div>
          <label className="block font-semibold">Height (cm):</label>
          <input
            type="number"
            name="height"
            value={formData.height || ''}
            onChange={handleInputChange}
            disabled={!editMode}
            className="input input-bordered w-full"
          />
        </div>

        <div>
          <label className="block font-semibold">Current Weight (kg):</label>
          <input
            type="number"
            name="currentWeight"
            value={formData.currentWeight || ''}
            onChange={handleInputChange}
            disabled={!editMode}
            className="input input-bordered w-full"
          />
        </div>

        <div>
          <label className="block font-semibold">Goal Weight (kg):</label>
          <input
            type="number"
            name="goalWeight"
            value={formData.goalWeight || ''}
            onChange={handleInputChange}
            disabled={!editMode}
            className="input input-bordered w-full"
          />
        </div>

        <div>
          <label className="block font-semibold">BMI:</label>
          <input
            type="number"
            name="bmi"
            value={formData.bmi || ''}
            disabled
            className="input input-bordered w-full"
          />
        </div>

        {/* Buttons */}
        <div className="mt-6 flex justify-end gap-4">
          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Update Profile
            </button>
          ) : (
            <>
              <button
                onClick={handleUpdate}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Save Changes
              </button>
              <button
                onClick={() => {
                  setEditMode(false);
                  setFormData(memberData);
                }}
                className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberProfilePage;
