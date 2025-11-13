import React, { useEffect } from "react";
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
// import LandingPage from "@/App";
import LandingPage from "@/pages/LandingPage";
// import DashboardPage from "@/pages/dashboard/DashboardPage";
import AppLayout from "@/components/AppLayout";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ParticipantDashboard from "@/pages/ParticipantDashboard";
import SpectatorDashboard from "@/pages/SpectatorDashboard";
// import PlaceholderPage from "@/components/PlaceholderPage"; // For dummy sidebar pages

// 1. Import your new layout and pages
// import DashboardLayout from "@/components/dashboard/DashboardLayout";

// 2. Import all the new dummy pages
import AiLabPage from "@/pages/AiLabPage";
import RoomsPage from "@/pages/RoomsPage";
import LeaderboardPage from "@/pages/LeaderBoardPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import TeamsPage from "@/pages/TeamsPage";
import SettingsPage from "@/pages/SettingsPage";

/**
 * A component to protect routes that require authentication.
 */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = useAuth((state) => state.user);
  const loading = useAuth((state) => state.loading);
  const fetchProfile = useAuth((state) => state.fetchProfile);
  const hasLoaded = useAuth((state) => state.hasLoaded); // <-- 1. GET hasLoaded
  const location = useLocation();

  useEffect(() => {
    // Only fetch profile if it hasn't been loaded on app start.
    // We also check !loading to prevent race conditions.
    if (!hasLoaded && !loading) {
      // <-- 2. UPDATE CONDITION
      fetchProfile();
    }
  }, [hasLoaded, loading, fetchProfile]); // <-- 3. UPDATE DEPENDENCIES

  // Show loading screen if we're actively loading OR if we haven't finished the initial load.
  if (loading || !hasLoaded) {
    // <-- 4. UPDATE LOADING CHECK
    return (
      <div className="min-h-screen bg-[#0b0f17] text-white grid place-items-center">
        Loading session...
      </div>
    );
  }

  if (!user) {
    // Now this only runs AFTER hasLoaded is true and loading is false.
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
}
/**
 * A component to handle routes that should only be visible to logged-out users,
 * like login and signup.
 */
function PublicOnly({ children }: { children: React.ReactNode }) {
  // 👈 2. FIX: Changed type to React.ReactNode
  const { user } = useAuth();

  if (user) {
    // Redirect them to the dashboard if they are already logged in.
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

/**
 * Main application router.
 */ export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* === Public Routes === */}
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/login"
          element={
            <PublicOnly>
              <Login />
            </PublicOnly>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicOnly>
              <Signup />
            </PublicOnly>
          }
        />

        {/* === Protected Dashboard Routes === */}
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <AppLayout>
                <DashboardLayout />
              </AppLayout>
            </RequireAuth>
          }
        >
          {/* This is the new nested structure */}
          <Route index element={<Navigate to="team" replace />} />
          <Route path="team" element={<ParticipantDashboard />} />
          <Route path="spectate" element={<SpectatorDashboard />} />

          {/* 4. Use your new dummy pages */}
          <Route path="ai-lab" element={<AiLabPage />} />
          <Route path="rooms" element={<RoomsPage />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="teams" element={<TeamsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
