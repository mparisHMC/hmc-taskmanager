const express = require('express');
const router = express.Router();
const db = require('../db/database');
const google = require('../services/google');
const slack = require('../services/slack');
const notifications = require('../services/notifications');

// GET /api/integrations/status
router.get('/status', async (req, res) => {
  const settings = db.getSettings();
  const slackStatus = await slack.testConnection();

  res.json({
    google: {
      connected: Boolean(settings.google_sync && settings.google_token),
    },
    slack: {
      connected: slackStatus.ok,
      team: slackStatus.team,
      botName: slackStatus.botName,
      error: slackStatus.error,
    },
  });
});

// POST /api/integrations/google/sync — manual trigger
router.post('/google/sync', async (req, res) => {
  try {
    const result = await google.syncAll();
    res.json({ success: true, synced: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/integrations/slack/test — send a test DM
router.post('/slack/test', async (req, res) => {
  try {
    await slack.sendDM('👋 TaskFlow is connected! Your alerts are working.');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/settings
router.get('/settings', (req, res) => {
  const s = db.getSettings();
  // Don't expose raw token
  res.json({
    notifications: Boolean(s.notifications),
    daily_digest: Boolean(s.daily_digest),
    digest_time: s.digest_time,
    weekly_review: Boolean(s.weekly_review),
    review_day: s.review_day,
    slack_alerts: Boolean(s.slack_alerts),
    google_sync: Boolean(s.google_sync),
  });
});

// PATCH /api/settings
router.patch('/settings', (req, res) => {
  try {
    const updated = db.updateSettings(req.body);
    notifications.restartJobs(); // restart crons if digest time changed
    res.json({
      notifications: Boolean(updated.notifications),
      daily_digest: Boolean(updated.daily_digest),
      digest_time: updated.digest_time,
      weekly_review: Boolean(updated.weekly_review),
      review_day: updated.review_day,
      slack_alerts: Boolean(updated.slack_alerts),
      google_sync: Boolean(updated.google_sync),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
