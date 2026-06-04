-- Aviators · grafo de conocimiento (nodos y aristas explícitas)
-- Ejecutar en SQL Editor de Supabase después de 011_contents_industry.sql.

create table if not exists knowledge_graph_nodes (
  node_id text primary key,
  node_type text not null check (
    node_type in (
      'content',
      'client',
      'client_label',
      'industry',
      'tag',
      'stage',
      'pricing_model'
    )
  ),
  label text not null default '',
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists knowledge_graph_nodes_type_idx
  on knowledge_graph_nodes (node_type);

create index if not exists knowledge_graph_nodes_updated_idx
  on knowledge_graph_nodes (updated_at desc);

create table if not exists knowledge_graph_edges (
  edge_id uuid primary key default gen_random_uuid(),
  source_id text not null references knowledge_graph_nodes (node_id) on delete cascade,
  target_id text not null references knowledge_graph_nodes (node_id) on delete cascade,
  relation_type text not null check (
    relation_type in (
      'belongs_to',
      'in_industry',
      'tagged_with',
      'has_stage',
      'has_pricing_model'
    )
  ),
  updated_at timestamptz not null default now(),
  unique (source_id, target_id, relation_type)
);

create index if not exists knowledge_graph_edges_source_idx
  on knowledge_graph_edges (source_id);

create index if not exists knowledge_graph_edges_target_idx
  on knowledge_graph_edges (target_id);

create index if not exists knowledge_graph_edges_relation_idx
  on knowledge_graph_edges (relation_type);

comment on table knowledge_graph_nodes is
  'Nodos del grafo de conocimiento Aviators (contenidos, clientes, tags, industria, etc.).';

comment on table knowledge_graph_edges is
  'Aristas tipadas entre nodos del grafo de conocimiento.';
