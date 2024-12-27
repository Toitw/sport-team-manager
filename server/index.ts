import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { createServer } from "http";
import { getDb, sql } from "../db";
import type { QueryResult } from '@neondatabase/serverless';
import { setupAuth } from "./auth";
import cors from 'cors';

function log(message: string) {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [express] ${message}`);
}

async function testDatabaseConnection(retries = 3, delay = 2000): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      log(`Attempting database connection (attempt ${i + 1}/${retries})...`);
      const db = await getDb();
      const result = await db.execute(sql`SELECT NOW()`) as QueryResult<{ now: Date }>;
      log('Database connection successful!');
      log(`Server timestamp: ${result.rows[0]?.now}`);
      return true;
    } catch (error: any) {
      log(`Database connection attempt ${i + 1} failed: ${error.message}`);
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
    const isConnected = await testDatabaseConnection();
    if (!isConnected) {
      throw new Error('Failed to establish database connection after multiple attempts');
    }

    const app = express();
    const isDev = process.env.NODE_ENV !== 'production';

    // Basic middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));

    // CORS configuration with more detailed settings
    app.use(cors({
      origin: true, // Allow all origins in development
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: ['Set-Cookie'],
    }));

    // Pre-flight OPTIONS handler
    app.options('*', cors());

    // Set up authentication
    await setupAuth(app);

    // Health check endpoint
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Register API routes
    await registerRoutes(app);

    // Set up static serving
    const server = createServer(app);
    serveStatic(app);

    // Enhanced error handling middleware
    app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
      console.error('Server error:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
      });

      if (err.status === 401) {
        res.status(401).json({ message: "Unauthorized: Please log in" });
      } else if (err.status === 403) {
        res.status(403).json({ message: "Forbidden: Insufficient permissions" });
      } else {
        res.status(err.status || 500).json({ 
          message: isDev ? err.message : "Internal Server Error"
        });
      }
    });

    // Start server
    const port = process.env.PORT || 3000;
    await new Promise<void>((resolve, reject) => {
      server.listen(port, "0.0.0.0", () => {
        log(`Server started on port ${port}`);
        resolve();
      });

      server.on('error', (error: any) => {
        log(`Failed to start server: ${error.message}`);
        reject(error);
      });
    });

    return server;
  } catch (error: any) {
    log(`Server initialization failed: ${error.message}`);
    throw error;
  }
}

// Start the server
startServer().catch((error) => {
  log(`Fatal server error: ${error.message}`);
  process.exit(1);
});