"use client";
import React, { useEffect, useState } from "react";

interface Trainer {
  _id: string;
  firstName: string;
  lastName: string;
  role: "trainer";
}

interface Member {
  _id: string;
  firstName: string;
  lastName: string;
  image: string;
  role: "member";
}

const UserManagement: React.FC = () => {
  const [pendingTrainers, setPendingTrainers] = useState<Trainer[]>([]);
  const [pendingMembers, setPendingMembers] = useState<Member[]>([]);

  // Fetch pending users
  const fetchPendingUsers = async () => {
    const [trainerRes, memberRes] = await Promise.all([
      fetch("/api/user-management"),
      fetch("/api/pending-members"),
    ]);

    const [trainerData, memberData] = await Promise.all([
      trainerRes.json(),
      memberRes.json(),
    ]);

    setPendingTrainers(trainerData);
    setPendingMembers(memberData);
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const handleTrainerAction = async (id: string, action: "accept" | "decline") => {
    const endpoint =
      action === "accept"
        ? `/api/approve-trainer/${id}`
        : `/api/decline-trainer/${id}`;

    await fetch(endpoint, {
      method: action === "accept" ? "POST" : "DELETE",
    });

    setPendingTrainers((prev) => prev.filter((t) => t._id !== id));
  };

  const handleMemberAction = async (id: string, action: "accept" | "decline") => {
    const endpoint =
      action === "accept"
        ? `/api/approve-member/${id}`
        : `/api/decline-member/${id}`;

    await fetch(endpoint, {
      method: action === "accept" ? "POST" : "DELETE",
    });

    setPendingMembers((prev) => prev.filter((m) => m._id !== id));
  };

  return (
    <div className="min-h-screen flex flex-col justify-start items-center bg-gray-200 py-6">
      <h2 className="text-center text-3xl font-extrabold mb-6">New User Management</h2>

      <div className="w-full max-w-4xl bg-white p-6 rounded-lg shadow-lg space-y-8">
        {/* Trainer Section */}
        <div>
          <div className="inline-block bg-red-600 text-white px-4 py-2 text-lg font-bold rounded">
            Trainers
          </div>

          <div className="mt-3 space-y-3">
            {pendingTrainers.map((trainer) => (
              <div key={trainer._id} className="flex items-center">
                <span className="text-lg font-bold mr-2">{trainer.firstName} {trainer.lastName}</span>
                <div className="flex-1 bg-gray-400 h-6 rounded mx-2"></div>
                <button
                  className="px-4 py-1 bg-black text-white font-bold rounded"
                  onClick={() => handleTrainerAction(trainer._id, "accept")}
                >
                  Accept
                </button>
                <button
                  className="ml-2 px-4 py-1 bg-red-600 text-white font-bold rounded"
                  onClick={() => handleTrainerAction(trainer._id, "decline")}
                >
                  Decline
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Member Section */}
        <div>
          <div className="inline-block bg-blue-600 text-white px-4 py-2 text-lg font-bold rounded">
            Members
          </div>

          <div className="mt-3 space-y-3">
            {pendingMembers.map((member) => (
              <div key={member._id} className="flex items-center">
                <img
                  src={member.image}
                  alt={`${member.firstName} ${member.lastName}`}
                  className="w-10 h-10 rounded-full mr-3 border-2 border-gray-500"
                />
                <span className="text-lg font-bold mr-2">{member.firstName} {member.lastName}</span>
                <div className="flex-1 bg-gray-400 h-6 rounded mx-2"></div>
                <button
                  className="px-4 py-1 bg-black text-white font-bold rounded"
                  onClick={() => handleMemberAction(member._id, "accept")}
                >
                  Accept
                </button>
                <button
                  className="ml-2 px-4 py-1 bg-red-600 text-white font-bold rounded"
                  onClick={() => handleMemberAction(member._id, "decline")}
                >
                  Decline
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;

