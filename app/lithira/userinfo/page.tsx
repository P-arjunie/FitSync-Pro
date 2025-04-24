"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Trainer {
  _id: string;
  firstName: string;
  lastName: string;
  profileImage: string;
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
  const router = useRouter();

  useEffect(() => {
    const fetchPendingUsers = async () => {
      try {
        const [trainerRes, memberRes] = await Promise.all([
          fetch("/api/user-management"),
          fetch("/api/pending-members"),
        ]);

        if (!trainerRes.ok || !memberRes.ok) throw new Error("Failed to fetch");

        const [trainerData, memberData] = await Promise.all([
          trainerRes.json(),
          memberRes.json(),
        ]);

        setPendingTrainers(trainerData);
        setPendingMembers(memberData);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

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
    <div className="min-h-screen flex flex-col justify-start items-center bg-black py-6 px-4">
      <h2 className="text-4xl font-extrabold text-white mb-8 text-center">New User Management</h2>

      <div className="w-full max-w-4xl bg-zinc-900 p-6 rounded-lg shadow-lg border-2 border-red-800 space-y-10">
        {/* Trainer Section */}
        <div>
          <div className="inline-block bg-red-800 text-white px-4 py-2 text-lg font-bold rounded">
            Trainers
          </div>
          <div className="mt-4 space-y-4">
            {pendingTrainers.map((trainer) => (
              <div key={trainer._id} className="flex items-center bg-zinc-800 p-4 rounded border border-red-800">
                <img
                  src={trainer.profileImage}
                  alt={`${trainer.firstName} ${trainer.lastName}`}
                  className="w-12 h-12 rounded-full mr-4 border-2 border-white object-cover"
                />
                <button
                  onClick={() => router.push(`/admin/pending-trainer/${trainer._id}`)}
                  className="text-lg font-semibold text-white mr-2 transition hover:text-red-500 hover:scale-[1.03] focus:outline-none"
                >
                  {trainer.firstName} {trainer.lastName}
                </button>

                <div className="flex-1 mx-2 h-[2px] bg-gray-600"></div>
                <button
                  className="px-4 py-1 bg-black text-white font-bold rounded hover:bg-zinc-700"
                  onClick={() => handleTrainerAction(trainer._id, "accept")}
                >
                  Accept
                </button>
                <button
                  className="ml-2 px-4 py-1 bg-red-700 text-white font-bold rounded hover:bg-red-900"
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
          <div className="inline-block bg-red-800 text-white px-4 py-2 text-lg font-bold rounded">
            Members
          </div>
          <div className="mt-4 space-y-4">
            {pendingMembers.map((member) => (
              <div key={member._id} className="flex items-center bg-zinc-800 p-4 rounded border border-red-800">
                <img
                  src={member.image}
                  alt={`${member.firstName} ${member.lastName}`}
                  className="w-12 h-12 rounded-full mr-4 border-2 border-white object-cover"
                />
                <button
                  onClick={() => router.push(`/admin/pending-member/${member._id}`)}
                  className="text-lg font-semibold text-white mr-2 transition hover:text-red-500 hover:scale-[1.03] focus:outline-none"
                >
                  {member.firstName} {member.lastName}
                </button>

                <div className="flex-1 mx-2 h-[2px] bg-gray-600"></div>
                <button
                  className="px-4 py-1 bg-black text-white font-bold rounded hover:bg-zinc-700"
                  onClick={() => handleMemberAction(member._id, "accept")}
                >
                  Accept
                </button>
                <button
                  className="ml-2 px-4 py-1 bg-red-700 text-white font-bold rounded hover:bg-red-900"
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
