// components/Header.tsx
"use client";

import React from "react";
import Image from "next/image";

/**
 * Header component
 * Displays the logo and title.
 */
export default function Header() {
  return (
    <header className="bg-gov-blue border-b-8 border-gov-cyan" role="banner">

      <div className="max-w-7xl mx-auto px-4 py-4">

        <div className="flex items-center space-x-4">

          {/* Logo */}
          <Image 
            src="/logo.png" 
            alt="Gov.gr Emblem" 
            width={64} 
            height={64} 
          />

          {/* Divider */}
          <div className="border-l border-gray-600 h-6" />

          {/* Title */}
          <a className="text-white text-xl md:text-2xl font-semibold">
            ΣΔΑΔ Explorer
          </a>
        </div>
      </div>

    </header>
  );
};