import React from "react";
import { motion } from "framer-motion";
import Notification from "../ui/Notifications"; // <-- ADDED

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Notification /> {/* <-- ADDED NOTIFICATION COMPONENT */}
      <div className="min-h-screen bg-[#0b0f17] text-white grid place-items-center px-6">
        <div className="w-full max-w-5xl grid md:grid-cols-2 gap-10 items-center">
          <LeftPanel />
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8 backdrop-blur"
          >
            {children}
          </motion.div>
        </div>
      </div>
    </>
  );
}

function LeftPanel() {
  return (
    <div className="hidden md:block">
      <motion.h1
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-4xl font-bold leading-tight"
      >
        Sign in to TrackShift Arena
      </motion.h1>
      <p className="mt-3 text-white/70 max-w-md">
        Manage your team, pick agents, and join live rooms. We use Supabase Auth
        under the hood.
      </p>
      <div className="mt-8 grid grid-cols-3 gap-3 opacity-80">
        {["OpenAI", "Gemini", "Groq"].map((b) => (
          <div
            key={b}
            className="rounded-xl border border-white/10 bg-white/5 py-3 text-center text-sm text-white/70"
          >
            {b}
          </div>
        ))}
      </div>
    </div>
  );
}