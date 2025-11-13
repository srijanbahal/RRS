// File: src/lib/api.ts
import { useAuth } from '@/store/authStore';

// All your backend routes are proxied under /api
const API_PREFIX = '/api';

/**
 * A central fetch wrapper that handles auth tokens and errors.
 */
const apiFetch = async (path: string, options: RequestInit = {}) => {
  // Get token directly from the store's state
  const token = useAuth.getState().token;
  
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_PREFIX}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorData = { detail: 'API request failed' };
    try {
      // Try to parse the error from the backend
      errorData = await res.json();
    } catch (e) {
      // Ignore if response is not JSON
    }
    // Throw the specific error message from the backend
    throw new Error(errorData.detail);
  }

  if (res.status === 204) { // No Content
    return null;
  }
  
  return res.json();
};

// --- API Route Definitions ---

export const api = {
  // 1. AUTH
  auth: {
    getMe: () => apiFetch('/auth/protected'),
  },

  // 2. TEAMS
  teams: {
    create: (data: { name: string; slug: string; }) => 
      apiFetch('/teams', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getMyTeam: () => apiFetch('/teams/me'),
    getById: (teamId: string) => apiFetch(`/teams/${teamId}`),
  },

  // 3. AGENTS
  agents: {
    // --- THIS IS THE FIXED SECTION ---
    // Added personality, model, and config to match your backend payload
    create: (data: {
      name: string;
      type: string;
      provider?: string;
      model?: string;
      personality?: string;
      config?: Record<string, any>;
    }) =>
      apiFetch('/agents', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    // --- END OF FIX ---
      
    getMyAgents: () => apiFetch('/agents/me'),
    getById: (agentId: string) => apiFetch(`/agents/${agentId}`),
  },
  
  // 4. ROOMS
  rooms: {
    create: (data: { name: string; circuit_id: string; max_players: number; }) =>
      apiFetch('/rooms', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    join: (roomId: string, agentId: string) =>
      apiFetch(`/rooms/${roomId}/join`, {
        method: 'POST',
        body: JSON.stringify({ agent_id: agentId }),
      }),
    getById: (roomId: string) => apiFetch(`/rooms/${roomId}`),
    list: () => apiFetch('/rooms'),
  },
  
  // 5. RACES
  races: {
    list: () => apiFetch('/races'),
    getById: (raceId: string) => apiFetch(`/races/${raceId}`),
    getLeaderboard: (raceId: string) => apiFetch(`/races/${raceId}/leaderboard`),
    stop: (raceId: string) => apiFetch(`/races/${raceId}/stop`, { method: 'POST' }),
    getDashboardSummary: () => apiFetch('/races/summary/dashboard'),
  },
  
  // 6. TELEMETRY
  telemetry: {
    getLatest: (raceId: string) => apiFetch(`/telemetry/${raceId}`),
    clearCache: (raceId: string) => apiFetch(`/telemetry/${raceId}`, { method: 'DELETE' }),
  }
};

// --- WebSocket Helper ---

export const getWebSocketUrl = (raceId: string) => {
  const token = useAuth.getState().token;
  const wsProtocol = window.location.protocol === 'https' ? 'wss' : 'ws';
  const host = window.location.host; // Assumes API is on the same host
  return `${wsProtocol}://${host}/ws/race/${raceId}?token=${token}`;
};