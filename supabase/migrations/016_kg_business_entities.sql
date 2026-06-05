-- Aviators · entidades de negocio extraídas por LLM (grafo conceptual)
-- Ejecutar después de 015_kg_similar_to.sql.

alter table knowledge_graph_nodes
  drop constraint if exists knowledge_graph_nodes_node_type_check;

alter table knowledge_graph_nodes
  add constraint knowledge_graph_nodes_node_type_check check (
    node_type in (
      'content',
      'client',
      'client_label',
      'industry',
      'tag',
      'stage',
      'pricing_model',
      'offering',
      'technology',
      'outcome',
      'theme'
    )
  );

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
      'similar_to',
      'delivers',
      'uses_technology',
      'achieved',
      'addresses_theme'
    )
  );

comment on column knowledge_graph_nodes.node_type is
  'Tipos: catálogo (content, client, …) + conceptuales LLM (offering, technology, outcome, theme).';

comment on column knowledge_graph_edges.relation_type is
  'Estructurales + similar_to (embedding) + delivers/uses_technology/achieved/addresses_theme (LLM).';
