import React from 'react';
import AppNavbar from './AppNavbar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#071018] to-[#05060a] text-white">
      <AppNavbar />
      
      {/* Page content goes here */}
      <main>
        {children}
      </main>

      {/* A simple, modular footer */}
      <footer className="border-t border-white/5 mt-10">
        <div className="mx-auto max-w-7xl px-6 py-6 text-center text-sm text-white/40">
          &copy; {new Date().getFullYear()} TrackShift Arena. All rights reserved.
        </div>
      </footer>
    </div>
  );
}