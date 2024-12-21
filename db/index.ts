import { drizzle } from "drizzle-orm/neon-serverless";
import { sql } from "drizzle-orm";
import { Pool, PoolConfig } from '@neondatabase/serverless';
import * as schema from "@db/schema";
import WebSocket from 'ws';

// Ensure DATABASE_URL is present
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

console.log('Initializing database connection...');
let db: ReturnType<typeof drizzle>;

try {
  console.log('Setting up database pool configuration...');

  // Define pool configuration with proper types
  const poolConfig: Partial<PoolConfig> & { wsProxy?: (url: string) => WebSocket } = {
    connectionString: process.env.DATABASE_URL,
    ssl: true
  };

  // Add WebSocket proxy configuration
  poolConfig.wsProxy = (url: string) => {
    console.log('Creating WebSocket connection to:', url);
    return new WebSocket(url, {
      rejectUnauthorized: false,
      headers: {
        'User-Agent': 'neon-serverless'
      }
    });
  };

  // Initialize pool with configuration
  const pool = new Pool(poolConfig);

  console.log('Initializing Drizzle with pool...');
  // Initialize Drizzle with the pool
  db = drizzle(pool, { schema });

  // Test the connection
  const testConnection = async () => {
    try {
      console.log('Testing database connection...');
      const result = await pool.query('SELECT NOW()');
      console.log('Database connection test successful:', result.rows[0]);
      return result;
    } catch (error) {
      console.error('Database connection test failed:', error);
      throw error;
    }
  };

  // Execute test connection
  testConnection()
    .then(() => {
      console.log('Database connection established successfully');
    })
    .catch((error) => {
      console.error('Failed to test database connection:', error);
      process.exit(1);
    });

} catch (error) {
  console.error('Failed to initialize database:', error);
  throw error;
}

export { db, sql };