import { drizzle } from "drizzle-orm/neon-serverless";
import { sql } from "drizzle-orm";
import type { NeonDatabase } from 'drizzle-orm/neon-serverless';
import { neon, neonConfig } from '@neondatabase/serverless';
import * as schema from "@db/schema";
import WebSocket from 'ws';

// Ensure DATABASE_URL is present
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

console.log('Initializing database connection...');
let db: NeonDatabase<typeof schema>;

try {
  // Configure neon for websocket connections
  neonConfig.webSocketConstructor = WebSocket;

  // Create the neon client with the correct configuration
  const client = neon(process.env.DATABASE_URL!);

  // Initialize drizzle with the neon client and schema
  db = drizzle(client, { schema });

  // Test the connection
  const testConnection = async () => {
    try {
      console.log('Testing database connection...');
      const result = await client`SELECT NOW()`;
      console.log('Database connection test successful:', result);
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