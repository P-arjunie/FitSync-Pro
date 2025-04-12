"use client";
import React, { useEffect, useState } from "react";

interface Trainer {
  _id: string;
  firstName: string;
  lastName: string;
  role: "trainer";
}

const UserManagement: React.FC = () => {
  const [pendingTrainers, setPendingTrainers] = useState<Trainer[]>([]);

  // Fetch pending trainers from backend
  const fetchPendingTrainers = async () => {
    const res = await fetch("/api/user-management");
    const data = await res.json();
    setPendingTrainers(data);
  };

  useEffect(() => {
    fetchPendingTrainers();
  }, []);

  const handleAction = async (id: string, action: "accept" | "decline") => {
    const endpoint =
      action === "accept"
        ? `/api/approve-trainer/${id}`
        : `/api/decline-trainer/${id}`;

    await fetch(endpoint, {
      method: action === "accept" ? "POST" : "DELETE",
    });

    // Update the frontend state
    setPendingTrainers((prev) => prev.filter((t) => t._id !== id));
  };

  return (
    <div className="min-h-screen flex flex-col justify-start items-center bg-gray-200 py-6">
      <h2 className="text-center text-3xl font-extrabold mb-6">New User Management</h2>

      <div className="w-full max-w-2xl bg-white p-6 rounded-lg shadow-lg">
        {/* Trainer Section Only */}
        <div>
          <div className="inline-block bg-red-600 text-white px-4 py-2 text-lg font-bold rounded">
            Trainer
          </div>

          <div className="mt-3">
            {pendingTrainers.map((trainer) => (
              <div key={trainer._id} className="flex items-center mb-3">
                <span className="text-lg font-bold mr-2">{trainer.firstName} {trainer.lastName}</span>
                <div className="flex-1 bg-gray-400 h-6 rounded"></div>
                <button
                  className="ml-3 px-4 py-1 bg-black text-white font-bold rounded"
                  onClick={() => handleAction(trainer._id, "accept")}
                >
                  Accept
                </button>
                <button
                  className="ml-2 px-4 py-1 bg-red-600 text-white font-bold rounded"
                  onClick={() => handleAction(trainer._id, "decline")}
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
