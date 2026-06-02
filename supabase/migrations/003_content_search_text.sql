-- Aviators · texto de búsqueda denormalizado para matching semántico léxico
-- Ejecutar en SQL Editor de Supabase (después de 001_aviators_schema.sql).

alter table contents
  add column if not exists search_text text not null default '';

-- Reservado para embeddings vectoriales (fase 2: pgvector + API de embeddings).
alter table contents
  add column if not exists embedding jsonb;

comment on column contents.search_text is
  'Texto concatenado (título, resumen, tags, specific) para búsqueda por tokens.';
comment on column contents.embedding is
  'Futuro: vector de embedding para búsqueda semántica (pgvector).';

-- Backfill inicial desde columnas existentes.
update contents
set search_text = trim(
  concat_ws(
    ' ',
    title,
    summary,
    client_name,
    tags_csv,
    content_type,
    file_name,
    coalesce(specific::text, '')
  )
)
where search_text = '' or search_text is null;

create index if not exists contents_search_text_idx on contents (search_text);
