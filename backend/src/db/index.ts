import dotenv from 'dotenv';
dotenv.config({ override: true });
import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from './schema.ts';

function checkDatabaseConfigured(): boolean {
  const url = process.env.DATABASE_URL || '';
  const host = process.env.SQL_HOST || '';
  const pass = process.env.SQL_PASSWORD || '';
  const user = process.env.SQL_USER || '';
  const dbName = process.env.SQL_DB_NAME || '';

  const isPlaceholder = (val: string) =>
    !val ||
    val.includes('your_db_password') ||
    val.includes('your_secure_db_password') ||
    val.includes('your_password') ||
    val.includes('<') ||
    val.includes('placeholder') ||
    val.trim() === 'mock';

  if (url) {
    if (isPlaceholder(url)) return false;
    return true;
  }

  if (host && user && pass && dbName) {
    if (isPlaceholder(pass) || isPlaceholder(host) || isPlaceholder(user)) return false;
    return true;
  }

  return false;
}

export const isDatabaseConfigured = checkDatabaseConfigured();

// Function to create a new connection pool.
export const createPool = () => {
  const connectionString = process.env.DATABASE_URL;
  const hasSqlConfig = Boolean(
    process.env.SQL_HOST &&
    process.env.SQL_USER &&
    process.env.SQL_PASSWORD &&
    process.env.SQL_DB_NAME
  );

  // Supabase session poolers enforce comparatively small connection limits.  A
  // small application pool prevents concurrent startup reads/syncs from
  // exhausting those sessions and makes every connection reusable.
  const max = Number(process.env.DB_POOL_MAX) || 3;
  const connectionTimeoutMillis = Number(process.env.DB_CONNECTION_TIMEOUT_MS) || 30000;
  const idleTimeoutMillis = Number(process.env.DB_IDLE_TIMEOUT_MS) || 30000;
  const maxLifetimeSeconds = Number(process.env.DB_MAX_LIFETIME_SECONDS) || 300;

  if (isDatabaseConfigured && hasSqlConfig) {
    return new Pool({
      host: process.env.SQL_HOST,
      port: process.env.SQL_PORT ? Number(process.env.SQL_PORT) : 5432,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      connectionTimeoutMillis,
      ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
      max,
      min: 0,
      idleTimeoutMillis,
      maxLifetimeSeconds,
      keepAlive: true,
      keepAliveInitialDelayMillis: 5000,
    });
  }

  if (isDatabaseConfigured && connectionString) {
    return new Pool({
      connectionString,
      connectionTimeoutMillis,
      ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
      max,
      min: 0,
      idleTimeoutMillis,
      maxLifetimeSeconds,
      keepAlive: true,
      keepAliveInitialDelayMillis: 5000,
    });
  }

  return new Pool({
    connectionString: 'postgres://mock:mock@localhost:5432/mock',
    connectionTimeoutMillis: 1000,
    max: 1,
  });
};

// Create a singleton pool instance.
export const pool = createPool();

// Prevent unhandled pool-level errors from crashing the app or spamming logs on remote socket timeouts
pool.on('error', (err: any) => {
  const code = err?.code || err?.errno;
  if (code === 'ETIMEDOUT' || code === 'ECONNRESET' || code === 'EPIPE' || code === '57P01' || code === '57P02' || code === -110 || code === 'ECONNREFUSED') {
    console.log(`[SQL Pool] Connection closed or unavailable (${code || 'ETIMEDOUT'}); offline mode active.`);
  } else {
    console.warn('SQL pool notice:', err?.message || err);
  }
});

// Drain and close database pool gracefully during HMR / process termination
export async function closePool(): Promise<void> {
  try {
    await pool.end();
    console.log('[SQL Pool] Connection pool closed successfully.');
  } catch (err) {
    console.error('[SQL Pool] Error closing pool:', err);
  }
}

// Initialize Drizzle with the pool, schema, and disable prepared statements for PgBouncer compatibility.
export const db = drizzle(pool, { schema, prepare: false } as any);
