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
function RequireAuth({ children }: { children: React.ReactNode }) { // 👈 1. FIX: Changed type to React.ReactNode
  const { user, loading, fetchProfile } = useAuth(
    (state) => ({
      user: state.user,
      loading: state.loading,
      fetchProfile: state.fetchProfile,
    })
  );
  const location = useLocation();

  useEffect(() => {
    // Fetch profile if we don't have a user and aren't already loading
    if (!user && !loading) {
      fetchProfile();
    }
  }, [user, loading, fetchProfile]);

  if (loading) {
    // Show a loading state while checking auth
    return (
      <div className="min-h-screen bg-[#0b0f17] text-white grid place-items-center">
        Loading session...
      </div>
    );
  }

  if (!user) {
    // Redirect them to the landing page if they are not logged in.
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
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}