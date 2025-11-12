// src/components/Navbar.tsx
import { ArrowRight, Github } from "lucide-react";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-20 backdrop-blur supports-backdrop-filter:bg-white/5 bg-white/0 border-b border-white/5">
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-linear-to-br from-sky-400 to-fuchsia-500 shadow-lg shadow-fuchsia-500/20" />
          <span className="text-lg font-semibold tracking-wide">TrackShift Arena</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm text-white/80">
          <a href="#features" className="hover:text-white transition">Features</a>
          <a href="#how" className="hover:text-white transition">How it works</a>
          <a href="#live" className="hover:text-white transition">Live races</a>
          <a href="#faq" className="hover:text-white transition">FAQ</a>
        </nav>
        <div className="flex items-center gap-3">
          <button className="hidden md:inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 px-4 text-sm text-white/90 hover:bg-white/5">
            <Github className="h-4 w-4" /> GitHub
          </button>
          <button className="inline-flex h-10 items-center gap-2 rounded-xl bg-linear-to-r from-sky-500 to-violet-500 px-4 text-sm font-medium shadow-lg shadow-sky-500/20 hover:brightness-110">
            Launch app <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}