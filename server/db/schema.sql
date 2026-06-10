-- TaskFlow database schema

CREATE TABLE IF NOT EXISTS users (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  google_id   TEXT UNIQUE,
  name        TEXT NOT NULL DEFAULT 'Mackenzie',
  email       TEXT,
  created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tasks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL,
  notes       TEXT DEFAULT '',
  priority    TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('high','medium','low')),
  category    TEXT NOT NULL DEFAULT 'daily'  CHECK(category IN ('daily','weekly')),
  source      TEXT NOT NULL DEFAULT 'manual' CHECK(source IN ('manual','google','slack','outlook','asana')),
  done        INTEGER NOT NULL DEFAULT 0,
  due         TEXT,
  external_id TEXT,           -- ID from Google/Slack so we don't duplicate
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id           INTEGER REFERENCES users(id),
  notifications     INTEGER DEFAULT 1,
  daily_digest      INTEGER DEFAULT 1,
  digest_time       TEXT DEFAULT '08:00',
  weekly_review     INTEGER DEFAULT 1,
  review_day        TEXT DEFAULT 'Monday',
  slack_alerts      INTEGER DEFAULT 1,
  google_sync       INTEGER DEFAULT 0,
  google_token      TEXT,   -- JSON-serialised OAuth token
  updated_at        TEXT DEFAULT (datetime('now'))
);

-- Seed default user and settings on first run
INSERT OR IGNORE INTO users (id, name, email) VALUES (1, 'Mackenzie', 'mackenzie@healthmarketconnect.com');
INSERT OR IGNORE INTO settings (user_id) VALUES (1);

-- Trigger to auto-update updated_at on tasks
CREATE TRIGGER IF NOT EXISTS tasks_updated_at
  AFTER UPDATE ON tasks
  FOR EACH ROW
BEGIN
  UPDATE tasks SET updated_at = datetime('now') WHERE id = OLD.id;
END;
