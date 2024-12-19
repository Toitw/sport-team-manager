import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { createServer } from "http";

function log(message: string) {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [express] ${message}`);
}

async function startServer() {
  try {
    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));

    // Logging middleware
    app.use((req, res, next) => {
      const start = Date.now();
      const path = req.path;
      let capturedJsonResponse: Record<string, any> | undefined = undefined;

      const originalResJson = res.json;
      res.json = function (bodyJson, ...args) {
        capturedJsonResponse = bodyJson;
        return originalResJson.apply(res, [bodyJson, ...args]);
      };

      res.on("finish", () => {
        const duration = Date.now() - start;
        if (path.startsWith("/api")) {
          let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
          if (capturedJsonResponse) {
            logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
          }

          if (logLine.length > 80) {
            logLine = logLine.slice(0, 79) + "…";
          }

          log(logLine);
        }
      });

      next();
    });

    // Register API routes
    registerRoutes(app);
    const server = createServer(app);

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      log(`Error: ${status} - ${message}`);
      res.status(status).json({ message });
    });

    // Set up Vite or static serving
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    const port = parseInt(process.env.PORT || "3000", 10);

    return new Promise<void>((resolve, reject) => {
      server.listen(port, "0.0.0.0", () => {
        const address = server.address();
        const actualPort = typeof address === 'object' && address ? address.port : port;
        log(`Server started successfully on port ${actualPort}`);
        resolve();
      }).on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
          log(`Port ${port} is already in use. Trying port ${port + 1}`);
          server.listen(port + 1, "0.0.0.0", () => {
            const address = server.address();
            const actualPort = typeof address === 'object' && address ? address.port : port + 1;
            log(`Server started successfully on port ${actualPort}`);
            resolve();
          });
        } else {
          log(`Failed to start server: ${err.message}`);
          reject(err);
        }
      });

      // Graceful shutdown handlers
      const shutdown = () => {
        server.close(() => {
          log('Server shut down gracefully');
          process.exit(0);
        });
      };

      process.on('SIGTERM', () => {
        log('Received SIGTERM signal');
        shutdown();
      });

      process.on('SIGINT', () => {
        log('Received SIGINT signal');
        shutdown();
      });
    });
  } catch (error) {
    log(`Failed to initialize server: ${error}`);
    throw error;
  }
}

// Start the server
startServer().catch((error) => {
  log(`Server startup failed: ${error}`);
  process.exit(1);
});