-- Aviators · cola operativa de consultas no respondidas
-- Ejecutar en SQL Editor del proyecto Supabase.

alter table unanswered_queries
  add column if not exists queue_status text not null default 'open'
    check (queue_status in ('open', 'missing_content', 'resolved')),
  add column if not exists assigned_to_email text not null default '',
  add column if not exists assigned_to_name text not null default '',
  add column if not exists assigned_at timestamptz,
  add column if not exists assigned_by_email text not null default '',
  add column if not exists resolved_at timestamptz,
  add column if not exists resolved_by_email text not null default '',
  add column if not exists resolution_note text not null default '',
  add column if not exists suggested_content_type text not null default '';

create index if not exists unanswered_queries_queue_open_ts_idx
  on unanswered_queries (ts_ms desc)
  where queue_status in ('open', 'missing_content');

-- Filas existentes quedan en queue_status = 'open'.
