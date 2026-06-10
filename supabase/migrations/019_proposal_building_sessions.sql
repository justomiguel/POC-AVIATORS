-- Propuestas armadas por usuario (brief, materiales, respuestas IA, artefactos Drive)

create table if not exists proposal_building_sessions (
  session_id uuid primary key default gen_random_uuid(),
  user_email text not null,
  status text not null default 'in_progress'
    check (status in ('in_progress', 'completed', 'failed')),
  builder_step text not null default 'materials',
  title text not null default '',
  client_name text not null default '',
  industry_key text not null default '',
  proposal_name text not null default '',
  rfp_deadline text not null default '',
  commercial_model text not null default '',
  project_summary text not null default '',
  draft_brief_json jsonb not null default '{}'::jsonb,
  validated_brief_json jsonb,
  materials_json jsonb not null default '[]'::jsonb,
  ai_responses_json jsonb not null default '[]'::jsonb,
  studio_recommendations_json jsonb not null default '[]'::jsonb,
  context_json jsonb not null default '{}'::jsonb,
  deck_file_id text not null default '',
  deck_file_url text not null default '',
  deck_file_name text not null default '',
  checklist_file_id text not null default '',
  checklist_file_url text not null default '',
  checklist_file_name text not null default '',
  package_folder_id text not null default '',
  package_folder_url text not null default '',
  package_folder_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists proposal_building_sessions_user_updated_idx
  on proposal_building_sessions (user_email, updated_at desc);

create index if not exists proposal_building_sessions_user_status_idx
  on proposal_building_sessions (user_email, status);

alter table proposal_building_sessions disable row level security;
