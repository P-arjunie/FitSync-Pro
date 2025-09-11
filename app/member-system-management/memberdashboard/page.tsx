/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/Components/Navbar";
import Footer1 from "@/Components/Footer_01";

const MemberDashboard: React.FC = () => {
  const router = useRouter();
  const [memberName, setMemberName] = useState("Member");
  const [memberStats, setMemberStats] = useState({
    totalOrders: 0,
    activeSessions: 0,
    completedSessions: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userName = localStorage.getItem("userName");
    if (userName) {
      setMemberName(userName);
    }

    // Clear the login timestamp when member visits dashboard directly
    localStorage.removeItem("memberLoginTimestamp");

    // Fetch member statistics
    const fetchMemberStats = async () => {
      try {
        // For now, we'll set placeholder data
        // In the future, these can be connected to real API endpoints
        setMemberStats({
          totalOrders: 5, // Placeholder
          activeSessions: 2, // Placeholder
          completedSessions: 8, // Placeholder
        });
      } catch (error) {
        console.error("Error fetching member stats:", error);
        setMemberStats({
          totalOrders: 0,
          activeSessions: 0,
          completedSessions: 0,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMemberStats();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    localStorage.removeItem("userId");
    localStorage.removeItem("userStatus");
    localStorage.removeItem("profileImage");
    window.location.href = "/";
  };

  const dashboardCards = [
    {
      title: "My Purchases",
      description: "View and manage your purchases",
      icon: "📦",
      color: "bg-red-600 hover:bg-red-700",
      link: "/fitness-activities-and-orders/purchase-history", // Updated link
    },
    {                                                             
      title: "Sessions",
      description: "View your training sessions",
      icon: "🏋️",
      color: "bg-gray-800 hover:bg-gray-900",
      link: "/trainer-sessions/my-joined-sessions",
    },
    {
      title: "My Profile",
      description: "Manage your profile and settings",
      icon: "👤",
      color: "bg-gray-800 hover:bg-gray-900",
      link: "/member-system-management/MemberProfilePage",
    },
    {
      title: "My Orders",
      description: "View and manage your orders",
      icon: "📦",
      color: "bg-red-600 hover:bg-red-700",
      link: "/user-order-management/my-orders", // Updated link
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navbar />

      <div className="flex-1 flex flex-col justify-start items-center py-8 px-4 relative">
        {/* Header Section */}
        <div className="w-full max-w-6xl mb-8">
          <div className="bg-black text-white p-8 rounded-lg shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">Member Dashboard</h1>
                <p className="text-xl text-gray-300">
                  Welcome back, {memberName}!
                </p>
                <p className="text-gray-400 mt-2">
                  Track your fitness journey and manage your activities
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-gray-300">Logged in as</p>
                  <p className="font-semibold">Member</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-200 shadow-lg"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Cards Grid */}
        <div className="w-full max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {dashboardCards.map((card, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-lg hover:shadow-xl transition duration-300 transform hover:scale-105 cursor-pointer"
                onClick={() => router.push(card.link)}
              >
                <div className={`${card.color} text-white p-6 rounded-t-lg`}>
                  <div className="flex items-center justify-between">
                    <span className="text-4xl">{card.icon}</span>
                    <div className="text-right">
                      <p className="text-sm opacity-90">Click to access</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {card.title}
                  </h3>
                  <p className="text-gray-600">{card.description}</p>
                  <div className="mt-4">
                    <button
                      className={`${card.color} text-white px-4 py-2 rounded-lg font-semibold transition duration-200 w-full`}
                    >
                      Access {card.title}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer1 />

      {/* Floating Chat Button */}
      <a
        href="/communication-and-notifications/User-chat"
        className="fixed bottom-8 right-8 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg p-4 flex items-center justify-center z-50"
        title="Chat with Trainer or Member"
        style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 15.75h6.75m-6.75-3h6.75m-6.75-3h6.75M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 0 1-4.2-.93c-.32-.15-.48-.22-.62-.25a.75.75 0 0 0-.37 0c-.14.03-.3.1-.62.25l-2.7 1.2a.375.375 0 0 1-.51-.46l.6-2.1c.09-.32.13-.48.12-.62a.75.75 0 0 0-.07-.27c-.06-.13-.15-.29-.32-.61A7.72 7.72 0 0 1 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8Z" />
        </svg>
      </a>
    </div>
  );
};

export default MemberDashboard;
