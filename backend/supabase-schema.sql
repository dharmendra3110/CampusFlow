-- CampusFlow v2 — Supabase Schema (Telegram version)
-- Run this in: Supabase Dashboard → SQL Editor → New Query

create table if not exists students (
  id                  uuid default gen_random_uuid() primary key,
  name                text not null,
  telegram_username   text not null unique,
  telegram_chat_id    bigint,
  gmail               text not null,
  calendar_connected  boolean default false,
  google_tokens       jsonb,
  created_at          timestamptz default now()
);

create table if not exists deadlines (
  id               uuid default gen_random_uuid() primary key,
  student_username text references students(telegram_username) on delete cascade,
  student_name     text,
  title            text not null,
  date             date not null,
  time             time not null,
  created_at       timestamptz default now()
);

alter table students  enable row level security;
alter table deadlines enable row level security;

create policy "Service role full access on students"  on students  for all using (true);
create policy "Service role full access on deadlines" on deadlines for all using (true);

create index if not exists deadlines_username_idx on deadlines(student_username);
create index if not exists deadlines_date_idx     on deadlines(date);
