import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const dataDir = path.join(process.cwd(), 'data');
fs.mkdirSync(dataDir, { recursive: true });
export const db = new DatabaseSync(path.join(dataDir, 'smart-time.db'));
db.exec(`
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS service_status (
  service TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  source TEXT,
  message TEXT,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS api_cache (
  cache_key TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  created_at TEXT NOT NULL,
  phone TEXT,
  phone_verified INTEGER NOT NULL DEFAULT 0,
  activation_status TEXT NOT NULL DEFAULT 'pending',
  activated_by TEXT,
  activated_at TEXT
);
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS conversation_members (
  conversation_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  PRIMARY KEY(conversation_id, user_id)
);
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS ride_requests (
  id TEXT PRIMARY KEY,
  pickup_json TEXT NOT NULL,
  destination_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS ride_quotes (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  amount REAL,
  currency TEXT,
  eta_minutes INTEGER,
  duration_minutes INTEGER,
  status TEXT NOT NULL,
  raw_json TEXT,
  created_at TEXT NOT NULL
);
`);

try { db.exec('ALTER TABLE users ADD COLUMN phone TEXT'); } catch {}
try { db.exec("ALTER TABLE users ADD COLUMN activation_status TEXT NOT NULL DEFAULT 'pending'"); } catch {}
try { db.exec('ALTER TABLE users ADD COLUMN activated_by TEXT'); } catch {}
try { db.exec('ALTER TABLE users ADD COLUMN activated_at TEXT'); } catch {}
try { db.exec('ALTER TABLE users ADD COLUMN phone_verified INTEGER NOT NULL DEFAULT 0'); } catch {}
try { db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone ON users(phone) WHERE phone IS NOT NULL`); } catch {}
try { db.exec(`CREATE TABLE IF NOT EXISTS phone_otps (phone TEXT PRIMARY KEY, code_hash TEXT NOT NULL, expires_at TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL)`); } catch {}
try { db.exec(`CREATE TABLE IF NOT EXISTS password_resets (email TEXT PRIMARY KEY, code_hash TEXT NOT NULL, expires_at TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL)`); } catch {}
