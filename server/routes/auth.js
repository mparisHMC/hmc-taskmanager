const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const db = require('../db');
require('dotenv').config();

const WEB_URL = process.env.WEB_URL || 'http://localhost:5173';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/auth/google/callback'
);

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/tasks.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

// GET /auth/google — redirect to Google consent screen
router.get('/google', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
  });
  res.redirect(url);
});

// GET /auth/google/callback — handle OAuth callback
router.get('/google/callback', async (req, res) => {
  const { code, error } = req.query;
  if (error) return res.redirect(`${WEB_URL}/integrations?auth_error=${error}`);

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();

    // Save token to settings (await for Supabase adapter)
    await Promise.resolve(db.updateSettings({ google_token: JSON.stringify(tokens), google_sync: 1 }));

    console.log(`[Auth] Google connected for ${data.email}`);
    res.redirect(`${WEB_URL}/integrations?auth_success=google`);
  } catch (err) {
    console.error('[Auth] Google callback error:', err.message);
    res.redirect(`${WEB_URL}/integrations?auth_error=callback_failed`);
  }
});

// GET /auth/status — check if Google is connected
router.get('/status', async (req, res) => {
  const settings = await Promise.resolve(db.getSettings());
  res.json({
    google: Boolean(settings.google_sync && settings.google_token),
  });
});

// POST /auth/google/disconnect
router.post('/google/disconnect', async (req, res) => {
  await Promise.resolve(db.updateSettings({ google_token: null, google_sync: 0 }));
  res.json({ success: true });
});

module.exports = { router, oauth2Client };
