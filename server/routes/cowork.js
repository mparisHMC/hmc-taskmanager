/**
 * Claude / Cowork integration
 *
 * Any Cowork session can POST tasks here and they'll appear in TaskFlow,
 * tagged with the source computer and the Cowork session ID.
 *
 * Usage (from a Cowork session or Claude skill):
 *   POST /api/cowork/task
 *   Body: { title, notes, priority, category, computer, session_id }
 *
 * The "computer" field is whatever hostname the Cowork session reports,
 * so you can see at a glance which machine the task came from.
 */

const express = require('express');
const router = express.Router();
const db = require('../db/database');

// POST /api/cowork/task — push a task from a Cowork session
router.post('/task', (req, res) => {
  try {
    const {
      title,
      notes,
      priority = 'medium',
      category = 'daily',
      computer,        // e.g. "Mackenzie's MacBook Pro"
      session_id,      // Cowork session UUID
      due,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'title is required' });
    }

    // Embed computer info into notes so it's visible in the UI
    const fullNotes = [
      notes,
      computer ? `📍 From: ${computer}` : null,
      session_id ? `Session: ${session_id.slice(0, 8)}` : null,
    ].filter(Boolean).join(' | ');

    const external_id = session_id ? `cowork_${session_id}_${Date.now()}` : null;

    const task = db.createTask({
      title: title.trim(),
      notes: fullNotes,
      priority,
      category,
      source: 'manual',  // shows "Manual" in UI; notes contain the Cowork detail
      due: due || new Date().toISOString().slice(0, 10),
      external_id,
    });

    res.status(201).json({ ...task, done: Boolean(task.done) });
  } catch (err) {
    console.error('[Cowork] Task push error:', err.message);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// POST /api/cowork/tasks — push multiple tasks at once
router.post('/tasks', (req, res) => {
  try {
    const { tasks, computer, session_id } = req.body;
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ error: 'tasks array is required' });
    }

    const created = tasks.map(t => {
      const fullNotes = [
        t.notes,
        computer ? `📍 From: ${computer}` : null,
        session_id ? `Session: ${session_id.slice(0, 8)}` : null,
      ].filter(Boolean).join(' | ');

      return db.createTask({
        title: t.title?.trim(),
        notes: fullNotes,
        priority: t.priority || 'medium',
        category: t.category || 'daily',
        source: 'manual',
        due: t.due || new Date().toISOString().slice(0, 10),
        external_id: session_id ? `cowork_${session_id}_${t.title?.slice(0,20)}` : null,
      });
    }).filter(Boolean);

    res.status(201).json(created.map(t => ({ ...t, done: Boolean(t.done) })));
  } catch (err) {
    console.error('[Cowork] Bulk push error:', err.message);
    res.status(500).json({ error: 'Failed to create tasks' });
  }
});

// GET /api/cowork/tasks — get tasks tagged from Cowork (for a Cowork skill to read back)
router.get('/tasks', (req, res) => {
  try {
    const all = db.getAllTasks();
    // Return only tasks that have "From:" in notes (Cowork-sourced)
    const coworkTasks = all.filter(t => t.notes && t.notes.includes('📍 From:'));
    res.json(coworkTasks.map(t => ({ ...t, done: Boolean(t.done) })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
