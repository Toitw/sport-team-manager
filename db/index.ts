import { drizzle } from "drizzle-orm/neon-serverless";
import { sql } from "drizzle-orm";
import type { NeonDatabase } from 'drizzle-orm/neon-serverless';
import { neon, neonConfig } from '@neondatabase/serverless';
import * as schema from "@db/schema";
import WebSocket from 'ws';

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log('Initializing database connection...');
let db: NeonDatabase<typeof schema>;

try {
  // Configure neon for websocket connections
  neonConfig.fetchConnectionCache = true;
  neonConfig.webSocketConstructor = WebSocket;

  // Create the SQL connection with proper typing
  const sql = neon<any>(process.env.DATABASE_URL);

  // Initialize drizzle with the SQL connection
  db = drizzle(sql, { schema }) as NeonDatabase<typeof schema>;

  // Test the connection
  const testConnection = async () => {
    try {
      console.log('Testing database connection...');
      const result = await sql`SELECT 1 as test`;
      if (result[0]?.test === 1) {
        console.log('Database connection established successfully');
      }
    } catch (error) {
      console.error('Database connection test failed:', error);
      throw error;
    }
  };

  // Execute test connection
  testConnection();

} catch (error) {
  console.error('Failed to initialize database:', error);
  throw error;
}

export { db, sql };