import { drizzle } from "drizzle-orm/neon-serverless";
import { sql } from "drizzle-orm";
import { Pool, neonConfig } from '@neondatabase/serverless';
import * as schema from "@db/schema";
import WebSocket from 'ws';

// Ensure DATABASE_URL is present
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

console.log('Initializing database connection...');

// Create and export a single database instance
let db: ReturnType<typeof drizzle>;

// Initialize the database connection
export async function getDb() {
  if (!db) {
    db = await initializeDatabase();
  }
  return db;
}

// Initialize database connection
async function initializeDatabase() {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL is not defined");
    }

    // Log the connection attempt
    console.log('Attempting to initialize database connection...');
    const url = new URL(databaseUrl);
    console.log('Database connection details:', {
      host: url.hostname,
      database: url.pathname.slice(1),
      ssl: true
    });

    // Configure WebSocket for Neon
    console.log('Configuring WebSocket for Neon...');
    neonConfig.webSocketConstructor = WebSocket;
    // @ts-ignore - Known type issue with neonConfig
    neonConfig.useSecureWebSocket = true;

    // Create pool with minimal config
    console.log('Creating connection pool...');
    const pool = new Pool({ 
      connectionString: databaseUrl,
      connectionTimeoutMillis: 10000, // Increased timeout to 10 seconds
      max: 20 // Maximum number of clients in the pool
    });

    // Initialize Drizzle
    console.log('Initializing Drizzle ORM...');
    const dbInstance = drizzle(pool, { schema });

    // Test Drizzle connection with timeout
    console.log('Testing Drizzle connection...');
    const drizzleTest = await Promise.race([
      dbInstance.execute(sql`SELECT current_database(), current_user, version()`),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Drizzle connection test timeout')), 5000)
      )
    ]);

    console.log('Database connection established successfully');
    return dbInstance;
  } catch (error) {
    console.error('Critical database initialization error:', error);
    // Log additional connection details (without sensitive info)
    if (process.env.DATABASE_URL) {
      const url = new URL(process.env.DATABASE_URL);
      console.error('Connection details:', {
        host: url.hostname,
        database: url.pathname.slice(1),
        ssl: true
      });
    }
    throw error;
  }
}

export { sql };
export default { getDb };