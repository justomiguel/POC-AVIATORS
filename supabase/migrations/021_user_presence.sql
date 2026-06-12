-- Métricas · último acceso y conteo de sesiones por usuario autenticado
create table if not exists user_presence (
  email text primary key,
  display_name text not null default '',
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  session_count integer not null default 1
);

create index if not exists user_presence_last_seen_idx on user_presence (last_seen_at desc);

alter table user_presence disable row level security;
