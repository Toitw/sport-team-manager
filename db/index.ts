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
    console.log('Using existing database connection');
    return db;
  }

  try {
    // Configure WebSocket for Neon
    console.log('Configuring WebSocket for Neon...');
    neonConfig.webSocketConstructor = WebSocket;
    // @ts-ignore - Known type issue with neonConfig
    neonConfig.useSecureWebSocket = true;

    // Create pool with minimal config
    console.log('Creating connection pool...');
    const pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 5000, // 5 second timeout
      max: 20 // Maximum number of clients in the pool
    });

    // Test basic connection first
    console.log('Testing database connection...');
    const client = await pool.connect();

    try {
      // Test basic connectivity
      console.log('Executing basic query test...');
      const result = await client.query('SELECT current_database(), current_user, version()');
      console.log('Database connection test successful:', {
        database: result.rows[0].current_database,
        user: result.rows[0].current_user,
        version: result.rows[0].version
      });

      // Initialize Drizzle
      console.log('Initializing Drizzle ORM...');
      db = drizzle(pool, { schema });

      // Test Drizzle connection
      console.log('Testing Drizzle connection...');
      const drizzleTest = await db.execute(sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        LIMIT 1
      `);
      console.log('Drizzle connection test successful:', {
        tableCount: drizzleTest.rows.length,
        firstTable: drizzleTest.rows[0]?.table_name
      });

      return db;
    } catch (error) {
      console.error('Error during database initialization:', error);
      throw error;
    } finally {
      console.log('Releasing test connection...');
      client.release();
    }
  } catch (error) {
    console.error('Critical database initialization error:', error);
    // Log additional connection details (without sensitive info)
    console.error('Connection details:', {
      host: process.env.PGHOST,
      database: process.env.PGDATABASE,
      port: process.env.PGPORT,
      user: process.env.PGUSER,
      // Don't log the password
    });
    throw error;
  }
}

export { db, sql };