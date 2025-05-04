"use client";
import { useEffect, useState } from "react";
import axios from "axios";

interface Member {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  bmi: number;
  contactNumber: string;
  currentWeight: number;
  height: number;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  membershipType: string;
  preferredDate: string;
}

interface Trainer {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  specialization: string;
  experience: number;
  preferredHours: string;
  certifications: string[];
  pricingPlan: string;
  contactNumber: string;
  availability: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export default function AdminUserManagementPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [memberRes, trainerRes] = await Promise.all([
          axios.get("/api/admin/members"),
          axios.get("/api/admin/trainers"),
        ]);
        setMembers(memberRes.data);
        setTrainers(trainerRes.data);
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="p-6 space-y-12">
      {/* Member Section */}
      <section>
        <h2 className="text-2xl font-bold text-red-600 mb-4">Member</h2>
        <div className="overflow-auto">
          <table className="w-full border border-gray-300 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Email</th>
                <th>DOB</th>
                <th>Gender</th>
                <th>Address</th>
                <th>BMI</th>
                <th>Phone</th>
                <th>Weight</th>
                <th>Height</th>
                <th>Emergency Name</th>
                <th>Emergency No</th>
                <th>Relationship</th>
                <th>Membership</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m._id} className="text-center border-b">
                  <td>{m.firstName}</td>
                  <td>{m.lastName}</td>
                  <td>{m.email}</td>
                  <td>{m.dateOfBirth}</td>
                  <td>{m.gender}</td>
                  <td>{m.address}</td>
                  <td>{m.bmi}</td>
                  <td>{m.contactNumber}</td>
                  <td>{m.currentWeight}</td>
                  <td>{m.height}</td>
                  <td>{m.emergencyContact?.name || "—"}</td>
                  <td>{m.emergencyContact?.phone || "—"}</td>
                  <td>{m.emergencyContact?.relationship || "—"}</td>
                  <td>{m.membershipType}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex gap-4 mt-4">
            <button className="border px-4 py-2 rounded text-sm">Add User</button>
            <button className="border px-4 py-2 rounded text-sm">Edit User</button>
            <button className="border px-4 py-2 rounded text-sm">Suspend User</button>
            <button className="border px-4 py-2 rounded text-sm">Remove User</button>
          </div>
        </div>
      </section>

      {/* Trainer Section */}
      <section>
        <h2 className="text-2xl font-bold text-red-600 mb-4">Trainer</h2>
        <div className="overflow-auto">
          <table className="w-full border border-gray-300 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Email</th>
                <th>DOB</th>
                <th>Gender</th>
                <th>Specialization</th>
                <th>Experience</th>
                <th>Preferred Hours</th>
                <th>Certifications</th>
                <th>Pricing</th>
                <th>Contact</th>
                <th>Availability</th>
                <th>Emergency Name</th>
                <th>Emergency No</th>
                <th>Relationship</th>
              </tr>
            </thead>
            <tbody>
              {trainers.map((t) => (
                <tr key={t._id} className="text-center border-b">
                  <td>{t.firstName}</td>
                  <td>{t.lastName}</td>
                  <td>{t.email}</td>
                  <td>{t.dateOfBirth}</td>
                  <td>{t.gender}</td>
                  <td>{t.specialization}</td>
                  <td>{t.experience}</td>
                  <td>{t.preferredHours}</td>
                  <td>{t.certifications?.join(", ")}</td>
                  <td>{t.pricingPlan}</td>
                  <td>{t.contactNumber}</td>
                  <td>{t.availability}</td>
                  <td>{t.emergencyContact?.name || "—"}</td>
                  <td>{t.emergencyContact?.phone || "—"}</td>
                  <td>{t.emergencyContact?.relationship || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex gap-4 mt-4">
            <button className="border px-4 py-2 rounded text-sm">Add User</button>
            <button className="border px-4 py-2 rounded text-sm">Edit User</button>
            <button className="border px-4 py-2 rounded text-sm">Suspend User</button>
            <button className="border px-4 py-2 rounded text-sm">Remove User</button>
          </div>
        </div>
      </section>
    </div>
  );
}
