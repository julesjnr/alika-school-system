import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const currentDir =
  typeof __dirname !== 'undefined'
    ? __dirname
    : typeof import.meta !== 'undefined' && import.meta.url
      ? path.dirname(fileURLToPath(import.meta.url))
      : process.cwd();

// Load environment variables across workspaces (.env at root or current dir)
dotenv.config({ override: true });
dotenv.config({ path: path.resolve(currentDir, '../../../.env'), override: true });
dotenv.config({ path: path.resolve(process.cwd(), '../.env'), override: true });
dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });

/**
 * Safely decodes URI-encoded password strings (e.g. %40 -> @) for direct pg pool credentials.
 */
export function decodePassword(pass?: string): string {
  if (!pass) return '';
  try {
    return decodeURIComponent(pass);
  } catch {
    return pass;
  }
}

/**
 * Resolves PostgreSQL SSL configuration based on environment variables and connection parameters.
 *
 * Conditional SSL Evaluation Logic:
 * 1. Explicit override flag: DATABASE_SSL (or legacy DB_SSL) takes highest precedence.
 *    - 'true'  => SSL enabled ({ rejectUnauthorized: false })
 *    - 'false' => SSL disabled (false)
 * 2. PGSSLMODE environment variable & connection URL query parameters:
 *    - 'disable' => SSL disabled (false)
 *    - 'require', 'verify-ca', 'verify-full' => SSL enabled ({ rejectUnauthorized: false })
 * 3. Environment default:
 *    - NODE_ENV === 'production' => SSL enabled by default (for hosted cloud DBs like Supabase/Neon/AWS RDS)
 *    - Local development / test / default => SSL disabled (local Docker postgres:16-alpine has no SSL configured)
 *
 * Environment Reconciliation:
 * Reconciles process.env.PGSSLMODE with the resolved SSL setting to prevent
 * node-postgres or downstream subprocesses from receiving conflicting SSL instructions.
 */
export function resolveSslConfig(connectionUrl?: string): false | { rejectUnauthorized: boolean } {
  const envDatabaseSsl = (process.env.DATABASE_SSL || process.env.DB_SSL || '').toLowerCase().trim();
  const envPgSslMode = (process.env.PGSSLMODE || '').toLowerCase().trim();

  let urlSslMode: string | null = null;
  if (connectionUrl) {
    try {
      const parsed = new URL(connectionUrl);
      urlSslMode = (parsed.searchParams.get('sslmode') || '').toLowerCase().trim();
    } catch {
      const match = connectionUrl.match(/[?&]sslmode=([^&]+)/i);
      if (match) urlSslMode = match[1].toLowerCase().trim();
    }
  }

  let sslEnabled = false;

  if (envDatabaseSsl === 'true') {
    sslEnabled = true;
  } else if (envDatabaseSsl === 'false') {
    sslEnabled = false;
  } else if (urlSslMode === 'disable') {
    sslEnabled = false;
  } else if (urlSslMode === 'require' || urlSslMode === 'verify-ca' || urlSslMode === 'verify-full') {
    sslEnabled = true;
  } else if (envPgSslMode === 'disable') {
    sslEnabled = false;
  } else if (
    envPgSslMode === 'require' ||
    envPgSslMode === 'verify-ca' ||
    envPgSslMode === 'verify-full'
  ) {
    sslEnabled = true;
  } else if (process.env.NODE_ENV === 'production') {
    sslEnabled = true;
  } else {
    sslEnabled = false;
  }

  // Reconcile PGSSLMODE in process.env to ensure consistency and avoid driver conflicts
  if (sslEnabled) {
    if (process.env.PGSSLMODE === 'disable') {
      process.env.PGSSLMODE = 'require';
    }
    return { rejectUnauthorized: false };
  } else {
    process.env.PGSSLMODE = 'disable';
    return false;
  }
}
