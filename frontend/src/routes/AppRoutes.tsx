// File: src/routes/AppRoutes.tsx
import React from "react";
import { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import { useAuth } from "@/store/authStore";
import LandingPage from "@/pages/LandingPage";
import { useNavigate } from "react-router-dom";

// Import Layouts and Pages
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import SpectatorLayout from "@/components/dashboard/SpectatorLayout";
import AppHub from "@/routes/AppsHub"; // Our new role router
import CreateTeamPage from "@/pages/auth/CreateTeamPage"; // The "gate" for participants

// Participant Pages
import ParticipantDashboard from "@/pages/ParticipantDashboard";
import AiLabPage from "@/pages/AiLabPage";
import RoomsPage from "@/pages/RoomsPage";
import LeaderboardPage from "@/pages/LeaderBoardPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import TeamsPage from "@/pages/TeamsPage";
import SettingsPage from "@/pages/SettingsPage";
import CreateAgentsPage from "@/pages/auth/CreateAgentspage";

// Spectator Pages
import SpectatorDashboard from "@/pages/SpectatorDashboard";
// --- (Your RequireAuth and PublicOnly components MUST be in this file) ---
function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = useAuth((state) => state.user);
  const loading = useAuth((state) => state.loading);
  const fetchProfile = useAuth((state) => state.fetchProfile);
  const hasLoaded = useAuth((state) => state.hasLoaded);
  const location = useLocation();

  React.useEffect(() => {
    if (!hasLoaded && !loading) {
      fetchProfile();
    }
  }, [hasLoaded, loading, fetchProfile]);

  if (loading || !hasLoaded) {
    return (
      <div className="min-h-screen bg-[#0b0f17] text-white grid place-items-center">
        Loading session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function PublicOnly({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user) {
    return <Navigate to="/app" replace />;
  }
  return children;
}
// --- (End of Auth components) ---


function AuthRedirectCleanup() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.hash.includes("access_token")) {
      console.log('Cleaning auth tokens from URL hash...');
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  return null; 
}


export default function AppRoutes() {
  return (
    <BrowserRouter>
      <AuthRedirectCleanup /> 
      <Routes>
        {/* === Public Routes === */}
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/login"
          element={<PublicOnly><Login /></PublicOnly>}
        />
        <Route
          path="/signup"
          element={<PublicOnly><Signup /></PublicOnly>}
        />

        {/* === Protected App Routes === */}
        <Route
          path="/app"
          element={<RequireAuth><AppHub /></RequireAuth>}
        >
          {/* AppHub's <Outlet> renders one of the routes below: */}
          
          {/* 1. PARTICIPANT (Fully Onboarded) ROUTES */}
          <Route element={<DashboardLayout />}>
            <Route index element={<Navigate to="team" replace />} />
            <Route path="team" element={<ParticipantDashboard />} />
            <Route path="ai-lab" element={<AiLabPage />} />
            <Route path="rooms" element={<RoomsPage />} />
            <Route path="leaderboard" element={<LeaderboardPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="teams" element={<TeamsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          
          {/* 2. PARTICIPANT (Onboarding) ROUTES */}
          <Route path="create-team" element={<CreateTeamPage />} />
          <Route path="create-agents" element={<CreateAgentsPage />} />
        </Route>

        {/* === SPECTATOR ROUTES === */}
        <Route
          path="/app/spectator"
          element={<RequireAuth><SpectatorLayout /></RequireAuth>}
        >
          <Route index element={<SpectatorDashboard />} />
        </Route>
        
        {/* Fallback for old /dashboard link */}
        <Route path="/dashboard" element={<Navigate to="/app" replace />} />

      </Routes>
    </BrowserRouter>
  );
}