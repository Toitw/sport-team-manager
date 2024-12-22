
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import runtimeErrorModal from '@replit/vite-plugin-runtime-error-modal'

export default defineConfig({
  plugins: [react(), runtimeErrorModal()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@db': path.resolve(__dirname, './db')
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173
  }
})
