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
import LandingPage from "@/App";
import DashboardPage from "@/pages/dashboard/DashboardPage";

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
    if (!hasLoaded && !loading) { // <-- 2. UPDATE CONDITION
      fetchProfile();
    }
  }, [hasLoaded, loading, fetchProfile]); // <-- 3. UPDATE DEPENDENCIES

  // Show loading screen if we're actively loading OR if we haven't finished the initial load.
  if (loading || !hasLoaded) { // <-- 4. UPDATE LOADING CHECK
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
function PublicOnly({ children }: { children: React.ReactNode }) { // 👈 2. FIX: Changed type to React.ReactNode
  const { user } = useAuth();

  if (user) {
    // Redirect them to the dashboard if they are already logged in.
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

/**
 * Main application router.
 */
export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
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

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            // <RequireAuth>
              <DashboardPage />
            // </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}