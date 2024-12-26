import { drizzle } from "drizzle-orm/neon-serverless";
import { sql } from "drizzle-orm";
import { Pool, neonConfig } from '@neondatabase/serverless';
import * as schema from "./schema";
import WebSocket from 'ws';

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = WebSocket;

// Ensure DATABASE_URL is present
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Singleton instances
let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

// Create database pool with retries
async function createPool(retries = 3): Promise<Pool> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (!pool) {
        console.log(`Creating database pool (attempt ${attempt}/${retries})...`);
        pool = new Pool({
          connectionString: DATABASE_URL,
          connectionTimeoutMillis: 5000,
          maxUses: 10000,
          max: 10
        });

        // Test the pool
        const client = await pool.connect();
        try {
          await client.query('SELECT 1');
          console.log('Database pool created successfully');
          return pool;
        } finally {
          client.release();
        }
      }
      return pool;
    } catch (error) {
      console.error(`Failed to create pool (attempt ${attempt}/${retries}):`, error);
      if (pool) {
        await pool.end();
        pool = null;
      }
      if (attempt === retries) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  throw new Error('Failed to create database pool after retries');
}

// Get database instance with connection handling
export async function getDb() {
  try {
    if (db) return db;

    // Create pool if needed
    const pool = await createPool();

    // Initialize Drizzle
    console.log('Initializing Drizzle ORM...');
    db = drizzle(pool, { schema });

    // Verify Drizzle connection
    await db.execute(sql`SELECT current_database(), current_user`);
    console.log('Database connection established successfully');

    return db;
  } catch (error) {
    console.error('Database initialization error:', error);

    // Clean up on error
    if (pool) {
      await pool.end();
      pool = null;
    }
    db = null;
    throw error;
  }
}

// Graceful shutdown helper
export async function closeDatabase() {
  if (pool) {
    console.log('Closing database pool...');
    await pool.end();
    pool = null;
    db = null;
  }
}

export { sql };