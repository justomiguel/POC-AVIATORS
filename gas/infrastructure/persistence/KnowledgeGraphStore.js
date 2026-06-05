/**
 * @fileoverview Persistencia del grafo de conocimiento en Supabase.
 */

/**
 * @return {Array<Object>}
 */
function KnowledgeGraphStore_listAllNodes() {
  return SupabaseRest_select(
    SUPABASE_TABLE.KNOWLEDGE_GRAPH_NODES,
    'select=*&order=updated_at.desc',
  );
}

/**
 * @return {Array<Object>}
 */
function KnowledgeGraphStore_listAllEdges() {
  return SupabaseRest_select(
    SUPABASE_TABLE.KNOWLEDGE_GRAPH_EDGES,
    'select=*&order=updated_at.desc',
  );
}

/**
 * Bulk: nodos para búsqueda por label (ilike), con tope acotado.
 * @param {{cap?:number,searchQ?:string}} opts
 * @return {Array<Object>}
 */
function KnowledgeGraphStore_bulkListNodes(opts) {
  opts = opts || {};
  var cap = Math.min(2000, Math.max(50, Number(opts.cap) || 1000));
  var parts = ['select=*', 'limit=' + cap, 'order=updated_at.desc'];
  if (opts.searchQ) {
    parts.push('label=ilike.*' + encodeURIComponent(opts.searchQ.replace(/\*/g, '')) + '*');
  }
  return SupabaseRest_select(SUPABASE_TABLE.KNOWLEDGE_GRAPH_NODES, SupabaseRest_query_(parts));
}

/**
 * Carga paginada de TODOS los nodos del grafo (varias HTTP, sin IN en URL).
 * Evita el tope fijo de 500 por node_id.asc que dejaba fuera tags/industrias
 * y rompía aristas en el BFS en memoria.
 *
 * @param {{pageSize?:number,maxTotal?:number}} [opts]
 * @return {Array<Object>}
 */
function KnowledgeGraphStore_bulkListAllNodes(opts) {
  opts = opts || {};
  var pageSize = Math.min(500, Math.max(100, Number(opts.pageSize) || 500));
  var maxTotal = Math.min(15000, Math.max(500, Number(opts.maxTotal) || 15000));
  /** @type {Array<Object>} */
  var all = [];
  var offset = 0;
  while (all.length < maxTotal) {
    var q = SupabaseRest_query_([
      'select=*',
      'order=updated_at.desc',
      'offset=' + offset,
      'limit=' + pageSize,
    ]);
    var page = SupabaseRest_select(SUPABASE_TABLE.KNOWLEDGE_GRAPH_NODES, q);
    if (!page || !page.length) break;
    all = all.concat(page);
    if (page.length < pageSize) break;
    offset += pageSize;
  }
  return all;
}

/**
 * Carga paginada de TODAS las aristas (sin filtro IN por límite de URL).
 * order=edge_id.asc para paginación estable; un solo limit=10000 con
 * updated_at.desc descartaba aristas viejas.
 *
 * @param {{pageSize?:number,maxTotal?:number}} [opts]
 * @return {Array<Object>}
 */
function KnowledgeGraphStore_bulkListAllEdges(opts) {
  opts = opts || {};
  var pageSize = Math.min(1000, Math.max(200, Number(opts.pageSize) || 1000));
  var maxTotal = Math.min(50000, Math.max(1000, Number(opts.maxTotal) || 50000));
  /** @type {Array<Object>} */
  var all = [];
  var offset = 0;
  while (all.length < maxTotal) {
    var q = SupabaseRest_query_([
      'select=*',
      'order=edge_id.asc',
      'offset=' + offset,
      'limit=' + pageSize,
    ]);
    var page = SupabaseRest_select(SUPABASE_TABLE.KNOWLEDGE_GRAPH_EDGES, q);
    if (!page || !page.length) break;
    all = all.concat(page);
    if (page.length < pageSize) break;
    offset += pageSize;
  }
  return all;
}

/**
 * @param {string} nodeId
 * @return {Array<Object>}
 */
function KnowledgeGraphStore_listEdgesBySource(nodeId) {
  var id = String(nodeId || '').trim();
  if (!id) return [];
  var q = SupabaseRest_query_([
    'select=*',
    SupabaseRest_filter_('source_id', 'eq', id),
  ]);
  return SupabaseRest_select(SUPABASE_TABLE.KNOWLEDGE_GRAPH_EDGES, q);
}

/**
 * @param {string} nodeId
 * @return {Array<Object>}
 */
function KnowledgeGraphStore_listEdgesByTarget(nodeId) {
  var id = String(nodeId || '').trim();
  if (!id) return [];
  var q = SupabaseRest_query_([
    'select=*',
    SupabaseRest_filter_('target_id', 'eq', id),
  ]);
  return SupabaseRest_select(SUPABASE_TABLE.KNOWLEDGE_GRAPH_EDGES, q);
}

/**
 * @param {string} nodeType
 * @param {number} limit
 * @return {Array<Object>}
 */
function KnowledgeGraphStore_listNodesByType(nodeType, limit) {
  var nt = String(nodeType || '').trim();
  if (!nt) return [];
  var lim = Math.min(500, Math.max(1, Number(limit) || 100));
  var q = SupabaseRest_query_([
    'select=*',
    SupabaseRest_filter_('node_type', 'eq', nt),
    'order=updated_at.desc',
    'limit=' + lim,
  ]);
  return SupabaseRest_select(SUPABASE_TABLE.KNOWLEDGE_GRAPH_NODES, q);
}

/**
 * @param {string} nodeType
 * @param {number} skip
 * @param {number} limit
 * @return {Array<Object>}
 */
function KnowledgeGraphStore_listNodesPage(nodeType, skip, limit) {
  var nt = String(nodeType || '').trim();
  if (!nt) return [];
  var s = Math.max(0, Number(skip) || 0);
  var lim = Math.min(100, Math.max(1, Number(limit) || 25));
  var q = SupabaseRest_query_([
    'select=*',
    SupabaseRest_filter_('node_type', 'eq', nt),
    'order=node_id.asc',
    'offset=' + s,
    'limit=' + lim,
  ]);
  return SupabaseRest_select(SUPABASE_TABLE.KNOWLEDGE_GRAPH_NODES, q);
}

/**
 * Nodos candidatos a poda (tipos de referencia sin contenido propio).
 * @param {number} skip
 * @param {number} limit
 * @return {Array<Object>}
 */
function KnowledgeGraphStore_listPrunableNodesPage(skip, limit) {
  var s = Math.max(0, Number(skip) || 0);
  var lim = Math.min(50, Math.max(1, Number(limit) || 20));
  var q = SupabaseRest_query_([
    'select=node_id,node_type',
    SupabaseRest_filter_(
      'node_type',
      'in',
      '(tag,industry,stage,pricing_model,client_label,offering,technology,outcome,theme)',
    ),
    'order=node_type.asc,node_id.asc',
    'offset=' + s,
    'limit=' + lim,
  ]);
  return SupabaseRest_select(SUPABASE_TABLE.KNOWLEDGE_GRAPH_NODES, q);
}

/**
 * @param {Array<string>} nodeIds
 * @return {Array<Object>}
 */
function KnowledgeGraphStore_getNodesByIds(nodeIds) {
  var ids = nodeIds || [];
  if (!ids.length) return [];
  var quoted = [];
  var i;
  for (i = 0; i < ids.length && quoted.length < 80; i++) {
    var id = String(ids[i] || '').trim();
    if (!id) continue;
    quoted.push('"' + id.replace(/"/g, '') + '"');
  }
  if (!quoted.length) return [];
  var q = SupabaseRest_query_([
    'select=*',
    SupabaseRest_filter_('node_id', 'in', '(' + quoted.join(',') + ')'),
  ]);
  return SupabaseRest_select(SUPABASE_TABLE.KNOWLEDGE_GRAPH_NODES, q);
}

/**
 * @param {string} nodeId
 * @return {Object|null}
 */
function KnowledgeGraphStore_getNode(nodeId) {
  var id = String(nodeId || '').trim();
  if (!id) return null;
  var q = SupabaseRest_query_([
    'select=*',
    SupabaseRest_filter_('node_id', 'eq', id),
    'limit=1',
  ]);
  var rows = SupabaseRest_select(SUPABASE_TABLE.KNOWLEDGE_GRAPH_NODES, q);
  return rows.length ? rows[0] : null;
}

/**
 * @param {Object} row
 * @return {Object}
 */
function KnowledgeGraphStore_upsertNode(row) {
  var payload = {
    node_id: String(row.node_id || '').trim(),
    node_type: String(row.node_type || '').trim(),
    label: String(row.label || '').trim(),
    payload: row.payload && typeof row.payload === 'object' ? row.payload : {},
    updated_at: row.updated_at || new Date().toISOString(),
  };
  if (!payload.node_id || !payload.node_type) {
    throw new Error('KnowledgeGraphStore_upsertNode: node_id y node_type requeridos');
  }
  var saved = SupabaseRest_upsert(
    SUPABASE_TABLE.KNOWLEDGE_GRAPH_NODES,
    payload,
    'node_id',
  );
  if (Array.isArray(saved) && saved.length) return saved[0];
  return payload;
}

/**
 * @param {string} nodeId
 */
function KnowledgeGraphStore_deleteNode(nodeId) {
  var id = String(nodeId || '').trim();
  if (!id) return;
  SupabaseRest_delete(
    SUPABASE_TABLE.KNOWLEDGE_GRAPH_NODES,
    SupabaseRest_filter_('node_id', 'eq', id),
  );
}

/**
 * @param {string} sourceId
 */
function KnowledgeGraphStore_deleteEdgesBySource(sourceId) {
  var sid = String(sourceId || '').trim();
  if (!sid) return;
  SupabaseRest_delete(
    SUPABASE_TABLE.KNOWLEDGE_GRAPH_EDGES,
    SupabaseRest_filter_('source_id', 'eq', sid),
  );
}

/**
 * @param {string} nodeId
 */
function KnowledgeGraphStore_deleteEdgesTouchingNode(nodeId) {
  var nid = String(nodeId || '').trim();
  if (!nid) return;
  SupabaseRest_delete(
    SUPABASE_TABLE.KNOWLEDGE_GRAPH_EDGES,
    SupabaseRest_filter_('source_id', 'eq', nid),
  );
  SupabaseRest_delete(
    SUPABASE_TABLE.KNOWLEDGE_GRAPH_EDGES,
    SupabaseRest_filter_('target_id', 'eq', nid),
  );
}

/**
 * @param {string} sourceId
 * @param {string} provenance structural|embedding|llm
 * @param {Array<Object>} edges — {target_id, relation_type, weight?, source?, payload?}
 */
function KnowledgeGraphStore_replaceEdgesForSourceByProvenance_(sourceId, provenance, edges) {
  var sid = String(sourceId || '').trim();
  var prov = String(provenance || 'structural').trim() || 'structural';
  if (!sid) return;
  var q = SupabaseRest_query_([
    SupabaseRest_filter_('source_id', 'eq', sid),
    SupabaseRest_filter_('source', 'eq', prov),
  ]);
  SupabaseRest_delete(SUPABASE_TABLE.KNOWLEDGE_GRAPH_EDGES, q);
  if (!edges || !edges.length) return;
  var now = new Date().toISOString();
  var rows = [];
  var i;
  for (i = 0; i < edges.length; i++) {
    var tgt = String(edges[i].target_id || '').trim();
    var rel = String(edges[i].relation_type || '').trim();
    if (!tgt || !rel) continue;
    var weight = Number(edges[i].weight);
    if (isNaN(weight) || weight <= 0) weight = 1.0;
    var edgeSource = String(edges[i].source || prov).trim() || prov;
    var payload =
      edges[i].payload && typeof edges[i].payload === 'object' && !Array.isArray(edges[i].payload)
        ? edges[i].payload
        : {};
    rows.push({
      edge_id: Utilities.getUuid(),
      source_id: sid,
      target_id: tgt,
      relation_type: rel,
      weight: weight,
      source: edgeSource,
      payload: payload,
      updated_at: now,
    });
  }
  if (!rows.length) return;
  SupabaseRest_upsert(SUPABASE_TABLE.KNOWLEDGE_GRAPH_EDGES, rows, 'edge_id');
}

/**
 * @param {string} sourceId
 * @param {Array<Object>} edges — {target_id, relation_type}
 */
function KnowledgeGraphStore_replaceEdgesForSource(sourceId, edges) {
  KnowledgeGraphStore_replaceEdgesForSourceByProvenance_(sourceId, 'structural', edges);
}

/**
 * @param {string} nodeType
 * @return {number}
 */
function KnowledgeGraphStore_countNodesByType(nodeType) {
  var nt = String(nodeType || '').trim();
  if (!nt) return 0;
  var q = SupabaseRest_query_([
    'select=node_id',
    SupabaseRest_filter_('node_type', 'eq', nt),
    'limit=0',
  ]);
  return SupabaseRest_count(SUPABASE_TABLE.KNOWLEDGE_GRAPH_NODES, q);
}

/**
 * @return {number}
 */
function KnowledgeGraphStore_countAllNodes() {
  var q = SupabaseRest_query_(['select=node_id', 'limit=0']);
  return SupabaseRest_count(SUPABASE_TABLE.KNOWLEDGE_GRAPH_NODES, q);
}

/**
 * @param {string} relationType
 * @return {number}
 */
function KnowledgeGraphStore_countEdgesByRelation(relationType) {
  var rel = String(relationType || '').trim();
  if (!rel) return 0;
  var q = SupabaseRest_query_([
    'select=edge_id',
    SupabaseRest_filter_('relation_type', 'eq', rel),
    'limit=0',
  ]);
  return SupabaseRest_count(SUPABASE_TABLE.KNOWLEDGE_GRAPH_EDGES, q);
}

/**
 * @return {number}
 */
function KnowledgeGraphStore_countAllEdges() {
  var q = SupabaseRest_query_(['select=edge_id', 'limit=0']);
  return SupabaseRest_count(SUPABASE_TABLE.KNOWLEDGE_GRAPH_EDGES, q);
}

/**
 * @param {{nodeType?:string,searchQuery?:string}} opts
 * @return {Array<string>}
 */
function KnowledgeGraphStore_entitiesQueryParts_(opts) {
  opts = opts || {};
  var parts = ['select=node_id,node_type,label,payload,updated_at'];
  var nt = String(opts.nodeType || '').trim();
  if (nt) parts.push(SupabaseRest_filter_('node_type', 'eq', nt));
  var q = String(opts.searchQuery || '').trim();
  if (q) {
    var escaped = SupabaseRest_escapeFilterValue_(q.replace(/\*/g, ''));
    parts.push(SupabaseRest_filter_('label', 'ilike', '*' + escaped + '*'));
  }
  return parts;
}

/**
 * @param {{nodeType?:string,searchQuery?:string}} opts
 * @return {number}
 */
function KnowledgeGraphStore_countEntities(opts) {
  var parts = KnowledgeGraphStore_entitiesQueryParts_(opts || {});
  parts.push('limit=0');
  return SupabaseRest_count(
    SUPABASE_TABLE.KNOWLEDGE_GRAPH_NODES,
    SupabaseRest_query_(parts),
  );
}

/**
 * @param {{nodeType?:string,searchQuery?:string,skip?:number,limit?:number}} opts
 * @return {Array<Object>}
 */
function KnowledgeGraphStore_listEntitiesPage(opts) {
  opts = opts || {};
  var s = Math.max(0, Number(opts.skip) || 0);
  var lim = Math.min(100, Math.max(1, Number(opts.limit) || 25));
  var parts = KnowledgeGraphStore_entitiesQueryParts_(opts);
  parts.push('order=label.asc,node_id.asc');
  parts.push('offset=' + s);
  parts.push('limit=' + lim);
  return SupabaseRest_select(
    SUPABASE_TABLE.KNOWLEDGE_GRAPH_NODES,
    SupabaseRest_query_(parts),
  );
}
