/**
 * Supabase database adapter — drop-in replacement for database.js
 *
 * Set USE_SUPABASE=true in .env to use this instead of SQLite.
 * The server/index.js auto-selects based on that flag.
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

// ─── Tasks ────────────────────────────────────────────────────────────────────

async function getAllTasks(category) {
  let query = supabase.from('tasks').select('*').order('done').order('priority').order('due');
  if (category) query = query.eq('category', category);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

async function getTask(id) {
  const { data, error } = await supabase.from('tasks').select('*').eq('id', id).single();
  if (error) return null;
  return data;
}

async function createTask(task) {
  const { data, error } = await supabase.from('tasks').insert([{
    title: task.title,
    notes: task.notes || '',
    priority: task.priority || 'medium',
    category: task.category || 'daily',
    source: task.source || 'manual',
    done: task.done || false,
    due: task.due || null,
    external_id: task.external_id || null,
  }]).select().single();
  if (error) throw error;
  return data;
}

async function updateTask(id, updates) {
  const { data, error } = await supabase.from('tasks')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id).select().single();
  if (error) throw error;
  return data;
}

async function deleteTask(id) {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
  return { success: true };
}

async function upsertByExternalId(task) {
  const { data, error } = await supabase.from('tasks').upsert(
    [{
      title: task.title,
      notes: task.notes || '',
      priority: task.priority || 'medium',
      category: task.category || 'daily',
      source: task.source || 'manual',
      done: task.done || false,
      due: task.due || null,
      external_id: task.external_id,
    }],
    { onConflict: 'external_id' }
  ).select().single();
  if (error) throw error;
  return data;
}

// ─── Settings ─────────────────────────────────────────────────────────────────

async function getSettings() {
  const { data, error } = await supabase.from('settings').select('*').eq('id', 1).single();
  if (error) return {};
  return data;
}

async function updateSettings(updates) {
  const { data, error } = await supabase.from('settings')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', 1).select().single();
  if (error) throw error;
  return data;
}

// ─── Auto-seed ────────────────────────────────────────────────────────────────

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

async function seedDailyTasksIfEmpty() {
  const today = new Date().toISOString().slice(0, 10);
  const { count } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('category', 'daily').eq('due', today);
  if (count === 0) {
    await supabase.from('tasks').insert(DEFAULT_DAILY.map(t => ({ ...t, category: 'daily', source: 'manual', due: today })));
    console.log('[Supabase] Seeded daily tasks for', today);
  }
}

async function seedWeeklyTasksIfEmpty() {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  const weekStart = monday.toISOString().slice(0, 10);

  const { count } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('category', 'weekly').gte('due', weekStart);
  if (count === 0) {
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    const weekEnd = friday.toISOString().slice(0, 10);
    await supabase.from('tasks').insert(DEFAULT_WEEKLY.map(t => ({ ...t, category: 'weekly', source: 'manual', due: weekEnd })));
    console.log('[Supabase] Seeded weekly tasks for week of', weekStart);
  }
}

module.exports = {
  getAllTasks, getTask, createTask, updateTask, deleteTask, upsertByExternalId,
  getSettings, updateSettings, seedDailyTasksIfEmpty, seedWeeklyTasksIfEmpty,
};
