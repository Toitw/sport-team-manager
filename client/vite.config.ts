
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import runtimeErrorModal from "@replit/vite-plugin-runtime-error-modal";
import checker from "vite-plugin-checker";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV !== 'production';

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorModal(),
    checker({
      typescript: true,
      enableBuild: false,
      overlay: true,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@db": path.resolve(__dirname, "../db"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    hmr: {
      clientPort: 443,
      protocol: 'wss',
      host: process.env.REPL_SLUG + '.' + process.env.REPL_OWNER + '.repl.co'
    },
    proxy: {
      '/api': {
        target: 'http://0.0.0.0:3000',
        changeOrigin: true,
        secure: false,
        ws: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
});
