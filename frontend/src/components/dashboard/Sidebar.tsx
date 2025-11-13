// File: src/components/dashboard/Sidebar.tsx
import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  Home, 
  FlaskConical, 
  Swords, 
  Trophy, 
  BarChart3, 
  Users, 
  Settings 
} from 'lucide-react';

// 1. UPDATE ALL PATHS TO USE /app
const sidebarButtons = [
  { name: 'Home', icon: Home, path: '/app/team' },
  { name: 'AI Lab', icon: FlaskConical, path: '/app/ai-lab' },
  { name: 'Rooms', icon: Swords, path: '/app/rooms' },
  { name: 'Leaderboard', icon: Trophy, path: '/app/leaderboard' },
  { name: 'Analytics', icon: BarChart3, path: '/app/analytics' },
  { name: 'Teams', icon: Users, path: '/app/teams' },
  { name: 'Settings', icon: Settings, path: '/app/settings' },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <nav className="h-screen w-20 flex flex-col items-center py-6 gap-2
                    bg-white/5 backdrop-blur-md border-r border-white/10 shadow-lg">
      
      {/* Logo Placeholder */}
      <div className="h-10 w-10 mb-4 rounded-xl bg-gradient-to-br from-sky-400 to-fuchsia-500" />

      {sidebarButtons.map((item) => (
        <SidebarButton
          key={item.name}
          item={item}
          isActive={location.pathname.startsWith(item.path)}
        />
      ))}
    </nav>
  );
}

// --- SidebarButton Sub-Component ---

type SidebarButtonProps = {
  item: { name: string; icon: React.ElementType; path: string };
  isActive: boolean;
};

function SidebarButton({ item, isActive }: SidebarButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative h-14 w-14 flex items-center justify-center rounded-2xl
                  text-white/60 transition-all duration-200 ease-in-out
                  hover:bg-white/10 hover:text-white hover:scale-105
                  ${isActive ? 'bg-white/20 text-sky-300' : ''}`}
    >
      {/* Glowing Active Indicator */}
      {isActive && (
        <motion.div
          layoutId="active-indicator"
          className="absolute -left-1.5 h-8 w-1.5 rounded-r-full bg-sky-400 shadow-[0_0_10px_theme(colors.sky.400)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}

      <Icon className="h-6 w-6" />

      {/* Hover Tooltip Label (Framer Motion) */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, x: 10, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.9 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute left-full ml-4 px-3 py-1.5 
                       bg-gray-900 border border-white/10 rounded-lg shadow-lg
                       text-sm font-medium whitespace-nowrap z-50"
          >
            {item.name}
          </motion.div>
        )}
      </AnimatePresence>
    </NavLink>
  );
}