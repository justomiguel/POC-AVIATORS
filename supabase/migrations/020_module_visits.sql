-- Métricas · visitas a módulos de la app (navegación por pantalla)
create table if not exists module_visits (
  visit_id uuid primary key,
  ts_iso timestamptz not null,
  ts_ms bigint not null,
  year_month text not null,
  user_email text not null,
  user_display_name text not null default '',
  role_key text not null default '',
  module_key text not null
);

create index if not exists module_visits_ts_ms_idx on module_visits (ts_ms desc);
create index if not exists module_visits_module_key_idx on module_visits (module_key);
create index if not exists module_visits_user_email_idx on module_visits (user_email);

alter table module_visits disable row level security;
