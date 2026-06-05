-- Aviators · arista contenido ↔ contenido (propuesta / success case del mismo cliente)
-- Ejecutar después de 012_knowledge_graph.sql.

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
      'related_content'
    )
  );

comment on column knowledge_graph_edges.relation_type is
  'related_content: vínculo entre contenidos del mismo cliente (p. ej. propuesta ↔ caso de éxito).';
