// File: src/components/dashboard/ui/ComingSoon.tsx
import React from 'react';
import { Eye, Zap } from 'lucide-react';

type ComingSoonProps = {
  title: string;
  desc: string;
  icon?: 'eye' | 'zap';
};

export default function ComingSoon({ title, desc, icon = 'zap' }: ComingSoonProps) {
  const Icon = icon === 'eye' ? Eye : Zap;
  return (
    <div className="text-center p-8 opacity-60">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/20 text-sky-300">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-white/60">{desc}</p>
    </div>
  );
}