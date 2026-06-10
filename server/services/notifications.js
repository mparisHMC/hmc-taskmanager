const cron = require('node-cron');
const db = require('../db/database');
const slack = require('./slack');
const google = require('./google');

let jobs = [];

function parseTime(timeStr) {
  // "08:00" → { hour: 8, minute: 0 }
  const [h, m] = (timeStr || '08:00').split(':').map(Number);
  return { hour: h || 8, minute: m || 0 };
}

function dayNameToNumber(day) {
  const map = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
  return map[day] ?? 1;
}

function startAllJobs() {
  // Clear any existing jobs
  jobs.forEach(j => j.destroy());
  jobs = [];

  const settings = db.getSettings();
  const { hour, minute } = parseTime(settings.digest_time);
  const weekDay = dayNameToNumber(settings.review_day);

  // ─── Auto-seed daily tasks at midnight ───────────────────────────────────
  const seedDaily = cron.schedule('1 0 * * *', () => {
    console.log('[Cron] Auto-seeding daily tasks...');
    db.seedDailyTasksIfEmpty();
  }, { timezone: 'America/Chicago' });
  jobs.push(seedDaily);

  // ─── Auto-seed weekly tasks every Monday at midnight ─────────────────────
  const seedWeekly = cron.schedule('2 0 * * 1', () => {
    console.log('[Cron] Auto-seeding weekly tasks...');
    db.seedWeeklyTasksIfEmpty();
  }, { timezone: 'America/Chicago' });
  jobs.push(seedWeekly);

  // ─── Daily digest (Slack DM) ──────────────────────────────────────────────
  if (settings.daily_digest && settings.slack_alerts) {
    const digestJob = cron.schedule(`${minute} ${hour} * * 1-5`, async () => {
      console.log('[Cron] Sending daily digest...');
      await slack.sendDailyDigest();
    }, { timezone: 'America/Chicago' });
    jobs.push(digestJob);
    console.log(`[Cron] Daily digest scheduled at ${hour}:${String(minute).padStart(2,'0')} Mon-Fri`);
  }

  // ─── Weekly digest ────────────────────────────────────────────────────────
  if (settings.weekly_review && settings.slack_alerts) {
    const weeklyJob = cron.schedule(`${minute} ${hour} * * ${weekDay}`, async () => {
      console.log('[Cron] Sending weekly digest...');
      await slack.sendWeeklyDigest();
    }, { timezone: 'America/Chicago' });
    jobs.push(weeklyJob);
    console.log(`[Cron] Weekly digest scheduled at ${hour}:${String(minute).padStart(2,'0')} on day ${weekDay}`);
  }

  // ─── Overdue alert at 2pm weekdays ───────────────────────────────────────
  const overdueJob = cron.schedule('0 14 * * 1-5', async () => {
    console.log('[Cron] Checking for overdue tasks...');
    await slack.sendOverdueAlert();
  }, { timezone: 'America/Chicago' });
  jobs.push(overdueJob);

  // ─── Google sync every 30 minutes ────────────────────────────────────────
  const googleSyncJob = cron.schedule('*/30 * * * *', async () => {
    const s = db.getSettings();
    if (!s.google_sync) return;
    console.log('[Cron] Google sync...');
    await google.syncAll();
  });
  jobs.push(googleSyncJob);

  console.log(`[Cron] ${jobs.length} jobs started`);
}

// Restart jobs when settings change (e.g. digest time updated)
function restartJobs() {
  console.log('[Cron] Restarting jobs with updated settings...');
  startAllJobs();
}

module.exports = { startAllJobs, restartJobs };
