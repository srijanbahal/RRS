import React from 'react';
import { useAuth } from '@/store/authStore';
import { ArrowLeft } from 'lucide-react';

export default function AppNavbar() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-[#0b0f17] border-b border-white/10">
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* You can use your logo here */}
          <div className="h-9 w-9 rounded-xl bg-linear-to-br from-sky-400 to-fuchsia-500" />
          <span className="text-lg font-semibold tracking-wide text-white">
            TrackShift Arena
          </span>
        </div>
        <nav className="flex items-center gap-4 text-sm text-white/80">
          <span className="hidden md:inline">
            Hello, {user?.name || user?.email}
          </span>
          <button
            onClick={logout}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/10 px-3 text-sm text-white/90 hover:bg-white/5"
          >
            Sign out <ArrowLeft className="h-4 w-4" />
          </button>
        </nav>
      </div>
    </header>
  );
}