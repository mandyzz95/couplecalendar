-- Run this once in Supabase: Dashboard → SQL Editor → New query → paste → Run.

create table if not exists calendars (
  id          text primary key,              -- the secret part of the share link
  name_a      text not null,
  name_b      text not null,
  created_at  timestamptz not null default now()
);

create table if not exists events (
  id          uuid primary key default gen_random_uuid(),
  calendar_id text not null references calendars(id) on delete cascade,
  date        text not null,                 -- YYYY-MM-DD (the couple's local date)
  start_time  text not null,                 -- HH:MM
  end_time    text not null,                 -- HH:MM (same as start for a time point)
  title       text not null,
  who         text not null check (who in ('a', 'b', 'both')),
  kind        text not null default 'range' check (kind in ('range', 'point')),
  series_id   text,                          -- shared by every class of a repeating series
  location    text,                          -- optional place
  created_by  text,
  created_at  timestamptz not null default now()
);
create index if not exists events_calendar_idx on events (calendar_id, date);

create table if not exists messages (
  id          uuid primary key default gen_random_uuid(),
  calendar_id text not null references calendars(id) on delete cascade,
  role        text not null check (role in ('user', 'agent')),
  from_who    text,
  text        text not null,
  ts          bigint not null
);
create index if not exists messages_calendar_idx on messages (calendar_id, ts);

create table if not exists ai_usage (
  calendar_id text not null references calendars(id) on delete cascade,
  day         text not null,
  count       int  not null default 0,
  primary key (calendar_id, day)
);

-- Only the website's server (secret key) may read or write. Nobody can use the public key to read your data.
alter table calendars enable row level security;
alter table events    enable row level security;
alter table messages  enable row level security;
alter table ai_usage  enable row level security;

-- Upgrading an older database? Run this line once to add the place field:
alter table events add column if not exists location text;
