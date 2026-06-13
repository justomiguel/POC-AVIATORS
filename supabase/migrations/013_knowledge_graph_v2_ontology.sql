-- Aviators · grafo de conocimiento — migración a ontología v2.0
-- Ejecutar en SQL Editor de Supabase después de 012_knowledge_graph.sql.
--
-- Cambios:
--   • knowledge_graph_nodes.node_type: reemplaza tipos v1 (content, tag, stage,
--     pricing_model, client_label) por tipos v2 (success_case, proposal,
--     onboarding, presale, presentation_type, slide, globant_product,
--     client_product, feature, metric, testimonial). Conserva: client, industry.
--   • knowledge_graph_edges.relation_type: reemplaza relaciones v1 (belongs_to,
--     in_industry, tagged_with, has_stage, has_pricing_model) por relaciones v2
--     (pertenece_a, es_sobre, demuestra_valor_de, es_parte_de, puede_contener,
--     es_de, usa).
--
-- Precaución: elimina filas con tipos obsoletos antes de cambiar el constraint.

-- ─── 1. Limpiar nodos con tipos v1 obsoletos ─────────────────────────────────
-- (cascadea automáticamente a las aristas por ON DELETE CASCADE)

delete from knowledge_graph_nodes
where node_type in ('content', 'tag', 'stage', 'pricing_model', 'client_label');

-- ─── 2. Actualizar constraint de node_type ───────────────────────────────────

alter table knowledge_graph_nodes
  drop constraint if exists knowledge_graph_nodes_node_type_check;

alter table knowledge_graph_nodes
  add constraint knowledge_graph_nodes_node_type_check check (
    node_type in (
      'client',
      'industry',
      'presentation_type',
      'slide',
      'success_case',
      'proposal',
      'onboarding',
      'presale',
      'globant_product',
      'client_product',
      'feature',
      'metric',
      'testimonial'
    )
  );

-- ─── 3. Limpiar aristas con tipos v1 obsoletos ───────────────────────────────

delete from knowledge_graph_edges
where relation_type in (
  'belongs_to',
  'in_industry',
  'tagged_with',
  'has_stage',
  'has_pricing_model'
);

-- ─── 4. Actualizar constraint de relation_type ───────────────────────────────

alter table knowledge_graph_edges
  drop constraint if exists knowledge_graph_edges_relation_type_check;

alter table knowledge_graph_edges
  add constraint knowledge_graph_edges_relation_type_check check (
    relation_type in (
      'pertenece_a',
      'es_sobre',
      'demuestra_valor_de',
      'es_parte_de',
      'puede_contener',
      'es_de',
      'usa'
    )
  );
