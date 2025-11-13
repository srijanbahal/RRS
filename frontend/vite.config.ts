// File: vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
    tailwindcss()
  ],
  resolve: { 
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      // This will proxy any request starting with /api
      // to your backend server.
      '/api': {
        target: 'http://localhost:8000', 
        changeOrigin: true,
        secure: false, 
        
        // --- THIS IS THE FIX ---
        // This removes '/api' from the path before sending it to your backend
        // e.g., /api/teams -> /teams
        rewrite: (path) => path.replace(/^\/api/, ''),
        // --- END OF FIX ---
      }
    }
  }
})