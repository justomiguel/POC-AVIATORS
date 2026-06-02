-- Aviators · solicitudes de acceso de visitantes
-- Ejecutar en SQL Editor del proyecto Supabase.

create table if not exists access_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  display_name text not null default '',
  desired_role_key text not null,
  desired_role_label text not null default '',
  reason text not null default '',
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'dismissed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewed_by_email text not null default '',
  reviewed_at timestamptz
);

create index if not exists access_requests_created_idx
  on access_requests (created_at desc);

create index if not exists access_requests_status_created_idx
  on access_requests (status, created_at desc);

create unique index if not exists access_requests_pending_email_uidx
  on access_requests (lower(email))
  where status = 'pending';

alter table access_requests disable row level security;
