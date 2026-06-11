const { App } = require('@slack/bolt');
const db = require('../db');
require('dotenv').config();

let slackApp = null;

function getSlackApp() {
  if (!slackApp && process.env.SLACK_BOT_TOKEN && process.env.SLACK_SIGNING_SECRET) {
    slackApp = new App({
      token: process.env.SLACK_BOT_TOKEN,
      signingSecret: process.env.SLACK_SIGNING_SECRET,
      socketMode: false,
    });
  }
  return slackApp;
}

// Send a DM to the configured user
async function sendDM(text, blocks) {
  const app = getSlackApp();
  if (!app) {
    console.log('[Slack] Not configured — skipping DM');
    return;
  }
  const userId = process.env.SLACK_USER_ID;
  if (!userId) {
    console.warn('[Slack] SLACK_USER_ID not set');
    return;
  }
  try {
    await app.client.chat.postMessage({
      channel: userId,
      text,
      blocks,
    });
    console.log(`[Slack] DM sent to ${userId}`);
  } catch (err) {
    console.error('[Slack] DM error:', err.message);
  }
}

// Build a Slack Block Kit digest message
function buildDigestBlocks(tasks, title) {
  const pending = tasks.filter(t => !t.done);
  const high = pending.filter(t => t.priority === 'high');
  const overdue = pending.filter(t => t.due && new Date(t.due + 'T00:00:00') < new Date(new Date().toDateString()));

  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: title, emoji: true },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${pending.length}* tasks remaining  ·  *${high.length}* high priority  ·  *${overdue.length}* overdue`,
      },
    },
    { type: 'divider' },
  ];

  // Show up to 8 pending tasks
  pending.slice(0, 8).forEach(t => {
    const overdueMark = t.due && new Date(t.due + 'T00:00:00') < new Date(new Date().toDateString()) ? ' ⚠️' : '';
    const prioEmoji = t.priority === 'high' ? '🔴' : t.priority === 'medium' ? '🟡' : '🟢';
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${prioEmoji} ${t.title}${overdueMark}${t.due ? '  _(' + t.due + ')_' : ''}`,
      },
    });
  });

  if (pending.length > 8) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `_...and ${pending.length - 8} more_` },
    });
  }

  return blocks;
}

// Send daily digest
async function sendDailyDigest() {
  const settings = db.getSettings();
  if (!settings.slack_alerts) return;

  const today = new Date().toISOString().slice(0, 10);
  const tasks = db.getAllTasks('daily').filter(t => !t.due || t.due === today);

  const dow = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  await sendDM(
    `Good morning! Here's your daily task digest for ${dow}`,
    buildDigestBlocks(tasks, `☀️ Daily digest — ${dow}`)
  );
}

// Send weekly digest
async function sendWeeklyDigest() {
  const settings = db.getSettings();
  if (!settings.slack_alerts) return;

  const tasks = db.getAllTasks('weekly');
  const week = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  await sendDM(
    `Good morning! Here's your weekly task digest — week of ${week}`,
    buildDigestBlocks(tasks, `📅 Weekly digest — week of ${week}`)
  );
}

// Send overdue alert
async function sendOverdueAlert() {
  const settings = db.getSettings();
  if (!settings.slack_alerts) return;

  const all = db.getAllTasks();
  const today = new Date().toDateString();
  const overdue = all.filter(t => !t.done && t.due && new Date(t.due + 'T00:00:00') < new Date(today));

  if (overdue.length === 0) return;

  const list = overdue.map(t => `• 🔴 *${t.title}* (due ${t.due})`).join('\n');
  await sendDM(
    `⚠️ You have ${overdue.length} overdue task${overdue.length > 1 ? 's' : ''}`,
    [
      { type: 'header', text: { type: 'plain_text', text: `⚠️ ${overdue.length} overdue task${overdue.length > 1 ? 's' : ''}`, emoji: true } },
      { type: 'section', text: { type: 'mrkdwn', text: list } },
    ]
  );
}

// Check if Slack is configured and reachable
async function testConnection() {
  const app = getSlackApp();
  if (!app) return { ok: false, error: 'Not configured' };
  try {
    const result = await app.client.auth.test();
    return { ok: result.ok, team: result.team, botName: result.user };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

module.exports = { sendDM, sendDailyDigest, sendWeeklyDigest, sendOverdueAlert, testConnection };
