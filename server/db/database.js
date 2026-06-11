const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const DB_PATH = process.env.DB_PATH || './taskflow.db';
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let db;

function getDb() {
  if (!db) {
    db = new DatabaseSync(path.resolve(DB_PATH));
    db.exec('PRAGMA journal_mode = WAL');
    db.exec('PRAGMA foreign_keys = ON');
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
    db.exec(schema);
  }
  return db;
}

function makeTransaction(fn) {
  return function (...args) {
    const d = getDb();
    d.exec('BEGIN');
    try {
      const result = fn(...args);
      d.exec('COMMIT');
      return result;
    } catch (e) {
      d.exec('ROLLBACK');
      throw e;
    }
  };
}

// ── Task helpers ──────────────────────────────────────────────────────────────

function getAllTasks(category) {
  const d = getDb();
  if (category) {
    return d.prepare(
      'SELECT * FROM tasks WHERE category = @category ORDER BY done ASC, priority DESC, due ASC'
    ).all({ category });
  }
  return d.prepare(
    'SELECT * FROM tasks ORDER BY done ASC, priority DESC, due ASC'
  ).all();
}

function getTask(id) {
  return getDb().prepare('SELECT * FROM tasks WHERE id = @id').get({ id });
}

function createTask(task) {
  const d = getDb();
  const result = d.prepare(`
    INSERT INTO tasks (title, notes, priority, category, source, done, due, external_id)
    VALUES (@title, @notes, @priority, @category, @source, @done, @due, @external_id)
  `).run({
    title: task.title,
    notes: task.notes || '',
    priority: task.priority || 'medium',
    category: task.category || 'daily',
    source: task.source || 'manual',
    done: task.done ? 1 : 0,
    due: task.due || null,
    external_id: task.external_id || null,
  });
  return getTask(result.lastInsertRowid);
}

function updateTask(id, updates) {
  const existing = getTask(id);
  if (!existing) return null;
  const merged = { ...existing, ...updates };
  getDb().prepare(`
    UPDATE tasks SET
      title = @title, notes = @notes, priority = @priority,
      category = @category, source = @source, done = @done, due = @due
    WHERE id = @id
  `).run({
    title: merged.title,
    notes: merged.notes || '',
    priority: merged.priority,
    category: merged.category,
    source: merged.source,
    done: merged.done ? 1 : 0,
    due: merged.due ?? null,
    id: id,
  });
  return getTask(id);
}

function deleteTask(id) {
  return getDb().prepare('DELETE FROM tasks WHERE id = @id').run({ id });
}

function upsertByExternalId(task) {
  const existing = getDb()
    .prepare('SELECT * FROM tasks WHERE external_id = @external_id')
    .get({ external_id: task.external_id });
  if (existing) return updateTask(existing.id, task);
  return createTask(task);
}

// ── Settings helpers ──────────────────────────────────────────────────────────

function getSettings(userId = 1) {
  return getDb()
    .prepare('SELECT * FROM settings WHERE user_id = @user_id ORDER BY id ASC LIMIT 1')
    .get({ user_id: userId });
}

function updateSettings(updates, userId = 1) {
  const existing = getSettings(userId);
  const merged = { ...existing, ...updates };
  getDb().prepare(`
    UPDATE settings SET
      notifications = @notifications,
      daily_digest = @daily_digest,
      digest_time = @digest_time,
      weekly_review = @weekly_review,
      review_day = @review_day,
      slack_alerts = @slack_alerts,
      google_sync = @google_sync,
      google_token = @google_token,
      updated_at = datetime('now')
    WHERE user_id = @user_id AND id = @id
  `).run({
    notifications: merged.notifications ?? 1,
    daily_digest: merged.daily_digest ?? 1,
    digest_time: merged.digest_time ?? '08:00',
    weekly_review: merged.weekly_review ?? 1,
    review_day: merged.review_day ?? 'Monday',
    slack_alerts: merged.slack_alerts ?? 1,
    google_sync: merged.google_sync ?? 0,
    google_token: merged.google_token ?? null,
    user_id: userId,
    id: existing.id,
  });
  return getSettings(userId);
}

// ── Auto-seed helpers ─────────────────────────────────────────────────────────

const DEFAULT_DAILY = [
  { title: 'Check and triage email inbox', priority: 'high' },
  { title: 'Review and respond to Slack messages', priority: 'medium' },
  { title: 'Check in with team on blockers', priority: 'medium' },
  { title: 'Update project status trackers', priority: 'medium' },
  { title: 'Review upcoming deadlines', priority: 'low' },
];

const DEFAULT_WEEKLY = [
  { title: 'Send weekly status update to stakeholders', priority: 'high' },
  { title: 'Review week priorities and deadlines', priority: 'high' },
  { title: 'Coordinate with team on open projects', priority: 'medium' },
  { title: 'Prepare end-of-week report', priority: 'medium' },
  { title: 'Weekly retrospective / notes', priority: 'low' },
];

function seedDailyTasksIfEmpty() {
  const d = getDb();
  const today = new Date().toISOString().slice(0, 10);
  const existing = d.prepare(
    "SELECT COUNT(*) as cnt FROM tasks WHERE category = 'daily' AND due = @today"
  ).get({ today });
  if (existing.cnt === 0) {
    const insert = d.prepare(`
      INSERT INTO tasks (title, priority, category, source, due)
      VALUES (@title, @priority, 'daily', 'manual', @due)
    `);
    const insertMany = makeTransaction((tasks) =>
      tasks.forEach(t => insert.run({ ...t, due: today }))
    );
    insertMany(DEFAULT_DAILY);
    console.log(`[DB] Seeded ${DEFAULT_DAILY.length} default daily tasks for ${today}`);
  }
}

function seedWeeklyTasksIfEmpty() {
  const d = getDb();
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  const weekStart = monday.toISOString().slice(0, 10);

  const existing = d.prepare(
    "SELECT COUNT(*) as cnt FROM tasks WHERE category = 'weekly' AND due >= @weekStart"
  ).get({ weekStart });
  if (existing.cnt === 0) {
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    const weekEnd = friday.toISOString().slice(0, 10);
    const insert = d.prepare(`
      INSERT INTO tasks (title, priority, category, source, due)
      VALUES (@title, @priority, 'weekly', 'manual', @due)
    `);
    const insertMany = makeTransaction((tasks) =>
      tasks.forEach(t => insert.run({ ...t, due: we