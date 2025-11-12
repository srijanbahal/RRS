import React from "react";


export default function CTA({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) {
return (
<button
onClick={onClick}
disabled={disabled}
className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-violet-500 px-5 py-3 font-medium text-white shadow-lg shadow-sky-500/20 hover:brightness-110 disabled:opacity-60"
>
{children}
</button>
);
}