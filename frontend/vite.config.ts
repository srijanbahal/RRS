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
        // ❗ CHANGE THIS to your backend server's address
        target: 'http://localhost:8000', 
        changeOrigin: true,
        secure: false, // Set to false if your backend is not using HTTPS
      }
    }
  }
})
