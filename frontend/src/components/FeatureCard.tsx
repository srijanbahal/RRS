// src/components/FeatureCard.tsx
import React from "react";
import { motion } from "framer-motion";

// Define the types for the props
type FeatureCardProps = {
  icon: React.ReactNode;
  title: string;
  desc: string;
};

export default function FeatureCard({ icon, title, desc }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/8 hover:-translate-y-0.5 transition"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-white/90">
          {icon}
        </div>
        <div>
          <h4 className="font-medium">{title}</h4>
          <p className="mt-1 text-white/70 text-sm">{desc}</p>
        </div>
      </div>
    </motion.div>
  );
}