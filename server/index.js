require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');

const db = process.env.USE_SUPABASE === 'true' ? require('./db/supabase') : require('./db/database');
const taskRoutes = require('./routes/tasks');
const { router: authRoutes } = require('./routes/auth');
const integrationRoutes = require('./routes/integrations');
const { startAllJobs } = require('./services/notifications');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:5173', // Vite web dev
    'http://localhost:19006', // Expo web
    'http://localhost:3000',
    process.env.WEB_URL, // Production web app URL
  ].filter(Boolean),
  credentials: true,
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'taskflow-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 }, // 1 week
}));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/tasks', taskRoutes);
app.use('/auth', authRoutes);
app.use('/api', integrationRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString(), version: '1.0.0' });
});

// ─── Startup ──────────────────────────────────────────────────────────────────
// In Vercel serverless, we don't call listen — just export the app
if (process.env.NODE_ENV !== 'production' || process.env.LISTEN === 'true') {
app.listen(PORT, () => {
  console.log(`\n✅ TaskFlow server running on http://localhost:${PORT}`);
  console.log(`   API: http://localhost:${PORT}/api/tasks`);
  console.log(`   Auth: http://localhost:${PORT}/auth/google`);

  // Seed tasks for today + this week if the DB is empty
  console.log('\n[Startup] Checking task seeds...');
  db.seedDailyTasksIfEmpty();
  db.seedWeeklyTasksIfEmpty();

  // Start all cron jobs (daily digest, weekly review, overdue alerts, Google sync)
  console.log('\n[Startup] Starting scheduled jobs...');
  startAllJobs();

  console.log('\nReady! 🚀\n');
});
}

module.exports = app;
