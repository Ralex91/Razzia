-- Razzia multi-tenant schema (SQLite)
-- Applied idempotently by the migration runner in db/index.ts.

CREATE TABLE IF NOT EXISTS users (
  id           TEXT PRIMARY KEY,
  username     TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  role         TEXT NOT NULL DEFAULT 'manager' CHECK (role IN ('admin','manager')),
  disabled     INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS credentials (
  id           TEXT PRIMARY KEY,            -- base64url credentialID
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  public_key   BLOB NOT NULL,
  counter      INTEGER NOT NULL DEFAULT 0,
  transports   TEXT,                        -- JSON array of AuthenticatorTransport
  device_label TEXT,
  created_at   TEXT NOT NULL,
  last_used_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_credentials_user ON credentials(user_id);

CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY,              -- sha256(token)
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- One-time invite / bootstrap tokens gating registration.
CREATE TABLE IF NOT EXISTS invites (
  id         TEXT PRIMARY KEY,              -- sha256(token)
  role       TEXT NOT NULL DEFAULT 'manager' CHECK (role IN ('admin','manager')),
  username   TEXT,                          -- optional pre-assigned handle
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at    TEXT
);

CREATE TABLE IF NOT EXISTS quizzes (
  id         TEXT PRIMARY KEY,
  owner_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject    TEXT NOT NULL,
  data       TEXT NOT NULL,                 -- JSON: { questions: [...] }
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_quizzes_owner ON quizzes(owner_id);

CREATE TABLE IF NOT EXISTS quiz_shares (
  quiz_id    TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  grantee_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission TEXT NOT NULL CHECK (permission IN ('view','run','edit')),
  created_at TEXT NOT NULL,
  PRIMARY KEY (quiz_id, grantee_id)
);
CREATE INDEX IF NOT EXISTS idx_shares_grantee ON quiz_shares(grantee_id);

CREATE TABLE IF NOT EXISTS results (
  id         TEXT PRIMARY KEY,
  quiz_id    TEXT REFERENCES quizzes(id) ON DELETE SET NULL,
  owner_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject    TEXT NOT NULL,
  date       TEXT NOT NULL,
  data       TEXT NOT NULL                  -- full GameResult JSON
);
CREATE INDEX IF NOT EXISTS idx_results_owner ON results(owner_id);
