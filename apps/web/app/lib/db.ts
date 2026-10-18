import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { schema } from '@pakar-talenta/db';

type AppDatabase = NodePgDatabase<typeof schema>;

let pool: Pool | undefined;
let db: AppDatabase | undefined;

/**
 * Lazily creates a pooled Drizzle client bound to the Pakar Talenta schema.
 * Reuses the connection across requests for efficiency.
 */
export function getDb(): AppDatabase {
  if (!db) {
    const connectionString = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('POSTGRES_URL must be set');
    }
    pool = new Pool({ connectionString });
    db = drizzle(pool, { schema });
  }
  return db;
}

/** Closes the database connection (useful for tests/scripts). */
export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = undefined;
    db = undefined;
  }
}
