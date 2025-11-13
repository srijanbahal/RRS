// File: src/components/dashboard/DashboardLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from '../Navbar'; // <-- 1. Import Navbar (from src/components/Navbar.tsx)

export default function DashboardLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-linear-to-b from-[#071018] to-[#05060a] text-white">
      <Navbar /> {/* <-- 2. Add the Navbar here */}

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 h-full overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}