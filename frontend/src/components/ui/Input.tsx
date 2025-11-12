import React from "react";

// 👇 Define the props type
type InputProps = React.ComponentPropsWithoutRef<'input'> & {
  icon: React.ReactNode;
};

export default function Input({ icon, ...props }: InputProps) { // 👈 Use the type
  return (
    <div className="relative">
      <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 opacity-60">
        {icon}
      </div>
      <input
        {...props}
        className="w-full rounded-2xl bg-white/5 px-10 py-3 outline-none border border-white/10 text-white placeholder-white/40 focus:border-white/20"
      />
    </div>
  );
}