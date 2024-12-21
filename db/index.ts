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

  // Set up the WebSocket proxy with fallback port
  const wsProxyPort = process.env.PGPORT || '5432';
  neonConfig.wsProxy = (host) => {
    console.log(`Creating WebSocket proxy for host: ${host} with port: ${wsProxyPort}`);
    return `${host}:${wsProxyPort}`;
  };

  // Parse and validate database URL
  const dbUrl = new URL(process.env.DATABASE_URL);
  console.log('Database connection details:', {
    host: dbUrl.hostname,
    port: dbUrl.port || wsProxyPort,
    ssl: true
  });

  // Initialize the connection pool with all necessary configurations
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: true,
      requestCert: true
    },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    allowExitOnIdle: true
  });

  console.log('Initializing Drizzle with pool...');
  db = drizzle(pool, { schema });

  // Test the connection with retries
  const testConnection = async (retries = 5, delay = 2000) => {
    for (let i = 0; i < retries; i++) {
      try {
        console.log(`Testing database connection (attempt ${i + 1}/${retries})...`);

        // Basic connectivity test
        const result = await pool.query('SELECT NOW()');
        console.log('Basic connectivity test successful:', result.rows[0]);

        // Test SSL status
        const sslResult = await pool.query('SHOW ssl');
        console.log('SSL Status:', sslResult.rows[0]);

        // Test connection parameters
        const paramResult = await pool.query(`
          SELECT 
            current_database() as database,
            current_user as user,
            inet_server_addr() as server_addr,
            inet_server_port() as server_port,
            ssl_is_used() as using_ssl,
            version() as version
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

  // Add event handlers for the pool
  pool.on('connect', () => {
    console.log('New client connected to the pool');
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });

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