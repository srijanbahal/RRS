// File: src/main.tsx

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppRoutes from './routes/AppRoutes.tsx' 
import { supabase } from './lib/supabaseClient' // 1. Import supabase
import { useAuth } from './store/authStore'     // 2. Import your auth store

// 3. SET UP THE GLOBAL AUTH LISTENER
// This code will run once when your app first loads.
supabase.auth.onAuthStateChange((event, session) => {
  // Get the actions from your zustand store
  const { fetchProfile, setSession } = useAuth.getState();
  
  if (event === 'SIGNED_IN') {
    // This event fires when the user logs in, OR
    // when they click the confirmation link (like you just did).
    console.log('onAuthStateChange: SIGNED_IN. Fetching user profile...');
    
    // We call fetchProfile() because it not only gets the session
    // but also fetches their 'role' and 'teamId' from your 'public.users' table.
    // This is the correct way to load the full user.
    fetchProfile(); 
    
  } else if (event === 'SIGNED_OUT') {
    // This event fires when the user logs out.
    console.log('onAuthStateChange: SIGNED_OUT.');
    
    // We clear the user from the store.
    setSession(null, null);
    
  } else if (event === 'TOKEN_REFRESHED') {
    // This happens automatically in the background.
    console.log('onAuthStateChange: TOKEN_REFRESHED.');
    
    // We can re-fetch the profile to ensure all data is in sync.
    fetchProfile();
  }
});

// This is your existing code
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRoutes />
  </StrictMode>,
)