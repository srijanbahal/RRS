// File: src/components/dashboard/ui/PageWrapper.tsx
import React from 'react';
import { motion } from 'framer-motion';

export default function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 5 }}
      transition={{ duration: 0.2 }}
      className="p-6 md:p-8 space-y-6"
    >
      {children}
    </motion.div>
  );
}