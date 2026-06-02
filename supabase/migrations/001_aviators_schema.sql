-- Aviators · esquema operativo (Postgres / Supabase)
-- Ejecutar en SQL Editor del proyecto Supabase antes de configurar Script Properties.

create extension if not exists "pgcrypto";

-- Roles (directorio de acceso; única fuente para permisos de la Web App)
-- role_key canónico: admin | presales | manager | tech | client_partner | miembro
create table if not exists roles (
  email text primary key,
  role_label text not null default 'Miembro',
  role_key text not null default 'miembro',
  updated_at timestamptz not null default now()
);

create index if not exists roles_email_lower_idx on roles (lower(email));

-- Maestro de clientes
create table if not exists clients (
  client_id uuid primary key default gen_random_uuid(),
  client_name text not null,
  normalized_name text not null,
  industry text not null default '',
  country text not null default '',
  main_contact_name text not null default '',
  main_contact_email text not null default '',
  logo_url text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  created_by text not null default '',
  updated_at timestamptz not null default now()
);

create unique index if not exists clients_normalized_name_uidx on clients (normalized_name);

-- Catálogo de contenidos (common + specific en jsonb)
create table if not exists contents (
  content_id uuid primary key,
  content_type text not null check (
    content_type in ('proposal', 'success_case', 'client', 'onboarding')
  ),
  title text not null default '',
  summary text not null default '',
  client_name text not null default '',
  tags_csv text not null default '',
  file_name text not null default '',
  mime_type text not null default '',
  drive_file_id text not null default '',
  drive_file_url text not null default '',
  globant_profile_name text not null default '',
  globant_document_id text not null default '',
  uploaded_by text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  specific jsonb not null default '{}'::jsonb
);

create index if not exists contents_type_updated_idx on contents (content_type, updated_at desc);
create index if not exists contents_client_name_idx on contents (client_name);

-- Configuración clave-valor (tags controlados, etc.)
create table if not exists app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Métricas · eventos de uso
create table if not exists usage_events (
  event_id uuid primary key,
  question_id uuid not null,
  ts_iso timestamptz not null,
  ts_ms bigint not null,
  year_month text not null,
  user_email text not null,
  user_display_name text not null default '',
  role_key text not null default '',
  mode text not null default 'chat',
  agent_id text not null default '',
  agent_name text not null default '',
  question_text text not null default '',
  is_unanswered boolean not null default false,
  unanswered_code text not null default ''
);

create index if not exists usage_events_ts_ms_idx on usage_events (ts_ms desc);
create index if not exists usage_events_question_id_idx on usage_events (question_id);

-- Métricas · preguntas no respondidas
create table if not exists unanswered_queries (
  event_id uuid primary key,
  question_id uuid not null,
  ts_iso timestamptz not null,
  ts_ms bigint not null,
  user_email text not null,
  user_display_name text not null default '',
  role_key text not null default '',
  mode text not null default 'chat',
  agent_id text not null default '',
  agent_name text not null default '',
  question_text text not null default '',
  unanswered_code text not null default ''
);

create index if not exists unanswered_queries_ts_ms_idx on unanswered_queries (ts_ms desc);

-- Métricas · feedback
create table if not exists feedback_events (
  feedback_id uuid primary key default gen_random_uuid(),
  event_id uuid not null unique,
  ts_iso timestamptz not null default now(),
  user_email text not null,
  role_key text not null default '',
  rating text not null check (rating in ('up', 'down')),
  agent_id text not null default '',
  agent_name text not null default '',
  question_text text not null default ''
);

-- Historial de chat
create table if not exists chat_conversations (
  conv_id uuid primary key,
  user_email text not null,
  ts_created timestamptz not null default now(),
  title text not null default '',
  messages_json jsonb not null default '[]'::jsonb
);

create index if not exists chat_conversations_user_ts_idx
  on chat_conversations (user_email, ts_created desc);

-- Prompts rápidos del chat
create table if not exists quick_prompts (
  id text primary key,
  es text not null default '',
  en text not null default '',
  sort_order integer not null default 0
);

-- Catálogo API de agentes (model / strategy)
create table if not exists agent_api_catalog (
  id bigserial primary key,
  model text not null default '',
  strategy text not null default ''
);

-- RLS: deshabilitado; acceso solo vía service_role desde Apps Script (servidor).
alter table roles disable row level security;
alter table clients disable row level security;
alter table contents disable row level security;
alter table app_settings disable row level security;
alter table usage_events disable row level security;
alter table unanswered_queries disable row level security;
alter table feedback_events disable row level security;
alter table chat_conversations disable row level security;
alter table quick_prompts disable row level security;
alter table agent_api_catalog disable row level security;
