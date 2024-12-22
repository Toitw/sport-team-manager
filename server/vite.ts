
import express, { type Express } from "express";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function setupVite(app: Express) {
  app.use(express.static(path.resolve(__dirname, "../client/dist")));
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(__dirname, "../client/dist/index.html"));
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "../client/dist");
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
