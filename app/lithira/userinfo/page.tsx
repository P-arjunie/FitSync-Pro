"use client";
import React from 'react';

interface User {
  id: string;
  name: string;
  role: 'member' | 'trainer';
}

interface Props {
  pendingUsers: User[];
  handleAction: (id: string, action: 'accept' | 'decline') => void;
}

const UserManagement: React.FC<Props> = ({ pendingUsers = [], handleAction }) => {
  const renderUsersByRole = (role: 'member' | 'trainer') => (
    pendingUsers
      .filter(user => user.role === role)
      .map(user => (
        <div key={user.id} className="flex items-center mb-3">
          <span className="text-lg font-bold mr-2">_____</span> {/* Placeholder for name */}
          <div className="flex-1 bg-gray-400 h-6 rounded"></div> {/* Placeholder for input field */}
          <button
            className="ml-3 px-4 py-1 bg-black text-white font-bold rounded"
            onClick={() => handleAction(user.id, 'accept')}
          >
            Accept
          </button>
          <button
            className="ml-2 px-4 py-1 bg-red-600 text-white font-bold rounded"
            onClick={() => handleAction(user.id, 'decline')}
          >
            Decline
          </button>
        </div>
      ))
  );

  return (
    <div className="min-h-screen flex flex-col justify-start items-center bg-gray-200 py-6">
      <h2 className="text-center text-3xl font-extrabold mb-6">New User Management</h2>

      <div className="w-full max-w-2xl bg-white p-6 rounded-lg shadow-lg">
        {/* Members Section */}
        <div className="mb-6">
          <div className="inline-block bg-red-600 text-white px-4 py-2 text-lg font-bold rounded">
            Member
          </div>
          <div className="mt-3">{renderUsersByRole('member')}</div>
        </div>

        {/* Trainers Section */}
        <div>
          <div className="inline-block bg-red-600 text-white px-4 py-2 text-lg font-bold rounded">
            Trainer
          </div>
          <div className="mt-3">{renderUsersByRole('trainer')}</div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;



