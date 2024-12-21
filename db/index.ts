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
let db: ReturnType<typeof drizzle>;

// Initialize database connection
export async function initializeDatabase() {
  if (db) {
    return db;
  }

  try {
    // Configure WebSocket for Neon
    neonConfig.webSocketConstructor = WebSocket;
    // @ts-ignore - Known type issue with neonConfig
    neonConfig.useSecureWebSocket = true;

    // Create pool with minimal config
    console.log('Setting up pool configuration...');
    const pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
    });

    // Test basic connection first
    console.log('Testing basic connection...');
    const client = await pool.connect();

    try {
      const result = await client.query('SELECT 1');
      console.log('Basic connection test successful:', result.rows[0]);

      // Initialize Drizzle
      console.log('Initializing Drizzle...');
      db = drizzle(pool, { schema });

      // Test the Drizzle connection
      const drizzleTest = await db.execute(sql`SELECT current_database(), current_user`);
      console.log('Drizzle connection test successful:', drizzleTest.rows[0]);

      return db;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

export { db, sql };