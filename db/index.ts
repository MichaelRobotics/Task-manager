import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Load environment variables
const connectionString = process.env.DATABASE_URL || 
  `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'postgres'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5433'}/${process.env.DB_NAME || 'taskmanager'}`;

// Create the connection
const client = postgres(connectionString);

// Create the database instance
export const db = drizzle(client, { schema });

// Export schema for convenience
export * from './schema';








