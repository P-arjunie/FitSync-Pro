"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-black text-white py-2 px-2 flex items-center justify-between w-full border-b border-white">
      {/* Logo and Text */}
      <Link href="/" className="flex items-center">
        <Image src="/logo.png" alt="FitSync Pro Logo" width={40} height={40} />
        <div className="ml-2 flex flex-col text-left">
          <span className="text-sm font-normal">FITSYNC PRO</span>
          <span className="text-xs font-normal">ULTIMATE GYM CENTER</span>
        </div>
      </Link>

      {/* Desktop Navigation */}
      <ul className="hidden md:flex space-x-10">
        <li className="text-lg hover:bg-gray-700 hover:rounded-md py-1 px-2"><Link href="/">Home</Link></li>
        <li className="text-lg hover:bg-gray-700 hover:rounded-md py-1 px-2"><Link href="/about">About</Link></li>
        <li className="text-lg hover:bg-gray-700 hover:rounded-md py-1 px-2"><Link href="/pages">Pages</Link></li>
        <li className="text-lg hover:bg-gray-700 hover:rounded-md py-1 px-2"><Link href="/class">Class</Link></li>
        <li className="text-lg hover:bg-gray-700 hover:rounded-md py-1 px-2"><Link href="/schedule">Schedule</Link></li>
        <li className="text-lg hover:bg-gray-700 hover:rounded-md py-1 px-2"><Link href="/contact">Blogs</Link></li>
        <li className="text-lg hover:bg-gray-700 hover:rounded-md py-1 px-2"><Link href="/shop">Shop</Link></li>
        <li className="text-lg hover:bg-gray-700 hover:rounded-md py-1 px-2"><Link href="/contact">Contact</Link></li>
      </ul>

      {/* Icons and Join Class Button */}
      <div className="flex items-center space-x-4">
        {/* Search Icon */}
        <Link href="/">
          <button className="text-white px-2 py-2">
            <Image src="/searchicon.png" alt="Search Icon" width={20} height={20} />
          </button>
        </Link>

        {/* Cart Icon */}
        <Link href="/c">
          <button className="text-white px-2 py-2">
            <Image src="/cart.png" alt="Cart Icon" width={20} height={20} />
          </button>
        </Link>

        {/* Join Class Button (visible on desktop only) */}
        <Link href="/join">
          <button className="bg-red-600 px-3 py-1 text-sm hidden md:block">Join Class Now</button>
        </Link>

        {/* Mobile Menu Button (☰) */}
        <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
          ☰
        </button>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <ul className="absolute top-16 left-0 bg-black w-full flex flex-col items-center space-y-4 py-4 md:hidden">
          <li><Link href="/">Home</Link></li>
          <li><Link href="/about">About</Link></li>
          <li><Link href="/pages">Pages</Link></li>
          <li><Link href="/class">Class</Link></li>
          <li><Link href="/schedule">Schedule</Link></li>
          <li><Link href="/shop">Shop</Link></li>
          <li><Link href="/contact">Contact</Link></li>
          {/* Join Class Button in Mobile View */}
          <li>
            <Link href="/join">
              <button className="bg-red-600 px-4 py-2 text-sm">Join Now</button>
            </Link>
          </li>
        </ul>
      )}
    </nav>
  );
};

export default Navbar;
