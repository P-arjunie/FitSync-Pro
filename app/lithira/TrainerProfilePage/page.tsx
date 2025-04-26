'use client';

import { useEffect, useState } from 'react';

const TrainerProfilePage = () => {
  const [trainerData, setTrainerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    const fetchTrainerData = async () => {
      try {
        const email = localStorage.getItem("userEmail");
        if (!email) throw new Error("No email found in localStorage");

        const res = await fetch(`/api/trainer/getByEmail?email=${email}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || 'Failed to fetch trainer');

        setTrainerData(data.data);
        setFormData(data.data);
      } catch (err: any) {
        console.error("Error fetching trainer profile:", err);
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchTrainerData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleArrayChange = (name: string, index: number, value: string) => {
    setFormData((prev: any) => {
      const updatedArray = [...(prev[name] || [])];
      updatedArray[index] = value;
      return { ...prev, [name]: updatedArray };
    });
  };

  const handleSkillChange = (index: number, key: 'name' | 'level', value: string | number) => {
    setFormData((prev: any) => {
      const updatedSkills = [...(prev.skills || [])];
      updatedSkills[index] = { ...updatedSkills[index], [key]: value };
      return { ...prev, skills: updatedSkills };
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
  
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const base64Image = reader.result;
  
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64Image }), // <--- CORRECT field
        });
  
        const data = await res.json();
  
        if (res.ok) {
          setFormData((prev: any) => ({ ...prev, profileImage: data.url }));
        } else {
          alert(data.error || 'Image upload failed');
        }
      } catch (err) {
        console.error('Upload error:', err);
        alert('Image upload error');
      }
    };
  };
  
  

  const handleAddCertification = () => {
    setFormData((prev: any) => ({
      ...prev,
      certifications: [...(prev.certifications || []), ''],
    }));
  };

  const handleAddSkill = () => {
    setFormData((prev: any) => ({
      ...prev,
      skills: [...(prev.skills || []), { name: '', level: 1 }],
    }));
  };

  const handleUpdate = async () => {
    const email = localStorage.getItem("userEmail");
    if (!email) {
      alert("No email found");
      return;
    }

    const res = await fetch(`/api/trainer/profile?email=${email}`, {
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
      setTrainerData(result.data);
    } else {
      alert(result.message || "Failed to update profile");
    }
  };

  if (loading) return <p>Loading your profile...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-6 text-center">Trainer Profile</h2>
  
      {formData?.profileImage && (
        <div className="flex justify-center mb-4">
          <img src={formData.profileImage} alt="Profile" className="w-32 h-32 rounded-full object-cover" />
        </div>
      )}
      {editMode && (
        <div className="flex justify-center mb-6">
          <input type="file" accept="image/*" onChange={handleImageUpload} className="file-input file-input-bordered w-full max-w-xs" />
        </div>
      )}
  
      <div className="space-y-4">
  
        {/* Basic Info */}
        <div>
          <label className="block font-semibold">First Name:</label>
          <input type="text" value={formData.firstName || ''} disabled className="input input-bordered w-full" />
        </div>
        <div>
          <label className="block font-semibold">Last Name:</label>
          <input type="text" value={formData.lastName || ''} disabled className="input input-bordered w-full" />
        </div>
        <div>
          <label className="block font-semibold">Email:</label>
          <input type="email" value={formData.email || ''} disabled className="input input-bordered w-full" />
        </div>
        <div>
          <label className="block font-semibold">Gender:</label>
          <input type="text" value={formData.gender || ''} disabled className="input input-bordered w-full" />
        </div>
        <div>
          <label className="block font-semibold">Date of Birth:</label>
          <input type="date" value={formData.dob ? formData.dob.slice(0, 10) : ''} disabled className="input input-bordered w-full" />
        </div>
  
        {/* Contact Info */}
        <div>
          <label className="block font-semibold">Phone:</label>
          <input type="text" name="phone" value={formData.phone || ''} onChange={handleInputChange} disabled={!editMode} className="input input-bordered w-full" />
        </div>
        <div>
          <label className="block font-semibold">Address:</label>
          <input type="text" name="address" value={formData.address || ''} onChange={handleInputChange} disabled={!editMode} className="input input-bordered w-full" />
        </div>
  
        {/* Emergency Info */}
        <div>
          <label className="block font-semibold">Emergency Contact Name:</label>
          <input type="text" name="emergencyName" value={formData.emergencyName || ''} onChange={handleInputChange} disabled={!editMode} className="input input-bordered w-full" />
        </div>
        <div>
          <label className="block font-semibold">Emergency Contact Phone:</label>
          <input type="text" name="emergencyPhone" value={formData.emergencyPhone || ''} onChange={handleInputChange} disabled={!editMode} className="input input-bordered w-full" />
        </div>
        <div>
          <label className="block font-semibold">Relationship with Emergency Contact:</label>
          <input type="text" name="relationship" value={formData.relationship || ''} onChange={handleInputChange} disabled={!editMode} className="input input-bordered w-full" />
        </div>
  
        {/* Professional Info */}
        <div>
          <label className="block font-semibold">Specialization:</label>
          <input type="text" name="specialization" value={formData.specialization || ''} onChange={handleInputChange} disabled={!editMode} className="input input-bordered w-full" />
        </div>
        <div>
          <label className="block font-semibold">Availability:</label>
          <input type="text" name="availability" value={formData.availability || ''} onChange={handleInputChange} disabled={!editMode} className="input input-bordered w-full" />
        </div>
        <div>
          <label className="block font-semibold">Preferred Training Hours:</label>
          <input type="text" name="preferredTrainingHours" value={formData.preferredTrainingHours || ''} onChange={handleInputChange} disabled={!editMode} className="input input-bordered w-full" />
        </div>
        <div>
          <label className="block font-semibold">Years of Experience:</label>
          <input type="text" name="yearsOfExperience" value={formData.yearsOfExperience || ''} onChange={handleInputChange} disabled={!editMode} className="input input-bordered w-full" />
        </div>
  
        {/* Biography */}
        <div>
          <label className="block font-semibold">Biography:</label>
          <textarea name="biography" value={formData.biography || ''} onChange={handleInputChange} disabled={!editMode} className="textarea textarea-bordered w-full" rows={4} />
        </div>
  
        {/* Certifications */}
        <div>
          <label className="block font-semibold">Certifications:</label>
          {formData.certifications?.map((cert: string, idx: number) => (
            <input key={idx} type="text" value={cert} onChange={(e) => handleArrayChange('certifications', idx, e.target.value)} disabled={!editMode} className="input input-bordered w-full mb-2" />
          ))}
          {editMode && (
            <button onClick={handleAddCertification} className="btn btn-sm btn-outline mt-2">Add Certification</button>
          )}
        </div>
  
        {/* Skills */}
        <div>
          <label className="block font-semibold">Skills:</label>
          {formData.skills?.map((skill: any, idx: number) => (
            <div key={idx} className="flex gap-2 mb-2">
              <input type="text" value={skill.name} onChange={(e) => handleSkillChange(idx, 'name', e.target.value)} disabled={!editMode} className="input input-bordered w-1/2" placeholder="Skill Name" />
              <input type="number" value={skill.level} onChange={(e) => handleSkillChange(idx, 'level', Number(e.target.value))} disabled={!editMode} className="input input-bordered w-1/2" placeholder="Skill Level" />
            </div>
          ))}
          {editMode && (
            <button onClick={handleAddSkill} className="btn btn-sm btn-outline mt-2">Add Skill</button>
          )}
        </div>
  
        {/* Pricing Plan */}
        <div>
          <label className="block font-semibold">Pricing Plan:</label>
          <select name="pricingPlan" value={formData.pricingPlan || ''} onChange={handleInputChange} disabled={!editMode} className="select select-bordered w-full">
            <option value="">Select Plan</option>
            <option value="Basic">Basic</option>
            <option value="Standard">Standard</option>
            <option value="Premium">Premium</option>
          </select>
        </div>
  
        {/* Buttons */}
        <div className="mt-6 flex justify-end gap-4">
          {!editMode ? (
            <button onClick={() => setEditMode(true)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Update Profile</button>
          ) : (
            <>
              <button onClick={handleUpdate} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Save Changes</button>
              <button onClick={() => { setEditMode(false); setFormData(trainerData); }} className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500">Cancel</button>
            </>
          )}
        </div>
  
      </div>
    </div>
  );
  
}
export default TrainerProfilePage;
