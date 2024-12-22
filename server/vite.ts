import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { type Server } from "http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function setupVite(app: Express, server: Server) {
  try {
    const vite = await createViteServer({
      root: path.resolve(__dirname, "../client"),
      server: {
        middlewareMode: true,
        hmr: {
          server,
          port: process.env.HMR_PORT || 5173, // Use dynamic HMR port
        },
      },
      appType: "custom",
    });

    app.use(vite.middlewares);

    // Catch-all route for Vite
    app.use("*", async (req, res, next) => {
      try {
        const url = req.originalUrl;

        // Read and transform the index.html file
        const template = await fs.promises.readFile(
          path.resolve(__dirname, "../client/index.html"),
          "utf-8",
        );
        const page = await vite.transformIndexHtml(url, template);

        res.status(200).set({ "Content-Type": "text/html" }).end(page);
      } catch (error) {
        console.error("[Vite] Error transforming HTML:", error);
        next(error);
      }
    });

    console.log("[Vite] Development middleware initialized.");
  } catch (error) {
    console.error("[Vite] Error setting up Vite server:", error);
    throw error;
  }
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "../client/dist");

  if (!fs.existsSync(distPath)) {
    console.error("[Static] Build directory not found:", distPath);
    throw new Error(`Build directory not found: ${distPath}`);
  }

  // Serve static files from the dist folder
  app.use(express.static(distPath));

  // Catch-all route for serving index.html
  app.use("*", (_req, res) => {
    try {
      res.sendFile(path.resolve(distPath, "index.html"));
    } catch (error) {
      console.error("[Static] Error serving static files:", error);
      res.status(500).send("An error occurred while serving the application.");
    }
  });

  console.log("[Static] Serving files from dist directory:", distPath);
}

export function setupEnvironment(app: Express, server: Server) {
  if (process.env.NODE_ENV === "production") {
    console.log("[App] Running in production mode.");
    serveStatic(app);
  } else {
    console.log("[App] Running in development mode.");
    setupVite(app, server).catch((error) => {
      console.error("[App] Failed to set up Vite middleware:", error);
    });
  }
}
