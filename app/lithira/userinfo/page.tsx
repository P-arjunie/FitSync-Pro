"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/Components/Navbar";
import Footer1 from "@/Components/Footer_01";

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
  membershipInfo?: {
    paymentPlan?: string;
  };
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

  const handleTrainerAction = async (
    id: string,
    action: "accept" | "decline"
  ) => {
    try {
      console.log(`🔄 Processing trainer ${action}: ${id}`);

      const endpoint =
        action === "accept"
          ? `/api/approve-trainer/${id}`
          : `/api/decline-trainer/${id}`;

      const response = await fetch(endpoint, {
        method: action === "accept" ? "POST" : "DELETE",
      });

      console.log(`📡 Response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`❌ Error ${action}ing trainer:`, errorData);
        alert(
          `Failed to ${action} trainer: ${errorData.error || errorData.message}`
        );
        return;
      }

      const result = await response.json();
      console.log(`✅ Trainer ${action}ed successfully:`, result);

      setPendingTrainers((prev) => prev.filter((t) => t._id !== id));
      alert(`Trainer ${action}ed successfully!`);
    } catch (error) {
      console.error(`❌ Error ${action}ing trainer:`, error);
      alert(`Error ${action}ing trainer. Please try again.`);
    }
  };

  const handleMemberAction = async (
    id: string,
    action: "accept" | "decline"
  ) => {
    try {
      console.log(`🔄 Processing member ${action}: ${id}`);

      const endpoint =
        action === "accept"
          ? `/api/approve-member/${id}`
          : `/api/decline-member/${id}`;

      const response = await fetch(endpoint, {
        method: action === "accept" ? "POST" : "DELETE",
      });

      console.log(`📡 Response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`❌ Error ${action}ing member:`, errorData);
        alert(
          `Failed to ${action} member: ${errorData.error || errorData.message}`
        );
        return;
      }

      const result = await response.json();
      console.log(`✅ Member ${action}ed successfully:`, result);

      setPendingMembers((prev) => prev.filter((m) => m._id !== id));
      alert(`Member ${action}ed successfully!`);
    } catch (error) {
      console.error(`❌ Error ${action}ing member:`, error);
      alert(`Error ${action}ing member. Please try again.`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navbar />
      <div className="flex-1 flex flex-col justify-start items-center py-6 px-4 relative">
        {/* Logout Button */}
        <button
          onClick={() => {
            localStorage.removeItem("userRole");
            localStorage.removeItem("userEmail");
            localStorage.removeItem("userName");
            localStorage.removeItem("userId");
            localStorage.removeItem("userStatus");
            localStorage.removeItem("profileImage");
            window.location.href = "/";
          }}
          className="absolute top-6 right-6 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold shadow hover:bg-red-700 transition"
        >
          Logout
        </button>
        <h2 className="text-4xl font-extrabold text-gray-800 mb-8 text-center">
          New User Management
        </h2>

        <div className="w-full max-w-4xl bg-gray-200 p-6 rounded-lg shadow-lg border-2 border-red-600 space-y-10">
          {/* Trainer Section */}
          <div>
            <div className="inline-block bg-red-600 text-white px-4 py-2 text-lg font-bold rounded">
              Trainers
            </div>
            <div className="mt-4 space-y-4">
              {pendingTrainers.map((trainer) => (
                <div
                  key={trainer._id}
                  className="flex items-center bg-gray-300 p-4 rounded border border-red-600"
                >
                  <img
                    src={trainer.profileImage}
                    alt={`${trainer.firstName} ${trainer.lastName}`}
                    className="w-12 h-12 rounded-full mr-4 border-2 border-white object-cover"
                  />
                  <button
                    onClick={() =>
                      router.push(`/admin/pending-trainer/${trainer._id}`)
                    }
                    className="text-lg font-semibold text-gray-800 mr-2 transition hover:text-red-500 hover:scale-[1.03] focus:outline-none"
                  >
                    {trainer.firstName} {trainer.lastName}
                  </button>

                  <div className="flex-1 mx-2 h-[2px] bg-gray-600"></div>
                  <button
                    className="px-4 py-1 bg-black text-white font-bold rounded hover:bg-gray-700"
                    onClick={() => handleTrainerAction(trainer._id, "accept")}
                  >
                    Accept
                  </button>
                  <button
                    className="ml-2 px-4 py-1 bg-red-600 text-white font-bold rounded hover:bg-red-800"
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
            <div className="inline-block bg-red-600 text-white px-4 py-2 text-lg font-bold rounded">
              Members
            </div>
            <div className="mt-4 space-y-4">
              {pendingMembers.map((member) => (
                <div
                  key={member._id}
                  className="flex items-center bg-gray-300 p-4 rounded border border-red-600"
                >
                  <img
                    src={member.image}
                    alt={`${member.firstName} ${member.lastName}`}
                    className="w-12 h-12 rounded-full mr-4 border-2 border-white object-cover"
                  />
                  <button
                    onClick={() =>
                      router.push(`/admin/pending-member/${member._id}`)
                    }
                    className="text-lg font-semibold text-gray-800 mr-2 transition hover:text-red-500 hover:scale-[1.03] focus:outline-none"
                  >
                    {member.firstName} {member.lastName}
                    {member.membershipInfo?.paymentPlan && (
                      <span className="ml-2 px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-xs font-semibold">
                        {member.membershipInfo.paymentPlan}
                      </span>
                    )}
                  </button>

                  <div className="flex-1 mx-2 h-[2px] bg-gray-600"></div>
                  <button
                    className="px-4 py-1 bg-black text-white font-bold rounded hover:bg-gray-700"
                    onClick={() => handleMemberAction(member._id, "accept")}
                  >
                    Accept
                  </button>
                  <button
                    className="ml-2 px-4 py-1 bg-red-600 text-white font-bold rounded hover:bg-red-800"
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
      <Footer1 />
    </div>
  );
};

export default UserManagement;
