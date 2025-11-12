// frontend copy/src/main.tsx

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// Import the router, not the landing page
import AppRoutes from './routes/AppRoutes.tsx' 

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRoutes /> {/* Render the router */}
  </StrictMode>,
)