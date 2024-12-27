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
    // Initialize express app first
    const app = express();
    const isDev = process.env.NODE_ENV !== 'production';

    // Basic middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));

    // Enhanced CORS configuration with support for both HTTP and HTTPS
    const corsOptions = {
      origin: isDev 
        ? [
            'https://127.0.0.1:5173', 
            'https://localhost:5173', 
            'http://127.0.0.1:5173', 
            'http://localhost:5173',
            // Add Replit-specific domains
            /\.replit\.dev$/
          ]
        : true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: ['Set-Cookie'],
      optionsSuccessStatus: 204
    };

    // Apply CORS before any routes
    app.use(cors(corsOptions));
    app.options('*', cors(corsOptions));

    // Log all requests for debugging
    app.use((req, res, next) => {
      log(`${req.method} ${req.path} - Origin: ${req.headers.origin || 'unknown'}`);
      next();
    });

    // Health check endpoint that doesn't require database
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Test database connection
    log('Testing database connection...');
    const isConnected = await testDatabaseConnection();
    if (!isConnected) {
      throw new Error('Failed to establish database connection after multiple attempts');
    }

    // Set up authentication after database connection is confirmed
    log('Setting up authentication...');
    await setupAuth(app);
    log('Authentication setup complete');

    // Register API routes
    log('Registering routes...');
    await registerRoutes(app);
    log('Routes registered successfully');

    // Set up static serving
    const server = createServer(app);
    serveStatic(app);

    // Enhanced error handling middleware
    app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
      const errorDetails = {
        message: err.message,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      };

      log(`Error: ${JSON.stringify(errorDetails)}`);

      if (err.status === 401) {
        res.status(401).json({ message: "Unauthorized: Please log in" });
      } else if (err.status === 403) {
        res.status(403).json({ message: "Forbidden: Insufficient permissions" });
      } else {
        res.status(err.status || 500).json({ 
          message: isDev ? err.message : "Internal Server Error",
          ...(isDev ? { details: errorDetails } : {})
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