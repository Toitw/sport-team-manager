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

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

(async () => {
  registerRoutes(app);
  const server = createServer(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const PORT = parseInt(process.env.PORT || "3000", 10);
  
  // Add a proper error handler before starting the server
  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
  });

  process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    process.exit(1);
  });

  // More robust server startup
  function startServer(port: number): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        server.listen(port, "0.0.0.0", () => {
          const address = server.address();
          const actualPort = typeof address === "object" && address ? address.port : port;
          log(`Server is running on port ${actualPort}`);
          resolve();
        }).on("error", (error: NodeJS.ErrnoException) => {
          if (error.code === "EADDRINUSE") {
            log(`Port ${port} is in use, trying ${port + 1}`);
            server.close();
            startServer(port + 1).then(resolve).catch(reject);
          } else {
            log(`Error starting server: ${error.message}`);
            reject(error);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  // Start the server with error handling
  await startServer(PORT).catch((error) => {
    log(`Failed to start server: ${error.message}`);
    process.exit(1);
  });
})();
