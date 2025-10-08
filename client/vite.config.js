import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // 👈 ensures it's accessible on Render or Docker
    port: 5173,      // default for local dev
  },
  preview: {
    host: '0.0.0.0', // 👈 ensures vite preview works on Render
    port: 10000,     // matches your Render start command
  },
})