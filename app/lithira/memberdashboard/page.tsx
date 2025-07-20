"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/Components/Navbar";
import Footer1 from "@/Components/Footer_01";
import Image from "next/image";

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
      title: "My Orders",
      description: "View and manage your orders",
      icon: "📦",
      color: "bg-red-600 hover:bg-red-700",
      link: "/kalana/my-orders",
    },
    {
      title: "Sessions",
      description: "View your training sessions",
      icon: "🏋️",
      color: "bg-gray-800 hover:bg-gray-900",
      link: "/pasindi/all-sessions",
    },
    {
      title: "Request Sessions",
      description: "Book new training sessions",
      icon: "📅",
      color: "bg-red-600 hover:bg-red-700",
      link: "/pasindi/schedule",
    },
    {
      title: "My Profile",
      description: "Manage your profile and settings",
      icon: "👤",
      color: "bg-gray-800 hover:bg-gray-900",
      link: "/lithira/MemberProfilePage",
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

        {/* Quick Stats Section */}
        <div className="w-full max-w-6xl mt-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              My Activity Overview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">📦</span>
                  <div>
                    <p className="text-sm text-gray-600">Total Orders</p>
                    <p className="text-xl font-bold text-red-600">
                      {isLoading ? "Loading..." : memberStats.totalOrders}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">🏋️</span>
                  <div>
                    <p className="text-sm text-gray-600">Active Sessions</p>
                    <p className="text-xl font-bold text-gray-700">
                      {isLoading ? "Loading..." : memberStats.activeSessions}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">✅</span>
                  <div>
                    <p className="text-sm text-gray-600">Completed Sessions</p>
                    <p className="text-xl font-bold text-red-700">
                      {isLoading ? "Loading..." : memberStats.completedSessions}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="w-full max-w-6xl mt-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Recent Activity
            </h2>
            <div className="space-y-3">
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-green-500 mr-3">✓</span>
                <div>
                  <p className="font-semibold text-gray-800">
                    Session completed
                  </p>
                  <p className="text-sm text-gray-600">
                    Yoga session with Sarah Wilson
                  </p>
                </div>
                <span className="text-xs text-gray-500 ml-auto">
                  2 hours ago
                </span>
              </div>
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-blue-500 mr-3">📅</span>
                <div>
                  <p className="font-semibold text-gray-800">Session booked</p>
                  <p className="text-sm text-gray-600">
                    Power Lifting session for tomorrow
                  </p>
                </div>
                <span className="text-xs text-gray-500 ml-auto">1 day ago</span>
              </div>
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-orange-500 mr-3">📦</span>
                <div>
                  <p className="font-semibold text-gray-800">Order placed</p>
                  <p className="text-sm text-gray-600">
                    Premium membership plan
                  </p>
                </div>
                <span className="text-xs text-gray-500 ml-auto">
                  3 days ago
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer1 />
    </div>
  );
};

export default MemberDashboard;
