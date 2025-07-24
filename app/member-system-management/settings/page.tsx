"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/Components/Navbar";
import Footer1 from "@/Components/Footer_01";

const SettingsPage: React.FC = () => {
  // Removed logoPreview, logoFile, and handleLogoChange
  const [footerText, setFooterText] = useState<string>("© 2024 FitSync Pro. All rights reserved.");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Footer fields
  const [classes, setClasses] = useState<string[]>(["Cycling", "Yoga", "Power Lifting", "Yoga", "Meditation", "Mixed Martial Arts"]);
  const [workingHours, setWorkingHours] = useState({
    weekdays: "Monday - Friday: 7:00 a.m. - 9:00 p.m.",
    saturday: "Saturday: 7:00 a.m. - 4:00 p.m.",
    sunday: "Sunday Close",
  });
  const [contact, setContact] = useState({
    address: "No 4/1, Sapumal Palace Colombo",
    phone: "+94 71 278 1444",
    email: "fitsyncpro.gym@gmail.com",
  });
  const [social, setSocial] = useState({
    whatsapp: "https://wa.me/+94712781444",
    instagram: "https://www.instagram.com",
    facebook: "https://www.facebook.com",
    linkedin: "mailto:email@email.com",
  });

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/settings");
        if (!res.ok) throw new Error("Failed to fetch settings");
        const data = await res.json();
        setFooterText(data.footerText || "");
        setClasses(data.classes || []);
        setWorkingHours(data.workingHours || { weekdays: "", saturday: "", sunday: "" });
        setContact(data.contact || { address: "", phone: "", email: "" });
        setSocial(data.social || { whatsapp: "", instagram: "", facebook: "", linkedin: "" });
      } catch (err: any) {
        setError(err.message || "Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // Removed handleLogoChange

  const handleFooterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFooterText(e.target.value);
  };

  const handleClassChange = (idx: number, value: string) => {
    setClasses(prev => prev.map((c, i) => (i === idx ? value : c)));
  };
  const handleAddClass = () => setClasses(prev => [...prev, ""]);
  const handleRemoveClass = (idx: number) => setClasses(prev => prev.filter((_, i) => i !== idx));

  const handleWorkingHoursChange = (field: string, value: string) => {
    setWorkingHours(prev => ({ ...prev, [field]: value }));
  };
  const handleContactChange = (field: string, value: string) => {
    setContact(prev => ({ ...prev, [field]: value }));
  };
  const handleSocialChange = (field: string, value: string) => {
    setSocial(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess("");
    setError("");
    try {
      // Removed logoUrl from payload
      const payload = {
        footerText,
        classes,
        workingHours,
        contact,
        social,
      };
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save settings");
      setSuccess("Settings saved successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navbar />
      <div className="flex-1 flex flex-col items-center py-10 px-4">
        <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">System Settings</h2>
          {loading ? (
            <div className="text-center text-gray-500">Loading settings...</div>
          ) : (
            <form onSubmit={handleSave} className="space-y-8">
              {/* Footer Text */}
              <div>
                <label className="block font-semibold mb-2">Footer Text</label>
                <input
                  type="text"
                  value={footerText}
                  onChange={handleFooterChange}
                  className="input input-bordered w-full"
                />
              </div>
              {/* Classes */}
              <div>
                <label className="block font-semibold mb-2">Footer Classes</label>
                {classes.map((c, idx) => (
                  <div key={idx} className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={c}
                      onChange={e => handleClassChange(idx, e.target.value)}
                      className="input input-bordered flex-1"
                    />
                    <button type="button" onClick={() => handleRemoveClass(idx)} className="text-red-600 font-bold">✕</button>
                  </div>
                ))}
                <button type="button" onClick={handleAddClass} className="mt-2 px-3 py-1 bg-gray-200 rounded">Add Class</button>
              </div>
              {/* Working Hours */}
              <div>
                <label className="block font-semibold mb-2">Working Hours</label>
                <input
                  type="text"
                  value={workingHours.weekdays}
                  onChange={e => handleWorkingHoursChange("weekdays", e.target.value)}
                  className="input input-bordered w-full mb-2"
                />
                <input
                  type="text"
                  value={workingHours.saturday}
                  onChange={e => handleWorkingHoursChange("saturday", e.target.value)}
                  className="input input-bordered w-full mb-2"
                />
                <input
                  type="text"
                  value={workingHours.sunday}
                  onChange={e => handleWorkingHoursChange("sunday", e.target.value)}
                  className="input input-bordered w-full"
                />
              </div>
              {/* Contact Info */}
              <div>
                <label className="block font-semibold mb-2">Contact Info</label>
                <input
                  type="text"
                  value={contact.address}
                  onChange={e => handleContactChange("address", e.target.value)}
                  className="input input-bordered w-full mb-2"
                  placeholder="Address"
                />
                <input
                  type="text"
                  value={contact.phone}
                  onChange={e => handleContactChange("phone", e.target.value)}
                  className="input input-bordered w-full mb-2"
                  placeholder="Phone"
                />
                <input
                  type="email"
                  value={contact.email}
                  onChange={e => handleContactChange("email", e.target.value)}
                  className="input input-bordered w-full"
                  placeholder="Email"
                />
              </div>
              {/* Social Media Links */}
              <div>
                <label className="block font-semibold mb-2">Social Media Links</label>
                <input
                  type="url"
                  value={social.whatsapp}
                  onChange={e => handleSocialChange("whatsapp", e.target.value)}
                  className="input input-bordered w-full mb-2"
                  placeholder="WhatsApp Link"
                />
                <input
                  type="url"
                  value={social.instagram}
                  onChange={e => handleSocialChange("instagram", e.target.value)}
                  className="input input-bordered w-full mb-2"
                  placeholder="Instagram Link"
                />
                <input
                  type="url"
                  value={social.facebook}
                  onChange={e => handleSocialChange("facebook", e.target.value)}
                  className="input input-bordered w-full mb-2"
                  placeholder="Facebook Link"
                />
                <input
                  type="url"
                  value={social.linkedin}
                  onChange={e => handleSocialChange("linkedin", e.target.value)}
                  className="input input-bordered w-full"
                  placeholder="LinkedIn/Email Link"
                />
              </div>
              {success && <div className="text-green-600 text-center">{success}</div>}
              {error && <div className="text-red-600 text-center">{error}</div>}
              <div className="flex justify-center">
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-semibold shadow"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      <Footer1 />
    </div>
  );
};

export default SettingsPage; 