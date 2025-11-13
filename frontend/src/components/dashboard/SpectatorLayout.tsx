// File: src/components/dashboard/SpectatorLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../Navbar'; // <-- 1. Import Navbar

// 2. The local SpectatorHeader is no longer needed.

// This layout will wrap all Spectator pages
export default function SpectatorLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#071018] to-[#05060a] text-white">
      <Navbar /> {/* <-- 3. Use the standard Navbar */}
      <Outlet />
    </div>
  );
}