// src/components/Footer.tsx
import React from "react";
import { Github, Youtube, Twitter } from "lucide-react";

// You can keep the FooterButton component co-located here or make it a separate file
type FooterButtonProps = {
  icon: React.ReactNode;
  label: string;
};

function FooterButton({ icon, label }: FooterButtonProps) {
  return (
    <button className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-white/80 hover:bg-white/5">
      {icon}
      <span>{label}</span>
    </button>
  );
}

export default function Footer() {
  return (
    <footer className="mt-10 border-t border-white/5">
      <div className="mx-auto max-w-7xl px-6 py-10 grid md:grid-cols-2 gap-8 items-center">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-400 to-fuchsia-500" />
            <span className="font-semibold">TrackShift Arena</span>
          </div>
          <p className="mt-3 text-white/60 max-w-md">A real‑time AI motorsport platform. Built with FastAPI, WebSockets, React‑Three‑Fiber, and a lot of intent.</p>
          <p className="mt-3 text-white/40 text-sm">© {new Date().getFullYear()} TrackShift. All rights reserved.</p>
        </div>
        <div className="flex md:justify-end gap-3">
          <FooterButton icon={<Twitter className="h-4 w-4" />} label="Twitter" />
          <FooterButton icon={<Youtube className="h-4 w-4" />} label="YouTube" />
          <FooterButton icon={<Github className="h-4 w-4" />} label="GitHub" />
        </div>
      </div>
    </footer>
  );
}