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
  successMessage: string | null; // <-- ADDED
  setLoading: (b: boolean) => void;
  setError: (e: string | null) => void;
  setSuccess: (msg: string | null) => void; // <-- ADDED
  clearMessages: () => void; // <-- ADDED
  setSession: (u: AuthUser | null, t: string | null) => void;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: false,
  error: null,
  successMessage: null, // <-- ADDED

  setLoading: (b) => set({ loading: b }),
  // Updated to clear success on new error
  setError: (e) => set({ error: e, successMessage: null }),
  // Added for success messages, clears error
  setSuccess: (msg) => set({ successMessage: msg, error: null }),
  // Added to clear both messages
  clearMessages: () => set({ error: null, successMessage: null }),

  setSession: (user, token) => set({ user, token }),

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, token: null });
  },

  fetchProfile: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      set({ user: null, token: null });
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
    set({ user: authUser, token: session.access_token });
  },
}));