// File: src/store/authStore.ts
import { create } from "zustand";
import { supabase } from "@/lib/supabaseClient";

export type UserRole = "spectator" | "participant";

export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
  teamId?: string | null; // This will come from the 'teams' table
  role: UserRole;
  agentCount: number; // We keep this for the onboarding flow
};

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  hasLoaded: boolean;
  setLoading: (b: boolean) => void;
  setError: (e: string | null) => void;
  setSuccess: (msg: string | null) => void;
  clearMessages: () => void;
  setSession: (u: AuthUser | null, t: string | null) => void;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: false,
  error: null,
  successMessage: null,
  hasLoaded: false,

  setLoading: (b) => set({ loading: b }),
  setError: (e) => set({ error: e, successMessage: null }),
  setSuccess: (msg) => set({ successMessage: msg, error: null }),
  clearMessages: () => set({ error: null, successMessage: null }),

  setSession: (user, token) => set({ user, token, hasLoaded: true }),

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, token: null, hasLoaded: true });
  },

  // THIS IS THE FULLY CORRECTED fetchProfile
  fetchProfile: async () => {
    set({ loading: true });
    const {
      data: { session },
    } = await supabase.auth.getSession();
    
    if (!session) {
      set({ user: null, token: null, loading: false, hasLoaded: true });
      return;
    }
    const { user: authUser } = session;

    // --- Start of Fix ---
    
    // Step 1: Fetch the user's role from your 'public.users' table
    let profileRole: UserRole = "spectator";
    let profileName: string | null = null;
    let profileTeamId: string | null = null;
    let profileAgentCount: number = 0;
    
    // Your 'users' table schema
    const { data: profileData, error: profileError } = await supabase
      .from('users') 
      .select('name, role') 
      .eq('id', authUser.id)
      .single();

    if (profileError) {
      // This is normal if the trigger hasn't run yet, but log it
      console.warn("Could not fetch user profile (might be new user):", profileError.message);
      // We might still have the role from the JWT metadata, but we'll rely on the DB
    }

    if (profileData) {
      profileRole = profileData.role;
      profileName = profileData.name;
    }

    // Step 2: IF the user is a participant, find their team ID
    if (profileRole === 'participant') {
      // Your 'teams' table schema
      const { data: teamData, error: teamError } = await supabase
        .from('teams') 
        .select('id') // We only need the team's ID
        .eq('owner_id', authUser.id) // Match it using the user's ID
        .single();
      
      if (teamData) {
        profileTeamId = teamData.id;

        // Step 3: IF they have a team, get their agent count
        // Your 'agents' table schema
        const { count, error: agentError } = await supabase
          .from('agents')
          .select('id', { count: 'exact', head: true }) // Performant count
          .eq('team_id', profileTeamId);

        if (agentError) {
          console.warn("Could not fetch agent count:", agentError.message);
        }
        
        profileAgentCount = count || 0;
      }
    }
    // --- End of Fix ---
    
    const user: AuthUser = {
      id: authUser.id,
      email: authUser.email || "",
      name: profileName || authUser.user_metadata?.name || null,
      teamId: profileTeamId, 
      role: profileRole,    
      agentCount: profileAgentCount,
    };
    
    set({ user, token: session.access_token, loading: false, hasLoaded: true });
  },
}));