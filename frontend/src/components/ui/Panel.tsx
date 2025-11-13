// File: src/components/dashboard/ui/Panel.tsx
import React from 'react';
import { motion } from 'framer-motion';

type PanelProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
};

export default function Panel({ children, className = '', delay = 0.1 }: PanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: delay }}
      className={`bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 ${className}`}
    >
      {children}
    </motion.div>
  );
}