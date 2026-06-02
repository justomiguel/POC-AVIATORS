-- Aviators · embeddings vectoriales (pgvector) para búsqueda semántica
-- Ejecutar en SQL Editor de Supabase (después de 003_content_search_text.sql).

create extension if not exists vector;

-- Reemplaza el placeholder jsonb de la fase 1.
alter table contents drop column if exists embedding;

alter table contents
  add column if not exists embedding vector(1536),
  add column if not exists embedding_model text not null default '',
  add column if not exists embedding_updated_at timestamptz;

comment on column contents.embedding is
  'Vector de embedding (cosine) generado desde search_text vía Globant /embeddings.';
comment on column contents.embedding_model is
  'Modelo provider/modelId usado al generar embedding (ej. openai/text-embedding-3-small).';
comment on column contents.embedding_updated_at is
  'Última vez que se regeneró el embedding.';

create index if not exists contents_embedding_hnsw_idx
  on contents using hnsw (embedding vector_cosine_ops)
  where embedding is not null;

-- Similitud coseno: 1 - (a <=> b). Umbral típico 0.55–0.65 según calidad del corpus.
create or replace function match_contents_semantic(
  query_embedding vector(1536),
  match_count int default 8,
  match_threshold float default 0.55
)
returns table (
  content_id uuid,
  content_type text,
  title text,
  summary text,
  client_name text,
  tags_csv text,
  file_name text,
  drive_file_url text,
  globant_document_id text,
  globant_profile_name text,
  specific jsonb,
  similarity float
)
language sql
stable
as $$
  select
    c.content_id,
    c.content_type,
    c.title,
    c.summary,
    c.client_name,
    c.tags_csv,
    c.file_name,
    c.drive_file_url,
    c.globant_document_id,
    c.globant_profile_name,
    c.specific,
    (1 - (c.embedding <=> query_embedding))::float as similarity
  from contents c
  where c.embedding is not null
    and trim(c.summary) <> ''
    and (1 - (c.embedding <=> query_embedding)) >= match_threshold
  order by c.embedding <=> query_embedding asc
  limit greatest(1, least(coalesce(match_count, 8), 25));
$$;

grant execute on function match_contents_semantic(vector(1536), int, float) to service_role;
