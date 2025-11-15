// File: src/main.tsx

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './App.css' // <-- 1. CHANGE THIS from './index.css'
import AppRoutes from './routes/AppRoutes.tsx' 
import { supabase } from './lib/supabaseClient' 
import { useAuth } from './store/authStore'     

// ... (rest of the file remains the same) ...

supabase.auth.onAuthStateChange((event, session) => {
  const { fetchProfile, setSession } = useAuth.getState();
  
  if (event === 'SIGNED_IN') {
    console.log('onAuthStateChange: SIGNED_IN. Fetching user profile...');
    fetchProfile(); 
  } else if (event === 'SIGNED_OUT') {
    console.log('onAuthStateChange: SIGNED_OUT.');
    setSession(null, null);
  } else if (event === 'TOKEN_REFRESHED') {
    console.log('onAuthStateChange: TOKEN_REFRESHED.');
    fetchProfile();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRoutes />
  </StrictMode>,
)