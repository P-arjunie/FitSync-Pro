'use client';

import React, { useEffect, useState } from 'react';

interface Member {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  profileImage: string;
  dob: string;
  gender: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  currentWeight: string;
  goalWeight: string;
  height: string;
  bmi: string;
  membershipType: string;
  paymentMethod: string;
  preferredWorkoutTime: string;
}

const MemberProfilePage = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await fetch('/api/member/getApproved');

        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        const data = await res.json();
        setMembers(data.data);
      } catch (err) {
        console.error("Error fetching members:", err);
        setError("Could not load member data.");
      }
    };

    fetchMembers();
  }, []);

  return (
    <div className="bg-black min-h-screen px-6 py-10 font-sans text-white">
      <h2 className="text-3xl font-bold text-center mb-8 tracking-wide">
        <span className="text-white">FitSyncPro</span>{' '}
        <span className="text-red-600">- Members</span>
      </h2>

      {error && <p className="text-red-500 text-center mb-4">{error}</p>}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
        {members.map((member) => (
          <div key={member._id} className="rounded-xl bg-white text-black shadow-lg p-5 hover:shadow-2xl transition">
            <div className="relative mb-4">
              <img
                src={member.profileImage || "/placeholder.jpg"}
                alt={member.fullName}
                className="rounded-xl w-full h-56 object-cover"
              />
            </div>
            <h3 className="text-xl font-bold text-gray-900">{member.fullName}</h3>
            <p className="text-sm text-gray-700">{member.email}</p>
            <p className="text-sm text-gray-700 mb-2">{member.phone}</p>
            <button
              onClick={() => setSelectedMember(member)}
              className="mt-4 text-sm text-red-600 hover:underline font-medium"
            >
              See more
            </button>
          </div>
        ))}
      </div>

      {selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 px-4">
          <div className="bg-white text-black p-6 rounded-2xl max-w-4xl w-full relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedMember(null)}
              className="absolute top-3 right-4 text-red-600 hover:text-black text-2xl font-bold"
            >
              ×
            </button>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <img
                  src={selectedMember.profileImage || "/placeholder.jpg"}
                  alt={selectedMember.fullName}
                  className="w-full h-64 object-cover rounded-xl mb-4"
                />
                <h3 className="text-2xl font-bold">{selectedMember.fullName}</h3>
                <p className="text-gray-600">{selectedMember.email}</p>
                <p className="text-gray-600">{selectedMember.phone}</p>
                <p className="text-sm text-gray-600 mt-2">DOB: {selectedMember.dob}</p>
                <p className="text-sm text-gray-600">Gender: {selectedMember.gender}</p>
                <p className="text-sm text-gray-600">Address: {selectedMember.address}</p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xl font-bold mb-1">Fitness Info</h4>
                <p>Current Weight: <span className="font-medium">{selectedMember.currentWeight} kg</span></p>
                <p>Goal Weight: <span className="font-medium">{selectedMember.goalWeight} kg</span></p>
                <p>Height: <span className="font-medium">{selectedMember.height} cm</span></p>
                <p>BMI: <span className="font-medium">{selectedMember.bmi}</span></p>

                <h4 className="text-xl font-bold mt-4 mb-1">Membership</h4>
                <p>Type: <span className="font-medium">{selectedMember.membershipType}</span></p>
                <p>Preferred Time: <span className="font-medium">{selectedMember.preferredWorkoutTime}</span></p>
                <p>Payment Method: <span className="font-medium">{selectedMember.paymentMethod}</span></p>

                <h4 className="text-xl font-bold mt-4 mb-1">Emergency Contact</h4>
                <p>{selectedMember.emergencyContactName} - {selectedMember.emergencyContactPhone}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberProfilePage;
