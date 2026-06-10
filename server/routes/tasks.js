const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET /api/tasks?category=daily|weekly
router.get('/', (req, res) => {
  try {
    const { category } = req.query;
    const tasks = db.getAllTasks(category);
    // Normalize done field to boolean for frontend
    res.json(tasks.map(t => ({ ...t, done: Boolean(t.done) })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// GET /api/tasks/:id
router.get('/:id', (req, res) => {
  const task = db.getTask(Number(req.params.id));
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json({ ...task, done: Boolean(task.done) });
});

// POST /api/tasks
router.post('/', (req, res) => {
  try {
    const { title, notes, priority, category, source, done, due } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });
    const task = db.createTask({ title: title.trim(), notes, priority, category, source, done, due });
    res.status(201).json({ ...task, done: Boolean(task.done) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PATCH /api/tasks/:id
router.patch('/:id', (req, res) => {
  try {
    const task = db.updateTask(Number(req.params.id), req.body);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ ...task, done: Boolean(task.done) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', (req, res) => {
  try {
    db.deleteTask(Number(req.params.id));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// POST /api/tasks/:id/toggle — convenience endpoint for checkbox
router.post('/:id/toggle', (req, res) => {
  try {
    const existing = db.getTask(Number(req.params.id));
    if (!existing) return res.status(404).json({ error: 'Task not found' });
    const task = db.updateTask(existing.id, { done: !existing.done });
    res.json({ ...task, done: Boolean(task.done) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to toggle task' });
  }
});

// POST /api/tasks/seed — manually trigger daily/weekly seed
router.post('/seed', (req, res) => {
  try {
    db.seedDailyTasksIfEmpty();
    db.seedWeeklyTasksIfEmpty();
    res.json({ success: true, message: 'Seed complete' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to seed tasks' });
  }
});

module.exports = router;
