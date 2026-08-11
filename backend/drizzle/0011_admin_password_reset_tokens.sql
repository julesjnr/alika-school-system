CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  requested_ip VARCHAR(64)
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_active
  ON password_reset_tokens (user_id, expires_at)
  WHERE used_at IS NULL;

CREATE TABLE IF NOT EXISTS password_reset_rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_hash CHAR(64) NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_rate_limits_email_requested
  ON password_reset_rate_limits (email_hash, requested_at DESC);

ALTER TABLE users ADD COLUMN IF NOT EXISTS session_version INTEGER NOT NULL DEFAULT 0;
