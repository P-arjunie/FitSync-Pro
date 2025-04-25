'use client';

import { useEffect, useState } from 'react';

const MemberProfilePage = () => {
  const [memberData, setMemberData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMemberData = async () => {
      try {
        const email = localStorage.getItem("userEmail");
        if (!email) throw new Error("No email found in localStorage");

        const res = await fetch(`/api/member/getByEmail?email=${email}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || 'Failed to fetch member');

        setMemberData(data.data);
      } catch (err: any) {
        console.error("Error fetching member profile:", err);
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchMemberData();
  }, []);

  if (loading) return <p>Loading your profile...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-6 text-center">Member Profile</h2>

      {memberData?.image && (
        <div className="flex justify-center mb-4">
          <img src={memberData.image} alt="Profile" className="w-32 h-32 rounded-full object-cover" />
        </div>
      )}

      <div className="space-y-3">
        <p><strong>First Name:</strong> {memberData?.firstName}</p>
        <p><strong>Last Name:</strong> {memberData?.lastName}</p>
        <p><strong>Email:</strong> {memberData?.email}</p>
        <p><strong>Phone:</strong> {memberData.contactNumber}</p>

        <p><strong>Gender:</strong> {memberData?.gender}</p>
        <p><strong>Date of Birth:</strong> {memberData?.dob}</p>
        <p><strong>Address:</strong> {memberData?.address}</p>

        <hr className="my-4" />

        <h3 className="font-semibold text-lg">Emergency Contact</h3>
        <p><strong>Name:</strong> {memberData?.emergencyContact?.name}</p>
        <p><strong>Phone:</strong> {memberData?.emergencyContact?.phone}</p>
        <p><strong>Relationship:</strong> {memberData?.emergencyContact?.relationship}</p>

        <hr className="my-4" />

        <h3 className="font-semibold text-lg">Membership Info</h3>
        <p><strong>Plan:</strong> {memberData?.membershipInfo?.plan}</p>
        <p><strong>Start Date:</strong> {memberData?.membershipInfo?.startDate?.slice(0, 10)}</p>

        <hr className="my-4" />

        <h3 className="font-semibold text-lg">Fitness Info</h3>
        <p><strong>Height:</strong> {memberData?.height} cm</p>
        <p><strong>Current Weight:</strong> {memberData?.currentWeight} kg</p>
        <p><strong>Goal Weight:</strong> {memberData?.goalWeight} kg</p>
        <p><strong>BMI:</strong> {memberData?.bmi}</p>
      </div>
    </div>
  );
};

export default MemberProfilePage;
