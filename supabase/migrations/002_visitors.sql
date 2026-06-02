-- Aviators · visitantes sin rol (pendientes de conversión a usuario)
-- Ejecutar en SQL Editor del proyecto Supabase.

create table if not exists visitors (
  email text primary key,
  display_name text not null default '',
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  visit_count integer not null default 1
);

create index if not exists visitors_last_seen_idx on visitors (last_seen_at desc);
create index if not exists visitors_email_lower_idx on visitors (lower(email));

alter table visitors disable row level security;
