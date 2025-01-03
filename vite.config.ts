
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import runtimeErrorModal from '@replit/vite-plugin-runtime-error-modal'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react(), runtimeErrorModal()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client/src'),
      '@db': path.resolve(__dirname, 'db')
    }
  },
  root: 'client',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    manifest: true
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    hmr: false,
    watch: {
      usePolling: true,
      interval: 1000
    }
  }
})
