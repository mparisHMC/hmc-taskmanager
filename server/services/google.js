const { google } = require('googleapis');
const db = require('../db');
require('dotenv').config();

function getAuthClient() {
  const settings = db.getSettings();
  if (!settings.google_token) return null;

  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/auth/google/callback'
  );

  try {
    client.setCredentials(JSON.parse(settings.google_token));
    return client;
  } catch {
    return null;
  }
}

// Pull today's + this week's calendar events and upsert as tasks
async function syncCalendarEvents() {
  const auth = getAuthClient();
  if (!auth) {
    console.log('[Google] Not connected — skipping calendar sync');
    return [];
  }

  const calendar = google.calendar({ version: 'v3', auth });

  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setDate(now.getDate() + 7);

  try {
    const { data } = await calendar.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      timeMax: weekEnd.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 50,
    });

    const events = data.items || [];
    const synced = [];

    for (const event of events) {
      if (!event.summary) continue;
      const start = event.start.dateTime || event.start.date;
      const dueDate = start ? start.slice(0, 10) : null;

      // Is this event today (daily) or later this week (weekly)?
      const today = now.toISOString().slice(0, 10);
      const category = dueDate === today ? 'daily' : 'weekly';

      const task = db.upsertByExternalId({
        title: event.summary,
        notes: event.description ? event.description.slice(0, 200) : '',
        priority: 'medium',
        category,
        source: 'google',
        due: dueDate,
        external_id: 'google_cal_' + event.id,
      });
      synced.push(task);
    }

    console.log(`[Google] Synced ${synced.length} calendar events`);
    return synced;
  } catch (err) {
    console.error('[Google] Calendar sync error:', err.message);
    return [];
  }
}

// Pull Google Tasks and upsert
async function syncGoogleTasks() {
  const auth = getAuthClient();
  if (!auth) return [];

  const tasksApi = google.tasks({ version: 'v1', auth });

  try {
    const { data: listsData } = await tasksApi.tasklists.list({ maxResults: 10 });
    const lists = listsData.items || [];

    const synced = [];
    const today = new Date().toISOString().slice(0, 10);

    for (const list of lists) {
      const { data: tasksData } = await tasksApi.tasks.list({
        tasklist: list.id,
        showCompleted: false,
        maxResults: 50,
      });

      for (const t of (tasksData.items || [])) {
        if (!t.title) continue;
        const due = t.due ? t.due.slice(0, 10) : today;
        const category = due <= today ? 'daily' : 'weekly';

        const task = db.upsertByExternalId({
          title: t.title,
          notes: t.notes || '',
          priority: 'medium',
          category,
          source: 'google',
          due,
          external_id: 'google_task_' + t.id,
        });
        synced.push(task);
      }
    }

    console.log(`[Google] Synced ${synced.length} Google Tasks`);
    return synced;
  } catch (err) {
    console.error('[Google] Tasks sync error:', err.message);
    return [];
  }
}

async function syncAll() {
  const [calEvents, gTasks] = await Promise.all([syncCalendarEvents(), syncGoogleTasks()]);
  return { calEvents, gTasks };
}

module.exports = { syncCalendarEvents, syncGoogleTasks, syncAll };
