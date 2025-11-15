// File: src/components/Navbar.tsx
// import React from "react";
import { useLocation, NavLink } from "react-router-dom";
import { ArrowRight, Github, LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "@/store/authStore";
import { useNavigate } from "react-router-dom";
// --- UI Library Components ---
// (These would be imported from your components/ui directory,
// similar to your existing Panel.tsx or Input.tsx)

import { Button } from "@/components/ui/button"; // Assuming a Shadcn-style button
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

// Helper function to get user initials
const getInitials = (name?: string | null, email?: string) => {

  if (name) {
    const parts = name.split(' ');
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
  if (email) {
    return email.substring(0, 2).toUpperCase();
  }
  return "TS"; // TrackShift fallback
};

// Helper function to determine the page title
const getPageTitle = (pathname: string) => {
  if (pathname.startsWith('/app/spectator')) return 'Spectator Mode';
  if (pathname.startsWith('/app/create-team')) return 'Team Onboarding';
  if (pathname.startsWith('/app/create-agents')) return 'Agent Setup';
  if (pathname.startsWith('/app/team')) return 'Team Dashboard';
  if (pathname.startsWith('/app/ai-lab')) return 'AI Lab';
  if (pathname.startsWith('/app/rooms')) return 'Race Lobby';
  if (pathname.startsWith('/app/leaderboard')) return 'Leaderboard';
  if (pathname.startsWith('/app/analytics')) return 'Analytics';
  if (pathname.startsWith('/app/teams')) return 'All Teams';
  if (pathname.startsWith('/app/settings')) return 'Settings';
  return 'Dashboard';
};

export default function Navbar() {
  const navigation = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const showLandingContent = !user;
  const pageTitle = getPageTitle(location.pathname);

  return (
    <header className="sticky top-0 z-20 backdrop-blur supports-backdrop-filter:bg-white/5 bg-white/0 border-b border-white/5">
      <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between h-16"> {/* Standard h-16 */}
        
        {/* === Left Side === */}
        <div className="flex items-center gap-4">
          <NavLink to={showLandingContent ? "/" : "/app"} className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-linear-to-br from-sky-400 to-fuchsia-500 shadow-lg shadow-fuchsia-500/20" />
            <span className="text-lg font-semibold tracking-wide">
              TrackShift Arena
            </span>
          </NavLink>
          
          {/* Dynamic Page Title for Logged-in Users */}
          {!showLandingContent && (
            <>
              <Separator orientation="vertical" className="h-6 bg-white/10" />
              <span className="hidden md:inline-block text-sm text-white/60">
                {pageTitle}
              </span>
            </>
          )}
        </div>

        {/* === Right Side (Dynamic) === */}
        <div className="flex items-center gap-3">
          {showLandingContent ? (
            // --- Landing Page View ---
            <>
              <nav className="hidden md:flex items-center gap-6 text-sm text-white/80 mr-3">
                <a href="#features" className="hover:text-white transition">Features</a>
                <a href="#how" className="hover:text-white transition">How it works</a>
              </nav>
              <Button variant="outline" className="hidden md:flex h-9">
                <Github className="h-4 w-4 mr-2" /> GitHub
              </Button>
              <Button asChild className="h-9 bg-linear-to-r from-sky-500 to-violet-500 text-white shadow-lg shadow-sky-500/20 hover:brightness-110">
                <a href="/login">
                  Launch app <ArrowRight className="h-4 w-4 ml-2" />
                </a>
              </Button>
            </>
          ) : (
            // --- Logged-in App View ---
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-black/10">
                  <Avatar className="h-9 w-9 border border-white/10">
                    {/* <AvatarImage src={user.avatarUrl} /> */}
                    <AvatarFallback className="bg-white/10 text-white/80 font-medium">
                      {getInitials(user.name, user.email)}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>
                  <p className="font-medium">My Account</p>
                  <p className="text-xs text-white/60 font-normal truncate">
                    {user.name || user.email}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => navigation('/app/settings')}>
                  <UserIcon className="h-4 w-4 mr-2" />
                  <span>Profile Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={logout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}

// NOTE: You would need to add the following (or similar)
// component files to your `src/components/ui/` directory:
// - avatar.tsx
// - button.tsx
// - dropdown-menu.tsx
// - separator.tsx