-- Aviators · relación estructural Studio → Offering
-- Ejecutar después de 017_kg_studio_offering_structural.sql.

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
      'has_offering',
      'from_studio',
      'studio_offers',
      'related_content',
      'similar_to',
      'delivers',
      'uses_technology',
      'achieved',
      'addresses_theme'
    )
  );

comment on column knowledge_graph_edges.relation_type is
  'Estructurales + LLM + studio_offers (Globant Studio comercializa un offering).';
