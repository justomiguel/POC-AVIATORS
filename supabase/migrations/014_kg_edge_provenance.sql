-- Aviators · provenance y peso en aristas del grafo de conocimiento
-- Ejecutar en SQL Editor de Supabase después de 013_knowledge_graph_related_content.sql.

alter table knowledge_graph_edges
  add column if not exists weight real not null default 1.0,
  add column if not exists source text not null default 'structural',
  add column if not exists payload jsonb not null default '{}'::jsonb;

create index if not exists knowledge_graph_edges_source_idx
  on knowledge_graph_edges (source);

comment on column knowledge_graph_edges.weight is
  'Peso de la arista (1.0 estructural; similitud coseno para embedding; confianza LLM).';
comment on column knowledge_graph_edges.source is
  'Procedencia: structural | embedding | llm.';
comment on column knowledge_graph_edges.payload is
  'Metadatos opcionales (modelo, umbral, hints de extracción).';
