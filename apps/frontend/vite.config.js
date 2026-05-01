import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const backendTarget = process.env.VITE_BACKEND_URL || 'http://127.0.0.1:3001'
const apiProxy = {
  '/api': {
    target: backendTarget,
    changeOrigin: true,
    secure: false,
  },
  '/socket.io': {
    target: backendTarget,
    changeOrigin: true,
    secure: false,
    ws: true,
  },
}

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    react(),
  ],
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    port: 5173,
    host: true,
    proxy: apiProxy,
  },
  preview: {
    port: 4173,
    host: true,
    proxy: apiProxy,
  },
});
