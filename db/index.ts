import { drizzle } from "drizzle-orm/neon-serverless";
import { sql } from "drizzle-orm";
import type { NeonDatabase } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
import * as schema from "@db/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log('Initializing database connection...');
let db: NeonDatabase<typeof schema>;

try {
  // Create the neon SQL connection with pooling
  const sqlConnection = neon(process.env.DATABASE_URL, {
    poolSize: 1,
    connectionTimeoutMillis: 5000,
  });

  // Initialize drizzle with the neon connection and schema
  db = drizzle(sqlConnection, { schema });

  // Test the connection with a simple query
  console.log('Testing database connection...');
  await sqlConnection`SELECT 1`;
  console.log('Database connection established successfully');
} catch (error) {
  console.error('Failed to initialize database:', error);
  throw error;
}

export { db, sql };