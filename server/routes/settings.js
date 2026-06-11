const express = require('express');
const router = express.Router();
const db = require('../db');
const notifications = require('../services/notifications');

// GET /api/settings
router.get('/settings', async (req, res) => {
  try {
    const s = await Promise.resolve(db.getSettings());
    res.json({
      notifications: Boolean(s.notifications),
      daily_digest: Boolean(s.daily_digest),
      digest_time: s.digest_time,
      weekly_review: Boolean(s.weekly_review),
      review_day: s.review_day,
      slack_alerts: Boolean(s.slack_alerts),
      google_sync: Boolean(s.google_sync),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/settings
router.patch('/settings', async (req, res) => {
  try {
    const updated = await Promise.resolve(db.updateSettings(req.body));
    notifications.restartJobs();
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
