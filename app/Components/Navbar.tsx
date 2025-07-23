"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import MiniCart from "./MiniCart"; // Adjust if needed pasindi
import { useRouter } from "next/navigation";
// For dynamic logo
interface SiteSettings {
  logoUrl: string;
}

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [logoLoading, setLogoLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      setLogoLoading(true);
      try {
        const res = await fetch('/api/settings');
        if (!res.ok) throw new Error('Failed to fetch settings');
        const data = await res.json();
        setSettings({ logoUrl: data.logoUrl || "/Logo.png" });
      } catch (err) {
        setSettings({ logoUrl: "/Logo.png" });
      } finally {
        setLogoLoading(false);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    const userId = localStorage.getItem("userId");
    setIsLoggedIn(!!userRole && !!userId);

    const handleStorageChange = () => {
      const userRole = localStorage.getItem("userRole");
      const userId = localStorage.getItem("userId");
      setIsLoggedIn(!!userRole && !!userId);
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const handleCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLoggedIn) {
      router.push("/kalana/cart");
    } else {
      router.push("/login");
    }
  };

  return (
    <nav className="bg-black text-white py-7 px-2 flex items-center justify-between w-full border-b border-black">
      {/* Logo */}
      <Link href="/" className="flex items-center">
        {logoLoading ? (
          <div className="w-[150px] h-[100px] bg-gray-200 animate-pulse rounded" />
        ) : (
          <Image
            src={settings?.logoUrl || "/Logo.png"}
            alt="FitSync Pro Logo"
            width={150}
            height={100}
          />
        )}
        <div className="ml-2 flex flex-col text-left"></div>
      </Link>

      <ul className="hidden md:flex space-x-10 items-center text-xl">
        <li className="px-3 py-2 hover:bg-gray-800 rounded-md transition-colors duration-150">
          <Link href="/">Home</Link>
        </li>
        <li className="px-3 py-2 hover:bg-gray-800 rounded-md transition-colors duration-150">
          <Link href="/hasini/About_page">About</Link>
        </li>
        <li className="px-3 py-2 hover:bg-gray-800 rounded-md transition-colors duration-150">
          <Link href="/hasini/Gallery_page">Gallery</Link>
        </li>
        <li className="px-3 py-2 hover:bg-gray-800 rounded-md transition-colors duration-150">
          <Link href="/schedule">Schedule</Link>
        </li>
        {/* Purchases Dropdown */}
        <li className="relative group px-3 py-2 hover:bg-gray-800 rounded-md transition-colors duration-150">
          <span className="cursor-pointer select-none">Purchases ▾</span>
          <ul className="absolute left-0 top-full mt-2 bg-black text-white rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 min-w-[200px] z-50 text-lg py-2">
            <li className="px-6 py-3 hover:bg-gray-700 rounded-t-md">
              <Link href="/#fitness-service">Monthly Plans</Link>
            </li>
            <li className="px-6 py-3 hover:bg-gray-700">
              <Link href="/#featured-classes">Classes</Link>
            </li>
            <li className="px-6 py-3 hover:bg-gray-700 rounded-b-md">
              <Link href="/pasindi/products">Shop</Link>
            </li>
          </ul>
        </li>
        <li className="px-3 py-2 hover:bg-gray-800 rounded-md transition-colors duration-150">
          <Link href="/sathya/trainerDetails">Trainers</Link>
        </li>
        <li className="px-3 py-2 hover:bg-gray-800 rounded-md transition-colors duration-150">
          <Link href="/sathya/feedback">Feedback</Link>
        </li>
        <li className="px-3 py-2 hover:bg-gray-800 rounded-md transition-colors duration-150">
          <Link href="/hasini/Contact_Page">Contact</Link>
        </li>
        {isLoggedIn && localStorage.getItem("userRole") === "admin" && (
          <li className="px-3 py-2 hover:bg-gray-800 rounded-md transition-colors duration-150">
            <Link href="/user-system-management/admindashboard" title="Admin Dashboard">
              🛡️
            </Link>
          </li>
        )}
        {isLoggedIn && localStorage.getItem("userRole") === "member" && (
          <li className="px-3 py-2 hover:bg-gray-800 rounded-md transition-colors duration-150">
            <Link href="/user-system-management/memberdashboard" title="Member Dashboard">
              👤
            </Link>
          </li>
        )}
      </ul>


      {/* Right Icons */}
      <div className="flex items-center space-x-4">
        {/* Cart button removed as requested */}
        <Link href="/">
          <button className="text-white px-2 py-2">
            <Image
              src="/searchicon.png"
              alt="Search Icon"
              width={20}
              height={20}
            />
          </button>
        </Link>

        {isLoggedIn && (
          <div className="hidden md:block">
            <MiniCart />
          </div>
        )}

        {/* Join Class Button (visible on desktop only) */}

        <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
          ☰
        </button>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <ul className="absolute top-16 left-0 bg-black w-full flex flex-col items-center space-y-4 py-4 md:hidden">
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>
            <Link href="/hasini/About_page">About</Link>
          </li>
          <li>
            <Link href="/hasini/Gallery_page">Gallery</Link>
          </li>
          <li>
            <Link href="/class">Class</Link>
          </li>
          <li>
            <Link href="/schedule">Schedule</Link>
          </li>
          <li>
            <Link href="/pasindi/products">Shop</Link>
          </li>
          <li>
            <Link href="/hasini/Contact_Page">Contact</Link>
          </li>
          {isLoggedIn && localStorage.getItem("userRole") === "admin" && (
            <li>
              <Link
                href="/user-system-management/admindashboard"
                className="text-yellow-400 font-semibold"
                title="Admin Dashboard"
              >
                🛡️ Admin Dashboard
              </Link>
            </li>
          )}
          {isLoggedIn && localStorage.getItem("userRole") === "member" && (
            <li>
              <Link
                href="/user-system-management/memberdashboard"
                className="text-blue-400 font-semibold"
                title="Member Dashboard"
              >
                👤 Member Dashboard
              </Link>
            </li>
          )}
          <li>
            <Link href="/join">
              <button className="bg-red-600 px-4 py-2 text-sm">Join Now</button>
            </Link>
          </li>
          {isLoggedIn && (
            <li>
              <MiniCart />
            </li>
          )}
        </ul>
      )}
    </nav>
  );
};

export default Navbar;
