import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { createServer } from "http";
import { db, sql } from "../db";

function log(message: string) {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [express] ${message}`);
}

async function testDatabaseConnection(retries = 5, delay = 2000): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      log(`Attempting database connection (attempt ${i + 1}/${retries})...`);
      await db.execute(sql`SELECT NOW()`);
      log('Database connection successful!');
      return true;
    } catch (error) {
      log(`Database connection attempt ${i + 1} failed: ${error}`);
      if (i < retries - 1) {
        log(`Retrying in ${delay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  return false;
}

async function startServer() {
  try {
    // Initialize database connection first with retries
    log('Initializing database connection...');
    const isConnected = await testDatabaseConnection();
    if (!isConnected) {
      throw new Error('Failed to establish database connection after multiple attempts');
    }
    log('Database connection established successfully');

    // Initialize express app
    log('Initializing express application...');
    const app = express();

    // Basic middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));

    // Logging middleware
    app.use((req, res, next) => {
      const start = Date.now();
      res.on("finish", () => {
        const duration = Date.now() - start;
        if (req.path.startsWith("/api")) {
          log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
        }
      });
      next();
    });

    // Register API routes
    log('Registering API routes...');
    await registerRoutes(app);

    // Set up Vite or static serving
    log('Setting up Vite/static serving...');
    const server = createServer(app);

    if (process.env.NODE_ENV === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      log(`Error: ${status} - ${message}`);
      res.status(status).json({ message });
    });

    // Start server
    const port = 3000;
    server.listen(port, "0.0.0.0", () => {
      log(`Server started successfully on port ${port}`);
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

    return server;
  } catch (error) {
    log(`Failed to initialize server: ${error}`);
    process.exit(1); // Exit if we can't start the server
  }
}

// Start the server
startServer().catch((error) => {
  log(`Server startup failed: ${error}`);
  process.exit(1);
});