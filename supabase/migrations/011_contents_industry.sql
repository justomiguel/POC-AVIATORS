-- Aviators · industria en catálogo de contenidos (success_case, proposal)
-- Ejecutar en SQL Editor de Supabase después de 010_quick_prompts_scope.sql.

alter table contents
  add column if not exists industry text not null default '';

comment on column contents.industry is
  'Industria del contenido (obligatoria en success_case; opcional en proposal). Distinta de clients.industry salvo coincidencia de cliente.';

-- Backfill desde maestro de clientes cuando el nombre coincide.
update contents c
set industry = trim(cl.industry)
from clients cl
where trim(c.industry) = ''
  and trim(c.client_name) <> ''
  and cl.normalized_name = lower(trim(c.client_name));

-- Actualizar search_text para incluir industria.
update contents
set search_text = trim(
  concat_ws(
    ' ',
    title,
    summary,
    client_name,
    industry,
    tags_csv,
    content_type,
    file_name,
    coalesce(specific::text, '')
  )
)
where trim(industry) <> '';

create index if not exists contents_industry_idx on contents (industry)
  where trim(industry) <> '';
