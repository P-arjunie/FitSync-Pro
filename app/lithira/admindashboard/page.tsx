"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/Components/Navbar";
import Footer1 from "@/Components/Footer_01";
import Image from "next/image";

const AdminDashboard: React.FC = () => {
  const router = useRouter();
  const [adminName, setAdminName] = useState("Admin");
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeTrainers: 0,
    pendingRequests: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userName = localStorage.getItem("userName");
    if (userName) {
      setAdminName(userName);
    }

    // Clear the login timestamp when admin visits dashboard directly
    // This allows them to navigate to homepage without being redirected back
    localStorage.removeItem("adminLoginTimestamp");

    // Fetch dashboard statistics
    const fetchStats = async () => {
      try {
        const [membersRes, trainersRes, pendingMembersRes] = await Promise.all([
          fetch("/api/admin/members"),
          fetch("/api/admin/trainers"),
          fetch("/api/pending-members"),
        ]);

        // Check if responses are ok before parsing JSON
        if (!membersRes.ok || !trainersRes.ok || !pendingMembersRes.ok) {
          throw new Error("Failed to fetch data from one or more endpoints");
        }

        const [membersData, trainersData, pendingMembersData] =
          await Promise.all([
            membersRes.json().catch(() => []),
            trainersRes.json().catch(() => []),
            pendingMembersRes.json().catch(() => []),
          ]);

        // For pending trainers, we'll use the Trainer model directly
        // since there's no GET endpoint for pending trainers
        const pendingTrainersRes = await fetch("/api/trainers");
        let pendingTrainersData = [];
        if (pendingTrainersRes.ok) {
          try {
            pendingTrainersData = await pendingTrainersRes.json();
            // Filter for pending trainers only
            pendingTrainersData = pendingTrainersData.filter(
              (trainer: any) => trainer.status === "pending"
            );
          } catch (error) {
            console.error("Error parsing pending trainers data:", error);
            pendingTrainersData = [];
          }
        }

        setStats({
          totalMembers: Array.isArray(membersData) ? membersData.length : 0,
          activeTrainers: Array.isArray(trainersData) ? trainersData.length : 0,
          pendingRequests:
            (Array.isArray(pendingMembersData)
              ? pendingMembersData.length
              : 0) +
            (Array.isArray(pendingTrainersData)
              ? pendingTrainersData.length
              : 0),
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        // Set default values on error
        setStats({
          totalMembers: 0,
          activeTrainers: 0,
          pendingRequests: 0,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
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
      title: "Requests",
      description: "Manage pending user requests",
      icon: "📋",
      color: "bg-red-600 hover:bg-red-700",
      link: "/lithira/userinfo",
    },
    {
      title: "User Management",
      description: "Manage approved users and trainers",
      icon: "👥",
      color: "bg-gray-800 hover:bg-gray-900",
      link: "/lithira/adminUserManagement",
    },
    {
      title: "Analytics",
      description: "View platform analytics and insights",
      icon: "📊",
      color: "bg-red-600 hover:bg-red-700",
      link: "/Analytics&Feedbacks/analytics",
    },
    {
      title: "Feedback Management",
      description: "Manage user feedback and reviews",
      icon: "💬",
      color: "bg-gray-800 hover:bg-gray-900",
      link: "/Analytics&Feedbacks/traineeReviwsediting",
    },
    {
      title: "Product Management",
      description: "Manage products and inventory",
      icon: "🛍️",
      color: "bg-red-600 hover:bg-red-700",
      link: "/pasindi/admin-products-dashboard",
    },
    {
      title: "Gallery",
      description: "Manage gallery images and content",
      icon: "🖼️",
      color: "bg-gray-800 hover:bg-gray-900",
      link: "/hasini/adminGallery",
    },
    {
      title: "Refund Requests",
      description: "Manage refund requests and payments",
      icon: "💰",
      color: "bg-red-600 hover:bg-red-700",
      link: "/admin/refund-requests",
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
                <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
                <p className="text-xl text-gray-300">
                  Welcome back, {adminName}!
                </p>
                <p className="text-gray-400 mt-2">
                  Manage your fitness platform from here
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-gray-300">Logged in as</p>
                  <p className="font-semibold">Administrator</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              Quick Overview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">👥</span>
                  <div>
                    <p className="text-sm text-gray-600">Total Members</p>
                    <p className="text-xl font-bold text-red-600">
                      {isLoading ? "Loading..." : stats.totalMembers}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">👨‍💼</span>
                  <div>
                    <p className="text-sm text-gray-600">Active Trainers</p>
                    <p className="text-xl font-bold text-gray-700">
                      {isLoading ? "Loading..." : stats.activeTrainers}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">📝</span>
                  <div>
                    <p className="text-sm text-gray-600">Pending Requests</p>
                    <p className="text-xl font-bold text-red-700">
                      {isLoading ? "Loading..." : stats.pendingRequests}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer1 />
    </div>
  );
};

export default AdminDashboard;
