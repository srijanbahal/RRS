// File: src/components/dashboard/DashboardLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function DashboardLayout() {
  return (
    <div className="min-h-screen flex bg-linear-to-b from-[#071018] to-[#05060a] text-white">
      {/* This is your persistent sidebar.
        It's outside the Outlet, so it doesn't re-render on page navigation.
      */}
      <Sidebar />

      {/* This is where your dashboard pages will be rendered.
        The 'key' prop on Outlet is a trick to force re-animation on navigation.
      */}
      <main className="flex-1 h-screen overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}