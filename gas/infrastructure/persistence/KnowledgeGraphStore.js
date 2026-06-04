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
 * @param {Array<Object>} edges — {target_id, relation_type}
 */
function KnowledgeGraphStore_replaceEdgesForSource(sourceId, edges) {
  var sid = String(sourceId || '').trim();
  if (!sid) return;
  KnowledgeGraphStore_deleteEdgesBySource(sid);
  if (!edges || !edges.length) return;
  var now = new Date().toISOString();
  var rows = [];
  var i;
  for (i = 0; i < edges.length; i++) {
    var tgt = String(edges[i].target_id || '').trim();
    var rel = String(edges[i].relation_type || '').trim();
    if (!tgt || !rel) continue;
    rows.push({
      edge_id: Utilities.getUuid(),
      source_id: sid,
      target_id: tgt,
      relation_type: rel,
      updated_at: now,
    });
  }
  if (!rows.length) return;
  SupabaseRest_upsert(SUPABASE_TABLE.KNOWLEDGE_GRAPH_EDGES, rows, 'edge_id');
}
