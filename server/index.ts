import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { createServer } from "http";
import { db, initializeDatabase, sql } from "../db";
import type { QueryResult } from '@neondatabase/serverless';
import { setupAuth } from "./auth";

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

      // Wait for database initialization
      const dbInstance = await initializeDatabase();

      // Basic connectivity test
      const result = await dbInstance.execute(sql`SELECT NOW()`) as QueryResult<{ now: Date }>;
      log('Database connection successful!');
      log(`Connection timestamp: ${result.rows[0]?.now}`);

      return true;
    } catch (error: any) {
      const errorMessage = error.message || error.toString();
      log(`Database connection attempt ${i + 1} failed: ${errorMessage}`);

      if (error.code === 'ECONNRESET' || error.code === 'EPIPE') {
        log('Connection was reset. This might be due to network issues or firewall settings.');
      }

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

    // Set up authentication
    log('Setting up authentication...');
    setupAuth(app);

    // Register API routes
    log('Registering API routes...');
    await registerRoutes(app);

    // Set up static serving
    log('Setting up static serving...');
    const server = createServer(app);
    serveStatic(app);
    log('Static serving setup completed');

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      log(`Error: ${status} - ${message}`);
      res.status(status).json({ message });
    });

    // Start server
    const port = process.env.PORT || 80;
    await new Promise<void>((resolve, reject) => {
      server.listen(port, "0.0.0.0", () => {
        log(`Server started successfully on port ${port}`);
        resolve();
      });

      server.on('error', (error: any) => {
        log(`Failed to start server: ${error}`);
        reject(error);
      });
    });

    return server;
  } catch (error) {
    log(`Failed to initialize server: ${error}`);
    process.exit(1);
  }
}

// Start the server
startServer().catch((error) => {
  log(`Server startup failed: ${error}`);
  process.exit(1);
});