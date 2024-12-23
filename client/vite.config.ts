import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@db': path.resolve(__dirname, '../db')
    }
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.NODE_ENV === 'production' 
          ? 'https://' + process.env.REPL_SLUG + '.' + process.env.REPL_OWNER + '.repl.co'
          : 'http://0.0.0.0:80',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  },
  css: {
    postcss: path.resolve(__dirname, "postcss.config.js")
  }
});