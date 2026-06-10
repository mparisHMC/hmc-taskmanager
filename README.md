# TaskFlow

Task manager for Mackenzie @ Health Market Connect.
Daily + weekly task views, Google Calendar/Slack pull, push alerts, mobile app.

---

## Stack

| Layer | Tech |
|-------|------|
| Backend | Node.js + Express + SQLite (better-sqlite3) |
| Web | React 18 + Vite |
| Mobile | Expo (React Native) |
| Auth | Google OAuth 2.0 (Passport.js) |
| Alerts | node-cron + Slack Bolt SDK |

---

## Quick Start

### 1. Clone / open the folder

```
TaskFlow/
├── server/     ← API + database + integrations
├── web/        ← React web app
└── mobile/     ← Expo mobile app
```

### 2. Copy and fill in env vars

```bash
cp .env.example .env
# then edit .env with your keys
```

### 3. Start the backend

```bash
cd server
npm install
npm run dev
# runs on http://localhost:3001
```

### 4. Start the web app

```bash
cd web
npm install
npm run dev
# opens http://localhost:5173
```

### 5. Start the mobile app

```bash
cd mobile
npm install
npx expo start
# scan QR with Expo Go app on your phone
```

---

## Getting API Keys

### Google (Calendar + Tasks)

1. Go to https://console.cloud.google.com
2. Create a project → Enable "Google Calendar API" and "Tasks API"
3. Credentials → Create OAuth 2.0 Client ID (Web application)
4. Add `http://localhost:3001/auth/google/callback` to Authorized redirect URIs
5. Copy Client ID and Secret to `.env`

### Slack

1. Go to https://api.slack.com/apps → Create New App
2. Add these Bot Token Scopes: `channels:history`, `chat:write`, `im:write`, `users:read`
3. Install app to your workspace
4. Copy Bot Token (`xoxb-...`) and Signing Secret to `.env`

---

## Features

- **Daily & Weekly task views** with priority, due date, progress tracking
- **Google Calendar sync** — meetings pulled as tasks automatically
- **Slack alerts** — DM you when tasks are overdue or coming up
- **Push notifications** — daily digest at your chosen time
- **Mobile app** — iOS and Android via Expo
- **Offline-first** — SQLite stores everything locally

---

## Project Structure

```
server/
├── index.js                 ← Express app entry
├── db/
│   ├── database.js          ← SQLite connection + helpers
│   └── schema.sql           ← Table definitions
├── routes/
│   ├── tasks.js             ← CRUD for tasks
│   ├── auth.js              ← Google OAuth flow
│   └── integrations.js      ← Google + Slack sync endpoints
└── services/
    ├── google.js            ← Google Calendar/Tasks API calls
    ├── slack.js             ← Slack Bolt app + alert logic
    └── notifications.js     ← Cron jobs for daily digest

web/
├── index.html
└── src/
    ├── App.jsx              ← Root with routing
    ├── api/                 ← Fetch wrappers for backend
    ├── components/          ← Reusable UI pieces
    ├── views/               ← Page-level components
    └── hooks/               ← useTasks, useAuth

mobile/
├── App.jsx                  ← Expo entry + navigation
└── src/
    ├── screens/             ← Daily, Weekly, Settings
    ├── components/          ← TaskCard, shared UI
    └── api/                 ← Shared API client
```
