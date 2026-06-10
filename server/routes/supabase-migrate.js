/**
 * Supabase Migration
 *
 * Run this ONCE to switch from SQLite to Supabase.
 * After running: set USE_SUPABASE=true in your .env
 *
 * Usage:
 *   node routes/supabase-migrate.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env first');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const SCHEMA = `
-- Run this in your Supabase SQL editor first:

create table if not exists tasks (
  id          bigserial primary key,
  title       text not null,
  notes       text default '',
  priority    text not null default 'medium' check (priority in ('high','medium','low')),
  category    text not null default 'daily' check (category in ('daily','weekly')),
  source      text not null default 'manual',
  done        boolean not null default false,
  due         date,
  external_id text unique,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table if not exists settings (
  id              bigserial primary key,
  notifications   boolean default true,
  daily_digest    boolean default true,
  digest_time     text default '08:00',
  weekly_review   boolean default true,
  review_day      text default 'Monday',
  slack_alerts    boolean default true,
  google_sync     boolean default false,
  google_token    text,
  updated_at      timestamptz default now()
);

insert into settings (id) values (1) on conflict do nothing;

-- Enable Row Level Security (optional but recommended)
alter table tasks enable row level security;
alter table settings enable row level security;
`;

async function migrate() {
  console.log('Supabase schema to run in SQL editor:');
  console.log('─'.repeat(60));
  console.log(SCHEMA);
  console.log('─'.repeat(60));
  console.log('\nOnce the schema is created, update your .env:');
  console.log('  SUPABASE_URL=https://your-project.supabase.co');
  console.log('  SUPABASE_ANON_KEY=your-anon-key');
  console.log('  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  console.log('  USE_SUPABASE=true');
  console.log('\nThen install the Supabase client:');
  console.log('  npm install @supabase/supabase-js');
}

migrate();
