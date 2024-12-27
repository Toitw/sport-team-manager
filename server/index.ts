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
    const app = express();
    const isDev = process.env.NODE_ENV !== 'production';

    // Basic middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));

    // Enhanced CORS configuration for Replit environment
    const corsOptions = {
      origin: function(origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
          log('Allowing request with no origin');
          return callback(null, true);
        }

        // List of allowed origins
        const allowedOrigins = [
          'https://127.0.0.1:5173', 
          'https://localhost:5173', 
          'http://127.0.0.1:5173', 
          'http://localhost:5173',
          'http://localhost:3000',
          'http://0.0.0.0:5173',
          'http://0.0.0.0:3000',
          'http://localhost:5174',  // Add additional Vite ports
          'http://0.0.0.0:5174'
        ];

        // Allow all replit.dev subdomains including the current repl's domain
        if (origin.match(/^https?:\/\/.*\.replit\.dev(:\d+)?$/)) {
          log(`Allowing Replit domain: ${origin}`);
          return callback(null, true);
        }

        // In development mode, allow all local origins
        if (process.env.NODE_ENV === 'development') {
          log(`Development mode: allowing origin ${origin}`);
          return callback(null, true);
        }

        // Check if the origin is in our list of allowed origins
        if (allowedOrigins.includes(origin)) {
          log(`Allowing listed origin: ${origin}`);
          return callback(null, true);
        } else {
          log(`Blocked request from unauthorized origin: ${origin}`);
          return callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Requested-By'],
      exposedHeaders: ['Set-Cookie'],
      maxAge: 600, // Increase preflight cache time to 10 minutes
      optionsSuccessStatus: 204
    };

    // Apply CORS before any routes
    app.use(cors(corsOptions));
    app.options('*', cors(corsOptions));

    // Enhanced logging middleware with timing information
    app.use((req, res, next) => {
      const requestStart = Date.now();
      log(`${req.method} ${req.path} - Origin: ${req.headers.origin || 'unknown'}, Host: ${req.headers.host}`);

      // Log response status and timing on completion
      res.on('finish', () => {
        const duration = Date.now() - requestStart;
        log(`${req.method} ${req.path} - Status: ${res.statusCode} - Duration: ${duration}ms`);
      });

      next();
    });

    // Health check endpoint that doesn't require database
    app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
      });
    });

    // Test database connection with retries
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

    // Set up static serving and server
    const server = createServer(app);
    serveStatic(app);

    // Enhanced error handling middleware with detailed logging
    app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
      const errorDetails = {
        message: err.message,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString(),
        origin: req.headers.origin,
        host: req.headers.host,
        status: err.status || 500
      };

      log(`Error: ${JSON.stringify(errorDetails)}`);

      // Handle specific error types
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
        log(`Server started on port ${port} (http://0.0.0.0:${port})`);
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