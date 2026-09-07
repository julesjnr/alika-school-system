import assert from 'node:assert/strict';
import { describe, it, beforeEach, afterEach } from 'node:test';
import { resolveSslConfig, decodePassword } from './ssl.ts';

describe('PostgreSQL SSL Configuration and Reconciliation', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.DATABASE_SSL;
    delete process.env.DB_SSL;
    delete process.env.PGSSLMODE;
    delete process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('disables SSL by default in local development/test environments', () => {
    process.env.NODE_ENV = 'development';
    const ssl = resolveSslConfig();
    assert.equal(ssl, false);
    assert.equal(process.env.PGSSLMODE, 'disable');
  });

  it('enables SSL by default in production for managed cloud datastores', () => {
    process.env.NODE_ENV = 'production';
    const ssl = resolveSslConfig();
    assert.deepEqual(ssl, { rejectUnauthorized: false });
  });

  it('explicit DATABASE_SSL=true enables SSL regardless of environment', () => {
    process.env.NODE_ENV = 'development';
    process.env.DATABASE_SSL = 'true';
    process.env.PGSSLMODE = 'disable'; // Conflicting env var

    const ssl = resolveSslConfig();
    assert.deepEqual(ssl, { rejectUnauthorized: false });
    // Should reconcile PGSSLMODE so driver doesn't conflict
    assert.equal(process.env.PGSSLMODE, 'require');
  });

  it('explicit DATABASE_SSL=false disables SSL even in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.DATABASE_SSL = 'false';

    const ssl = resolveSslConfig();
    assert.equal(ssl, false);
    assert.equal(process.env.PGSSLMODE, 'disable');
  });

  it('supports legacy DB_SSL=true and DB_SSL=false flags', () => {
    process.env.DB_SSL = 'true';
    assert.deepEqual(resolveSslConfig(), { rejectUnauthorized: false });

    process.env.DB_SSL = 'false';
    assert.equal(resolveSslConfig(), false);
  });

  it('respects PGSSLMODE=disable in local/dockerized environments', () => {
    process.env.NODE_ENV = 'production'; // e.g. docker-compose running with NODE_ENV=production
    process.env.PGSSLMODE = 'disable';

    const ssl = resolveSslConfig();
    assert.equal(ssl, false);
    assert.equal(process.env.PGSSLMODE, 'disable');
  });

  it('respects sslmode in connection URL parameters', () => {
    const disabledUrl = 'postgresql://user:pass@localhost:5432/db?sslmode=disable';
    assert.equal(resolveSslConfig(disabledUrl), false);

    const requiredUrl = 'postgresql://user:pass@localhost:5432/db?sslmode=require';
    assert.deepEqual(resolveSslConfig(requiredUrl), { rejectUnauthorized: false });
  });

  it('safely decodes URI-encoded password strings', () => {
    assert.equal(decodePassword('AlikaLocal%402026'), 'AlikaLocal@2026');
    assert.equal(decodePassword('PlainPassword123'), 'PlainPassword123');
    assert.equal(decodePassword(''), '');
    assert.equal(decodePassword(undefined), '');
  });
});
