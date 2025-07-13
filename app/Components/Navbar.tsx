"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import MiniCart from "./MiniCart"; // Adjust if needed pasindi
import { useRouter } from "next/navigation";

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

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
        <Image src="/logo.png" alt="FitSync Pro Logo" width={50} height={50} />
        <div className="ml-2 flex flex-col text-left">
          <span className="text-sm font-normal">FITSYNC PRO</span>
          <span className="text-xs font-normal">ULTIMATE GYM CENTER</span>
        </div>
      </Link>

      {/* Desktop Navigation */}
      <ul className="hidden md:flex space-x-10">
        <li className="text-lg hover:bg-gray-700 hover:rounded-md py-1 px-2"><Link href="/">Home</Link></li>
        <li className="text-lg hover:bg-gray-700 hover:rounded-md py-1 px-2"><Link href="/hasini/About_page">About</Link></li>
        <li className="text-lg hover:bg-gray-700 hover:rounded-md py-1 px-2"><Link href="/hasini/Gallery_page">Gallery</Link></li>
        <li className="text-lg hover:bg-gray-700 hover:rounded-md py-1 px-2"><Link href="/#featured-classes">Classes</Link></li>
        <li className="text-lg hover:bg-gray-700 hover:rounded-md py-1 px-2"><Link href="/schedule">Schedule</Link></li>
        <li className="text-lg hover:bg-gray-700 hover:rounded-md py-1 px-2"><Link href="/Blogs">Blogs</Link></li>
        <li className="text-lg hover:bg-gray-700 hover:rounded-md py-1 px-2"><Link href="/pasindi/products">Shop</Link></li>

        <li className="text-lg hover:bg-gray-700 hover:rounded-md py-1 px-2"><Link href="/hasini/Contact_Page">Contact</Link></li>
        <li className="text-lg hover:bg-gray-700 hover:rounded-md py-1 px-2"><Link href="/sathya/trainerDetails">Trainers</Link></li>
        <li className="text-lg hover:bg-gray-700 hover:rounded-md py-1 px-2"><Link href="/sathya/feedback">Feedback</Link></li>

      </ul>

      {/* Right Icons */}
      <div className="flex items-center space-x-4">
        
        <button onClick={handleCartClick} className="text-white px-2 py-2">
          {/* <Image src="/cart.png" alt="Cart Icon" width={24} height={24} /> */}
        </button>

       
        <Link href="/">
          <button className="text-white px-2 py-2">
            <Image src="/searchicon.png" alt="Search Icon" width={20} height={20} />
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
          <li><Link href="/">Home</Link></li>
          <li><Link href="/hasini/About_page">About</Link></li>
          <li><Link href="/hasini/Gallery_page">Gallery</Link></li>
          <li><Link href="/class">Class</Link></li>
          <li><Link href="/schedule">Schedule</Link></li>
          <li><Link href="/pasindi/products">Shop</Link></li>
          <li><Link href="/hasini/Contact_Page">Contact</Link></li>
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
