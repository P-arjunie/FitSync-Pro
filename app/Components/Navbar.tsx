"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import logo from "@/public/logo.png"; // Adjust path based on your project structure

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-black text-white py-4 px-6 flex items-center justify-between">
      {/* Logo */}
      <Link href="/">
        <Image src="/logo.png" alt="FitSync Pro Logo" width={150} height={50} />
      </Link>

      {/* Desktop Navigation */}
      <ul className="hidden md:flex space-x-6">
        <li><Link href="/">Home</Link></li>
        <li><Link href="/about">About</Link></li>
        <li><Link href="/pages">Pages</Link></li>
        <li><Link href="/class">Class</Link></li>
        <li><Link href="/schedule">Schedule</Link></li>
        <li><Link href="/shop">Shop</Link></li>
        <li><Link href="/contact">Contact</Link></li>
      </ul>

      {/* CTA Button */}
      <Link href="/join">
        <button className="bg-red-600 px-4 py-2 rounded-md">Join Class Now</button>
      </Link>

      {/* Mobile Menu Button */}
      <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
        ☰
      </button>

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
          <li>
            <Link href="/join">
              <button className="bg-red-600 px-4 py-2 rounded-md">Join Now</button>
            </Link>
          </li>
        </ul>
      )}
    </nav>
  );
};

export default Navbar;