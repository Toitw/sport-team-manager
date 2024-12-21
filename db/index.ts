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

try {
  console.log('Setting up database pool configuration...');

  // Configure WebSocket for Neon
  neonConfig.webSocketConstructor = WebSocket;
  neonConfig.useSecureWebSocket = true;
  neonConfig.pipelineConnect = false;

  // Parse and validate database URL
  const dbUrl = new URL(process.env.DATABASE_URL);
  const host = dbUrl.hostname;
  const port = dbUrl.port || "5432";
  console.log('Database connection details:', { host, port });

  // Initialize the connection pool with all necessary configurations
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    ssl: true,
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
  });

  console.log('Initializing Drizzle with pool...');
  db = drizzle(pool, { schema });

  // Test the connection with retries
  const testConnection = async (retries = 5, delay = 2000) => {
    for (let i = 0; i < retries; i++) {
      try {
        console.log(`Testing database connection (attempt ${i + 1}/${retries})...`);

        // Test basic connectivity
        const result = await pool.query('SELECT NOW()');
        console.log('Basic connectivity test successful:', result.rows[0]);

        // Test SSL status
        const sslResult = await pool.query('SHOW ssl');
        console.log('SSL Status:', sslResult.rows[0]);

        // Test schema access
        const schemaResult = await pool.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public'
        `);
        console.log('Available tables:', schemaResult.rows.map(row => row.table_name));

        // Test connection parameters
        const paramResult = await pool.query(`
          SELECT 
            current_database() as database,
            current_user as user,
            inet_server_addr() as server_addr,
            inet_server_port() as server_port
        `);
        console.log('Connection parameters:', paramResult.rows[0]);

        return true;
      } catch (error) {
        console.error(`Database connection attempt ${i + 1} failed:`, error);
        if (i < retries - 1) {
          console.log(`Retrying in ${delay/1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      }
    }
    return false;
  };

  // Test connection on startup
  testConnection()
    .then(() => {
      console.log('Database connection established successfully');
    })
    .catch((error) => {
      console.error('Failed to establish database connection:', error);
      process.exit(1);
    });

} catch (error) {
  console.error('Failed to initialize database:', error);
  throw error;
}

export { db, sql };