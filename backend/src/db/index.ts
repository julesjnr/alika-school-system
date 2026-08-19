import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

const resolveProjectEnvPath = () => {
  const cwd = process.cwd();
  const candidates = [
    process.env.DOTENV_PATH,
    path.resolve(cwd, '.env'),
    path.resolve(cwd, '..', '.env'),
    path.resolve(cwd, '..', '..', '.env'),
    path.resolve(currentDir, '../../.env'),
    path.resolve(currentDir, '../../../.env'),
  ].filter(Boolean) as string[];

  return candidates.find((candidate) => fs.existsSync(candidate)) || candidates[0];
};

const projectEnvPath = resolveProjectEnvPath();
if (projectEnvPath) {
  dotenv.config({ path: projectEnvPath, override: true });
}

import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from './schema.ts';

// Function to create a new connection pool.
export const createPool = () => {
  const normalizeSqlValue = (value: string | undefined) => {
    if (!value) return undefined;
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  };

  const connectionString = process.env.DATABASE_URL;
  const sqlHost = normalizeSqlValue(process.env.SQL_HOST);
  const sqlUser = normalizeSqlValue(process.env.SQL_USER);
  const sqlPassword = normalizeSqlValue(process.env.SQL_PASSWORD);
  const sqlDbName = normalizeSqlValue(process.env.SQL_DB_NAME);
  const sqlPort = normalizeSqlValue(process.env.SQL_PORT);

  const hasSqlConfig = Boolean(sqlHost && sqlUser && sqlPassword && sqlDbName);

  const allowMockDatabase = process.env.ALLOW_MOCK_DATABASE === 'true';
  const sslMode = process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false };

  // Supabase session poolers enforce comparatively small connection limits.  A
  // small application pool prevents concurrent startup reads/syncs from
  // exhausting those sessions and makes every connection reusable.
  const max = Number(process.env.DB_POOL_MAX) || 3;
  const connectionTimeoutMillis = Number(process.env.DB_CONNECTION_TIMEOUT_MS) || 30000;
  const idleTimeoutMillis = Number(process.env.DB_IDLE_TIMEOUT_MS) || 30000;
  const maxLifetimeSeconds = Number(process.env.DB_MAX_LIFETIME_SECONDS) || 300;

  if (hasSqlConfig) {
    console.info('[Database] Using local PostgreSQL configuration.', {
      host: sqlHost,
      port: sqlPort || 5432,
      database: sqlDbName,
      user: sqlUser,
    });
    return new Pool({
      host: sqlHost,
      port: sqlPort ? Number(sqlPort) : 5432,
      user: sqlUser,
      password: sqlPassword,
      database: sqlDbName,
      connectionTimeoutMillis,
      ssl: sslMode,
      max,
      min: 0,
      idleTimeoutMillis,
      maxLifetimeSeconds,
      keepAlive: true,
      keepAliveInitialDelayMillis: 5000,
    });
  }

  if (connectionString) {
    console.info('[Database] Using DATABASE_URL PostgreSQL configuration.');
    return new Pool({
      connectionString,
      connectionTimeoutMillis,
      ssl: sslMode,
      max,
      min: 0,
      idleTimeoutMillis,
      maxLifetimeSeconds,
      keepAlive: true,
      keepAliveInitialDelayMillis: 5000,
    });
  }

  if (allowMockDatabase) {
    console.warn('[Database] Mock database mode enabled explicitly via ALLOW_MOCK_DATABASE=true.');
    return new Pool({
      connectionString: 'postgres://mock:mock@localhost:5432/mock',
      connectionTimeoutMillis: 1000,
      max: 1,
    });
  }

  throw new Error('Missing PostgreSQL configuration. Set SQL_* variables or DATABASE_URL in the project root .env file, or enable ALLOW_MOCK_DATABASE=true only for explicit offline/demo mode.');
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
