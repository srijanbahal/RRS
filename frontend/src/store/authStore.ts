// src/store/authStore.ts
import { create } from "zustand";
import { supabase } from "@/lib/supabaseClient";

export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
  teamId?: string | null;
};

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  hasLoaded: boolean; // <-- ADD THIS
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
  hasLoaded: false, // <-- SET INITIAL VALUE

  setLoading: (b) => set({ loading: b }),
  setError: (e) => set({ error: e, successMessage: null }),
  setSuccess: (msg) => set({ successMessage: msg, error: null }),
  clearMessages: () => set({ error: null, successMessage: null }),

  // When we manually set a session (like on login), we can say we've loaded.
  setSession: (user, token) => set({ user, token, hasLoaded: true }), // <-- UPDATE

  logout: async () => {
    await supabase.auth.signOut();
    // After logout, we know the auth state, so we can set hasLoaded.
    set({ user: null, token: null, hasLoaded: true }); // <-- UPDATE
  },

  fetchProfile: async () => {
    set({ loading: true });
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      // Mark as loaded, even on failure
      set({ user: null, token: null, loading: false, hasLoaded: true }); // <-- UPDATE
      return;
    }
    const { user } = session;
    const authUser: AuthUser = {
      id: user.id,
      email: user.email || "",
      name:
        (user.user_metadata &&
          (user.user_metadata.name || user.user_metadata.full_name)) ||
        null,
      teamId: user.user_metadata?.teamId || null,
    };
    // Mark as loaded on success
    set({ user: authUser, token: session.access_token, loading: false, hasLoaded: true }); // <-- UPDATE
  },
}));