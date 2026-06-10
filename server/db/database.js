const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const DB_PATH = process.env.DB_PATH || './taskflow.db';
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let db;

function getDb() {
  if (!db) {
    db = new DatabaseSync(path.resolve(DB_PATH));
    db.exec('PRAGMA journal_mode = WAL');
    db.exec('PRAGMA foreign_keys = ON');

    // Run schema on first connect
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
    db.exec(schema);
  }
  return db;
}

// transaction() helper — mirrors better-sqlite3's db.transaction(fn)(args)
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

// ─── Task helpers ─────────────────────────────────────────────────────────────

function getAllTasks(category) {
  const d = getDb();
  if (category) return d.prepare('SELECT * FROM tasks WHERE category = ? ORDER BY done ASC, priority DESC, due ASC').all(category);
  return d.prepare('SELECT * FROM tasks ORDER BY done ASC, priority DESC, due ASC').all();
}

function getTask(id) {
  return getDb().prepare('SELECT * FROM tasks WHERE id = ?').get(id);
}

function createTask(task) {
  const d = getDb();
  const stmt = d.prepare(`
    INSERT INTO tasks (title, notes, priority, category, source, done, due, external_id)
    VALUES (@title, @notes, @priority, @category, @source, @done, @due, @external_id)
  `);
  const result = stmt.run({
    title: task.title,
    notes: task.notes || '',
    priority: task.priority || 'medium',
    category: task.category || 'daily',
    source: task.source || 'manual',
    done: task.done ? 1 : 0,
    due: task.due || null,
    external_id: task.external_id || null
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
  `).run({ ...merged, done: merged.done ? 1 : 0, id });
  return getTask(id);
}

function deleteTask(id) {
  return getDb().prepare('DELETE FROM tasks WHERE id = ?').run(id);
}

function upsertByExternalId(task) {
  const existing = getDb().prepare('SELECT * FROM tasks WHERE external_id = ?').get(task.external_id);
  if (existing) return updateTask(existing.id, task);
  return createTask(task);
}

// ─── Settings helpers ─────────────────────────────────────────────────────────

function getSettings(userId = 1) {
  return getDb().prepare('SELECT * FROM settings WHERE user_id = ?').get(userId);
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
    WHERE user_id = @user_id
  `).run({ ...merged, user_id: userId });
  return getSettings(userId);
}

// ─── Auto-generation helpers ───────────────────────────────────────────────────

// Default recurring daily tasks seeded if none exist for today
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
  const existing = d.prepare("SELECT COUNT(*) as cnt FROM tasks WHERE category = 'daily' AND due = ?").get(today);
  if (existing.cnt === 0) {
    const insert = d.prepare(`
      INSERT INTO tasks (title, priority, category, source, due)
      VALUES (@title, @priority, 'daily', 'manual', @due)
    `);
    const insertMany = makeTransaction((tasks) => tasks.forEach(t => insert.run({ ...t, due: today })));
    insertMany(DEFAULT_DAILY);
    console.log(`[DB] Seeded ${DEFAULT_DAILY.length} default daily tasks for ${today}`);
  }
}

function seedWeeklyTasksIfEmpty() {
  const d = getDb();
  // Get Monday of current week
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  const weekStart = monday.toISOString().slice(0, 10);

  const existing = d.prepare("SELECT COUNT(*) as cnt FROM tasks WHERE category = 'weekly' AND due >= ?").get(weekStart);
  if (existing.cnt === 0) {
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    const weekEnd = friday.toISOString().slice(0, 10);

    const insert = d.prepare(`
      INSERT INTO tasks (title, priority, category, source, due)
      VALUES (@title, @priority, 'weekly', 'manual', @due)
    `);
    const insertMany = makeTransaction((tasks) => tasks.forEach(t => insert.run({ ...t, due: weekEnd })));
    insertMany(DEFAULT_WEEKLY);
    console.log(`[DB] Seeded ${DEFAULT_WEEKLY.length} default weekly tasks for week of ${weekStart}`);
  }
}

module.exports = {
  getDb,
  getAllTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  upsertByExternalId,
  getSettings,
  updateSettings,
  seedDailyTasksIfEmpty,
  seedWeeklyTasksIfEmpty,
};
