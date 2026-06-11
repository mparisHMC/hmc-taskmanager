require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');

const db = process.env.USE_SUPABASE === 'true' ? require('./db/supabase') : require('./db/database');
const taskRoutes = require('./routes/tasks');
const { router: authRoutes } = require('./routes/auth');
const integrationRoutes = require('./routes/integrations');
const settingsRoutes = require('./routes/settings');
const coworkRoutes = require('./routes/cowork');
const { startAllJobs } = require('./services/notifications');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:19006',
    'http://localhost:3000',
    process.env.WEB_URL,
  ].filter(Boolean),
  credentials: true,
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'taskflow-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 },
}));

// Auth middleware — protects all /api routes
function requireAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

// Routes
app.use('/auth', authRoutes);
app.use('/api/tasks', requireAuth, taskRoutes);
app.use('/api/integrations', requireAuth, integrationRoutes);
app.use('/api', requireAuth, settingsRoutes);
app.use('/api/cowork', requireAuth, coworkRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString(), version: '1.0.0' });
});

// In Vercel serverless, we don't call listen - just export the app
if (process.env.NODE_ENV !== 'production' || process.env.LISTEN === 'true') {
  app.listen(PORT, () => {
    console.log('\nTaskFlow server running on http://localhost:' + PORT);
    console.log('   API: http://localhost:' + PORT + '/api/tasks');
    console.log('   Auth: http://localhost:' + PORT + '/auth/google');

    console.log('\n[Startup] Checking task seeds...');
    db.seedDailyTasksIfEmpty();
    db.seedWeeklyTasksIfEmpty();

    console.log('\n[Startup] Starting scheduled jobs...');
    startAllJobs();

    console.log('\nReady!\n');
  });
}

module.exports = app;
