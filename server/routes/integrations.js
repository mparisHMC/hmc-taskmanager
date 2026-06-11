const express = require('express');
const router = express.Router();
const db = require('../db');
const google = require('../services/google');
const slack = require('../services/slack');

// GET /api/integrations/status
router.get('/status', async (req, res) => {
  const [settings, slackStatus] = await Promise.all([
    Promise.resolve(db.getSettings()),
    slack.testConnection(),
  ]);

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

// POST /api/integrations/google/sync
router.post('/google/sync', async (req, res) => {
  try {
    const result = await google.syncAll();
    res.json({ success: true, synced: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/integrations/slack/test
router.post('/slack/test', async (req, res) => {
  try {
    await slack.sendDM('TaskFlow is connected! Your alerts are working.');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
