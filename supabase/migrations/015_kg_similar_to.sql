-- Aviators · arista semántica contenido ↔ contenido (pgvector)
-- Ejecutar después de 014_kg_edge_provenance.sql.

alter table knowledge_graph_edges
  drop constraint if exists knowledge_graph_edges_relation_type_check;

alter table knowledge_graph_edges
  add constraint knowledge_graph_edges_relation_type_check check (
    relation_type in (
      'belongs_to',
      'in_industry',
      'tagged_with',
      'has_stage',
      'has_pricing_model',
      'related_content',
      'similar_to'
    )
  );

create or replace function match_content_neighbors(
  source_id uuid,
  match_count int default 6,
  match_threshold float default 0.78
)
returns table (
  content_id uuid,
  similarity float
)
language sql
stable
as $$
  select
    c.content_id,
    (1 - (c.embedding <=> s.embedding))::float as similarity
  from contents c,
       contents s
  where s.content_id = source_id
    and c.content_id <> source_id
    and c.embedding is not null
    and s.embedding is not null
    and (1 - (c.embedding <=> s.embedding)) >= match_threshold
  order by c.embedding <=> s.embedding asc
  limit greatest(1, least(coalesce(match_count, 6), 20));
$$;

grant execute on function match_content_neighbors(uuid, int, float) to service_role;

comment on function match_content_neighbors(uuid, int, float) is
  'Vecinos semánticos de un contenido (cosine similarity sobre contents.embedding).';
