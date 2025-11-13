// File: src/routes/AppHub.tsx
import React from 'react';
import { useAuth } from '@/store/authStore';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

export default function AppHub() {
  const user = useAuth((state) => state.user);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 1. User is a Spectator, send them to the Spectator dashboard
  if (user.role === 'spectator') {
    return <Navigate to="/app/spectator" replace />;
  }

  // 2. User is a Participant
  if (user.role === 'participant') {
    const hasTeam = !!user.teamId;
    // We get agentCount from the store now
    const hasAgents = user.agentCount > 0;

    // 2a. Participant with NO team. Force to create-team.
    if (!hasTeam) {
      if (location.pathname === '/app/create-team') {
        return <Outlet />; // They are on the right page
      }
      return <Navigate to="/app/create-team" replace />;
    }

    // 2b. Participant WITH a team but NO agents. Force to create-agents.
    if (hasTeam && !hasAgents) {
      if (location.pathname === '/app/create-agents') {
        return <Outlet />; // They are on the right page
      }
      return <Navigate to="/app/create-agents" replace />;
    }

    // 2c. Participant WITH a team AND agents.
    // They are fully onboarded. Let them into the main app.
    if (hasTeam && hasAgents) {
      // If they somehow land on an onboarding page, kick them to the dash.
      if (location.pathname === '/app/create-team' || location.pathname === '/app/create-agents') {
         return <Navigate to="/app/team" replace />;
      }
      return <Outlet />; // Render the main participant dashboard
    }
  }

  // Fallback
  return <Navigate to="/login" replace />;
}