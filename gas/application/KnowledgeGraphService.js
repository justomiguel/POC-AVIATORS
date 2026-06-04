/**
 * @fileoverview Grafo de conocimiento: sincronización y consulta.
 */

/** @type {number} */
var KNOWLEDGE_GRAPH_MAX_NODES_DEFAULT = 150;

/** @type {number} */
var KNOWLEDGE_GRAPH_MAX_NODES_CAP = 300;

/** @type {number} */
var KNOWLEDGE_GRAPH_REBUILD_BATCH_MAX = 50;

/** @type {number} */
var KNOWLEDGE_GRAPH_BFS_DEPTH_DEFAULT = 2;

/** @type {number} */
var KNOWLEDGE_GRAPH_BFS_DEPTH_CAP = 4;

/** @type {number} */
var KNOWLEDGE_GRAPH_HUB_SEED_LIMIT = 30;

/**
 * @return {void}
 */
function KnowledgeGraph_requireAdmin_() {
  AdminAuth_requireAdmin();
}

/**
 * @return {void}
 */
function KnowledgeGraph_requireView_() {
  var email = ('' + Session.getActiveUser().getEmail()).trim();
  if (!email) {
    throw new Error(
      UiStrings_t(UiStrings_activeLocale_(), 'session_email_no_capture'),
    );
  }
  if (!AdminAuth_emailCanViewKnowledgeGraph(email)) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_kg_forbidden'));
  }
}

/**
 * @param {string} text
 * @return {string}
 */
function KnowledgeGraph_slug_(text) {
  var s = String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return s || 'unknown';
}

/**
 * @param {string} prefix
 * @param {string} key
 * @return {string}
 */
function KnowledgeGraph_nodeId_(prefix, key) {
  return String(prefix || '').trim() + ':' + String(key || '').trim();
}

/**
 * @param {string} nodeType
 * @param {string} label
 * @param {Object} payload
 * @return {Object}
 */
function KnowledgeGraph_buildNodeRow_(nodeType, label, payload) {
  return {
    node_type: nodeType,
    label: String(label || '').trim(),
    payload: payload || {},
    updated_at: new Date().toISOString(),
  };
}

/**
 * @param {string} industry
 * @return {{nodeId:string, label:string}|null}
 */
function KnowledgeGraph_ensureIndustryNode_(industry) {
  var ind = String(industry || '').trim();
  if (!ind) return null;
  var slug = KnowledgeGraph_slug_(ind);
  var nodeId = KnowledgeGraph_nodeId_('industry', slug);
  KnowledgeGraphStore_upsertNode(
    Object.assign(KnowledgeGraph_buildNodeRow_('industry', ind, { industry: ind, slug: slug }), {
      node_id: nodeId,
    }),
  );
  return { nodeId: nodeId, label: ind };
}

/**
 * @param {string} tagDisplay
 * @return {{nodeId:string, label:string}|null}
 */
function KnowledgeGraph_ensureTagNode_(tagDisplay) {
  var disp =
    typeof ContentExtraction_toCamelTag_ === 'function'
      ? ContentExtraction_toCamelTag_(tagDisplay)
      : String(tagDisplay || '').trim();
  if (!disp) return null;
  var key = ContentExtraction_tagKey_(disp);
  if (!key) return null;
  var nodeId = KnowledgeGraph_nodeId_('tag', key);
  KnowledgeGraphStore_upsertNode(
    Object.assign(KnowledgeGraph_buildNodeRow_('tag', disp, { tag_key: key }), {
      node_id: nodeId,
    }),
  );
  return { nodeId: nodeId, label: disp };
}

/**
 * @param {string} stage
 * @return {{nodeId:string, label:string}|null}
 */
function KnowledgeGraph_ensureStageNode_(stage) {
  var st = String(stage || '').trim().toUpperCase();
  if (!st) return null;
  var nodeId = KnowledgeGraph_nodeId_('stage', st);
  KnowledgeGraphStore_upsertNode(
    Object.assign(KnowledgeGraph_buildNodeRow_('stage', st, { stage: st }), {
      node_id: nodeId,
    }),
  );
  return { nodeId: nodeId, label: st };
}

/**
 * @param {string} pricingModel
 * @return {{nodeId:string, label:string}|null}
 */
function KnowledgeGraph_ensurePricingNode_(pricingModel) {
  var pm = String(pricingModel || '').trim().toUpperCase();
  if (!pm) return null;
  var nodeId = KnowledgeGraph_nodeId_('pricing', pm);
  KnowledgeGraphStore_upsertNode(
    Object.assign(
      KnowledgeGraph_buildNodeRow_('pricing_model', pm, { pricing_model: pm }),
      { node_id: nodeId },
    ),
  );
  return { nodeId: nodeId, label: pm };
}

/**
 * @param {Object} row — fila contents de Supabase
 */
function KnowledgeGraph_syncContent_(contentId) {
  var id = String(contentId || '').trim();
  if (!id) return;
  var row = ContentCatalogStore_getById(id);
  if (!row) {
    KnowledgeGraph_removeContent_(id);
    return;
  }

  var ctype = String(row.content_type || '').trim();
  var title = String(row.title || '').trim() || String(row.file_name || '').trim() || id;
  var clientName = String(row.client_name || '').trim();
  var industry = String(row.industry || '').trim();
  var tags = ContentCatalog_csvToTags_(String(row.tags_csv || ''));
  var specific = ContentCatalogStore_rowToSpecific_(row);
  var now = new Date().toISOString();

  var contentNodeId = KnowledgeGraph_nodeId_('content', id);
  KnowledgeGraphStore_upsertNode({
    node_id: contentNodeId,
    node_type: 'content',
    label: title,
    payload: {
      content_id: id,
      content_type: ctype,
      title: title,
      client_name: clientName,
      industry: industry,
      updated_at: String(row.updated_at || now),
    },
    updated_at: now,
  });

  /** @type {Array<Object>} */
  var edges = [];

  if (clientName && ctype !== 'onboarding') {
    var clientHit = ClientsMaster_findByName(clientName);
    if (clientHit && clientHit.client_id) {
      var clientNodeId = KnowledgeGraph_nodeId_('client', clientHit.client_id);
      KnowledgeGraphStore_upsertNode({
        node_id: clientNodeId,
        node_type: 'client',
        label: String(clientHit.client_name || clientName),
        payload: {
          client_id: String(clientHit.client_id),
          normalized_name: String(clientHit.normalized_name || ''),
        },
        updated_at: now,
      });
      if (String(clientHit.industry || '').trim()) {
        var clInd = KnowledgeGraph_ensureIndustryNode_(clientHit.industry);
        if (clInd) {
          KnowledgeGraphStore_replaceEdgesForSource(clientNodeId, [
            { target_id: clInd.nodeId, relation_type: 'in_industry' },
          ]);
        }
      }
      edges.push({ target_id: clientNodeId, relation_type: 'belongs_to' });
    } else {
      var norm = ClientsMaster_normalizeName_(clientName);
      if (norm) {
        var labelNodeId = KnowledgeGraph_nodeId_('client_label', norm);
        KnowledgeGraphStore_upsertNode({
          node_id: labelNodeId,
          node_type: 'client_label',
          label: clientName,
          payload: { normalized_name: norm },
          updated_at: now,
        });
        edges.push({ target_id: labelNodeId, relation_type: 'belongs_to' });
      }
    }
  }

  if (industry && ctype !== 'onboarding') {
    var indNode = KnowledgeGraph_ensureIndustryNode_(industry);
    if (indNode) {
      edges.push({ target_id: indNode.nodeId, relation_type: 'in_industry' });
    }
  }

  var ti;
  for (ti = 0; ti < tags.length; ti++) {
    var tagNode = KnowledgeGraph_ensureTagNode_(tags[ti]);
    if (tagNode) {
      edges.push({ target_id: tagNode.nodeId, relation_type: 'tagged_with' });
    }
  }

  if (ctype === 'proposal') {
    var stageNode = KnowledgeGraph_ensureStageNode_(specific.stage);
    if (stageNode) {
      edges.push({ target_id: stageNode.nodeId, relation_type: 'has_stage' });
    }
    var pricingNode = KnowledgeGraph_ensurePricingNode_(specific.pricing_model);
    if (pricingNode) {
      edges.push({ target_id: pricingNode.nodeId, relation_type: 'has_pricing_model' });
    }
  }

  KnowledgeGraphStore_replaceEdgesForSource(contentNodeId, edges);
}

/**
 * @param {string} contentId
 */
function KnowledgeGraph_removeContent_(contentId) {
  var id = String(contentId || '').trim();
  if (!id) return;
  var nodeId = KnowledgeGraph_nodeId_('content', id);
  KnowledgeGraphStore_deleteEdgesTouchingNode(nodeId);
  KnowledgeGraphStore_deleteNode(nodeId);
}

/**
 * @param {string} clientId
 */
function KnowledgeGraph_syncClient_(clientId) {
  var cid = String(clientId || '').trim();
  if (!cid) return;
  var row = ClientsMasterStore_getById(cid);
  if (!row) {
    KnowledgeGraph_removeClient_(cid);
    return;
  }
  var now = new Date().toISOString();
  var clientNodeId = KnowledgeGraph_nodeId_('client', cid);
  var name = String(row.client_name || '').trim();
  KnowledgeGraphStore_upsertNode({
    node_id: clientNodeId,
    node_type: 'client',
    label: name || cid,
    payload: {
      client_id: cid,
      normalized_name: String(row.normalized_name || ''),
      industry: String(row.industry || '').trim(),
    },
    updated_at: now,
  });
  var edges = [];
  var ind = String(row.industry || '').trim();
  if (ind) {
    var indNode = KnowledgeGraph_ensureIndustryNode_(ind);
    if (indNode) {
      edges.push({ target_id: indNode.nodeId, relation_type: 'in_industry' });
    }
  }
  KnowledgeGraphStore_replaceEdgesForSource(clientNodeId, edges);

  if (name) {
    var dbRows = ContentCatalogStore_listAll();
    var ri;
    for (ri = 0; ri < dbRows.length; ri++) {
      var cn = String(dbRows[ri].client_name || '').trim();
      if (!cn) continue;
      if (ClientsMaster_normalizeName_(cn) === String(row.normalized_name || '')) {
        try {
          KnowledgeGraph_syncContent_(String(dbRows[ri].content_id || ''));
        } catch (eSync) {
          console.log(
            '[KG] syncClient re-link content failed: ' +
              String(eSync.message || eSync).slice(0, 120),
          );
        }
      }
    }
  }
}

/**
 * @param {string} clientId
 */
function KnowledgeGraph_removeClient_(clientId) {
  var cid = String(clientId || '').trim();
  if (!cid) return;
  var nodeId = KnowledgeGraph_nodeId_('client', cid);
  KnowledgeGraphStore_deleteEdgesTouchingNode(nodeId);
  KnowledgeGraphStore_deleteNode(nodeId);
}

/**
 * Elimina nodos de referencia sin aristas incidentes.
 * @return {number}
 */
function KnowledgeGraph_pruneOrphanNodes_() {
  var nodes = KnowledgeGraphStore_listAllNodes();
  var edges = KnowledgeGraphStore_listAllEdges();
  var touch = {};
  var ei;
  for (ei = 0; ei < edges.length; ei++) {
    touch[String(edges[ei].source_id || '')] = true;
    touch[String(edges[ei].target_id || '')] = true;
  }
  var pruneTypes = {
    tag: true,
    industry: true,
    stage: true,
    pricing_model: true,
    client_label: true,
  };
  var removed = 0;
  var ni;
  for (ni = 0; ni < nodes.length; ni++) {
    var n = nodes[ni];
    var nid = String(n.node_id || '');
    var nt = String(n.node_type || '');
    if (!pruneTypes[nt]) continue;
    if (touch[nid]) continue;
    KnowledgeGraphStore_deleteNode(nid);
    removed++;
  }
  return removed;
}

/**
 * Elimina nodos content:* que ya no existen en contents.
 * @return {number}
 */
function KnowledgeGraph_reconcileStaleContentNodes_() {
  var nodes = KnowledgeGraphStore_listNodesByType('content', 10000);
  var removed = 0;
  var ni;
  for (ni = 0; ni < nodes.length; ni++) {
    var nid = String(nodes[ni].node_id || '');
    var cid = nid.indexOf('content:') === 0 ? nid.replace(/^content:/, '') : '';
    if (!cid) {
      var pl =
        nodes[ni].payload && typeof nodes[ni].payload === 'object'
          ? nodes[ni].payload
          : {};
      cid = String(pl.content_id || '').trim();
    }
    if (!cid) continue;
    if (!ContentCatalogStore_getById(cid)) {
      KnowledgeGraph_removeContent_(cid);
      removed++;
    }
  }
  return removed;
}

/**
 * Sincroniza grafo para una fila Salesforce (vía content_id del roster; el contenido enlaza cliente).
 * @param {Object} sfRow
 * @return {boolean}
 */
function KnowledgeGraph_syncSalesforceRow_(sfRow) {
  if (!sfRow || typeof sfRow !== 'object') return false;
  var contentId = String(sfRow.content_id || '').trim();
  if (contentId) {
    try {
      KnowledgeGraph_syncContent_(contentId);
      return true;
    } catch (eCt) {
      console.log(
        '[KG] SF sync content failed: ' + String(eCt.message || eCt).slice(0, 100),
      );
    }
  }
  var clientId = String(sfRow.client_id || '').trim();
  if (clientId) {
    try {
      KnowledgeGraph_syncClient_(clientId);
      return true;
    } catch (eCl) {
      console.log(
        '[KG] SF sync client failed: ' + String(eCl.message || eCl).slice(0, 100),
      );
    }
  }
  return false;
}

/**
 * Recorre salesforce_accounts en Supabase y actualiza nodos enlazados.
 * @return {number}
 */
function KnowledgeGraph_syncAllSalesforceAccounts_() {
  var rows = SalesforceAccountsStore_listAll();
  var synced = 0;
  var i;
  for (i = 0; i < rows.length; i++) {
    KnowledgeGraph_syncSalesforceRow_(rows[i]);
    synced++;
  }
  return synced;
}

/**
 * Paso final: clientes, Salesforce, poda y contenidos huérfanos en el grafo.
 * @return {{clients:number,salesforce:number,pruned:number,staleRemoved:number}}
 */
function KnowledgeGraph_syncFromSupabaseFinalize_() {
  var clientsSynced = 0;
  var clients = ClientsMasterStore_listAll();
  var ci;
  for (ci = 0; ci < clients.length; ci++) {
    try {
      KnowledgeGraph_syncClient_(String(clients[ci].client_id || ''));
      clientsSynced++;
    } catch (eCl) {
      console.log('[KG] finalize client: ' + String(eCl.message || eCl).slice(0, 80));
    }
  }
  var sfSynced = KnowledgeGraph_syncAllSalesforceAccounts_();
  var staleRemoved = KnowledgeGraph_reconcileStaleContentNodes_();
  var pruned = KnowledgeGraph_pruneOrphanNodes_();
  return {
    clients: clientsSynced,
    salesforce: sfSynced,
    pruned: pruned,
    staleRemoved: staleRemoved,
  };
}

/**
 * Estado de alineación catálogo ↔ grafo (para UI / auto-sync).
 * @return {{ok:boolean,catalogContents:number,graphContentNodes:number,graphClientNodes:number,staleGraphNodes:number,needsSync:boolean}}
 */
function KnowledgeGraph_getSyncStatus() {
  KnowledgeGraph_requireView_();
  var catalogRows = ContentCatalogStore_listAll();
  var catalogCount = catalogRows.length;
  /** @type {Object<string, boolean>} */
  var catalogIds = {};
  var ci;
  for (ci = 0; ci < catalogRows.length; ci++) {
    catalogIds[String(catalogRows[ci].content_id || '')] = true;
  }

  var contentNodes = KnowledgeGraphStore_listNodesByType('content', 10000);
  var graphContent = contentNodes.length;
  var stale = 0;
  var ni;
  for (ni = 0; ni < contentNodes.length; ni++) {
    var nid = String(contentNodes[ni].node_id || '');
    var id = nid.indexOf('content:') === 0 ? nid.replace(/^content:/, '') : '';
    if (!id) continue;
    if (!catalogIds[id]) stale++;
  }

  var clientNodes = KnowledgeGraphStore_listNodesByType('client', 5000);
  var needsSync =
    (catalogCount > 0 && graphContent === 0) ||
    stale > 0 ||
    (catalogCount > 0 && graphContent < Math.max(1, catalogCount - 3));

  return {
    ok: true,
    catalogContents: catalogCount,
    graphContentNodes: graphContent,
    graphClientNodes: clientNodes.length,
    staleGraphNodes: stale,
    needsSync: needsSync,
  };
}

/**
 * @param {Object} nodeRow
 * @return {Object}
 */
function KnowledgeGraph_toApiNode_(nodeRow) {
  var payload = nodeRow.payload;
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    payload = {};
  }
  return {
    id: String(nodeRow.node_id || ''),
    type: String(nodeRow.node_type || ''),
    label: String(nodeRow.label || ''),
    payload: payload,
  };
}

/**
 * @param {Object} edgeRow
 * @return {Object}
 */
function KnowledgeGraph_toApiEdge_(edgeRow) {
  return {
    id: String(edgeRow.edge_id || ''),
    source: String(edgeRow.source_id || ''),
    target: String(edgeRow.target_id || ''),
    relation: String(edgeRow.relation_type || ''),
  };
}

/**
 * @param {Object} nodeRow
 * @param {Object} filters
 * @return {boolean}
 */
function KnowledgeGraph_nodePassesFilters_(nodeRow, filters) {
  filters = filters || {};
  var nt = String(nodeRow.node_type || '');
  var pl =
    nodeRow.payload && typeof nodeRow.payload === 'object' && !Array.isArray(nodeRow.payload)
      ? nodeRow.payload
      : {};
  var allowed = filters.allowedNodeTypes;
  if (allowed && typeof allowed === 'object') {
    if (!allowed[nt]) return false;
  }
  var contentType = String(filters.contentType || '').trim();
  if (contentType && nt === 'content') {
    if (String(pl.content_type || '') !== contentType) return false;
  }
  var searchQ = String(filters.searchQuery || '').trim().toLowerCase();
  if (searchQ) {
    var lbl = String(nodeRow.label || nodeRow.node_id || '').toLowerCase();
    if (lbl.indexOf(searchQ) < 0) return false;
  }
  return true;
}

/**
 * @param {Object} filters
 * @return {Array<string>}
 */
function KnowledgeGraph_resolveSeedIds_(filters) {
  filters = filters || {};
  var contentType = String(filters.contentType || '').trim();
  var industryFilter = String(filters.industry || '').trim();
  var clientId = String(filters.clientId || '').trim();
  var centerNodeId = String(filters.centerNodeId || '').trim();
  var searchQ = String(filters.searchQuery || '').trim();

  if (centerNodeId) return [centerNodeId];

  if (clientId) return [KnowledgeGraph_nodeId_('client', clientId)];

  if (industryFilter) {
    return [KnowledgeGraph_nodeId_('industry', KnowledgeGraph_slug_(industryFilter))];
  }

  if (searchQ) {
    var q = searchQ.toLowerCase();
    var types = ['content', 'client', 'client_label', 'industry', 'tag'];
    /** @type {Array<string>} */
    var hits = [];
    var ti;
    for (ti = 0; ti < types.length && hits.length < 25; ti++) {
      var rows = KnowledgeGraphStore_listNodesByType(types[ti], 120);
      var ri;
      for (ri = 0; ri < rows.length && hits.length < 25; ri++) {
        var lbl = String(rows[ri].label || rows[ri].node_id || '').toLowerCase();
        if (lbl.indexOf(q) >= 0) {
          hits.push(String(rows[ri].node_id || ''));
        }
      }
    }
    return hits;
  }

  var contentRows = KnowledgeGraphStore_listNodesByType('content', KNOWLEDGE_GRAPH_HUB_SEED_LIMIT + 40);
  /** @type {Array<string>} */
  var seeds = [];
  var ci;
  for (ci = 0; ci < contentRows.length && seeds.length < KNOWLEDGE_GRAPH_HUB_SEED_LIMIT; ci++) {
    var row = contentRows[ci];
    if (!KnowledgeGraph_nodePassesFilters_(row, filters)) continue;
    if (contentType) {
      var pl =
        row.payload && typeof row.payload === 'object' && !Array.isArray(row.payload)
          ? row.payload
          : {};
      if (String(pl.content_type || '') !== contentType) continue;
    }
    seeds.push(String(row.node_id || ''));
  }
  return seeds;
}

/**
 * @param {Array<string>} seedIds
 * @param {Object} filters
 * @return {{ok:boolean,nodes:Array<Object>,edges:Array<Object>,truncated:boolean,stats:Object}}
 */
function KnowledgeGraph_expandSubgraph_(seedIds, filters) {
  filters = filters || {};
  var maxNodes = Math.min(
    KNOWLEDGE_GRAPH_MAX_NODES_CAP,
    Math.max(50, Number(filters.maxNodes) || KNOWLEDGE_GRAPH_MAX_NODES_DEFAULT),
  );
  var depth = Math.min(
    KNOWLEDGE_GRAPH_BFS_DEPTH_CAP,
    Math.max(1, Number(filters.depth) || KNOWLEDGE_GRAPH_BFS_DEPTH_DEFAULT),
  );

  /** @type {Object<string, Object>} */
  var nodeCache = {};
  /** @type {Object<string, boolean>} */
  var selected = {};
  /** @type {Array<string>} */
  var order = [];

  /**
   * @param {Object} row
   * @return {boolean}
   */
  function tryAdd_(row) {
    if (!row) return false;
    var nid = String(row.node_id || '').trim();
    if (!nid || selected[nid]) return false;
    if (!KnowledgeGraph_nodePassesFilters_(row, filters)) return false;
    if (order.length >= maxNodes) return false;
    selected[nid] = true;
    order.push(nid);
    nodeCache[nid] = row;
    return true;
  }

  var seedRows = KnowledgeGraphStore_getNodesByIds(seedIds);
  var si;
  for (si = 0; si < seedRows.length; si++) {
    tryAdd_(seedRows[si]);
  }

  var truncated = false;
  var frontier = order.slice();
  var d;
  for (d = 0; d < depth; d++) {
    if (!frontier.length || order.length >= maxNodes) break;
    /** @type {Array<string>} */
    var nextFrontier = [];
    var fi;
    for (fi = 0; fi < frontier.length; fi++) {
      if (order.length >= maxNodes) {
        truncated = true;
        break;
      }
      var fid = frontier[fi];
      var outE = KnowledgeGraphStore_listEdgesBySource(fid);
      var inE = KnowledgeGraphStore_listEdgesByTarget(fid);
      /** @type {Array<Object>} */
      var inc = outE.concat(inE);
      var ei;
      for (ei = 0; ei < inc.length; ei++) {
        if (order.length >= maxNodes) {
          truncated = true;
          break;
        }
        var er = inc[ei];
        var other = '';
        if (String(er.source_id || '') === fid) other = String(er.target_id || '');
        else if (String(er.target_id || '') === fid) other = String(er.source_id || '');
        if (!other || selected[other]) continue;
        var nrow = nodeCache[other] || KnowledgeGraphStore_getNode(other);
        if (!nrow) continue;
        if (tryAdd_(nrow)) nextFrontier.push(other);
      }
    }
    frontier = nextFrontier;
  }

  if (order.length >= maxNodes) truncated = true;

  /** @type {Array<Object>} */
  var outNodes = [];
  for (si = 0; si < order.length; si++) {
    var oid = order[si];
    if (nodeCache[oid]) outNodes.push(KnowledgeGraph_toApiNode_(nodeCache[oid]));
  }

  /** @type {Object<string, boolean>} */
  var edgeSeen = {};
  /** @type {Array<Object>} */
  var outEdges = [];
  for (si = 0; si < order.length; si++) {
    var nid2 = order[si];
    var eOut = KnowledgeGraphStore_listEdgesBySource(nid2);
    var eIn = KnowledgeGraphStore_listEdgesByTarget(nid2);
    var merged = eOut.concat(eIn);
    var ej;
    for (ej = 0; ej < merged.length; ej++) {
      var edgeRow = merged[ej];
      var src = String(edgeRow.source_id || '');
      var tgt = String(edgeRow.target_id || '');
      if (!selected[src] || !selected[tgt]) continue;
      var eid = String(edgeRow.edge_id || src + '|' + tgt + '|' + edgeRow.relation_type);
      if (edgeSeen[eid]) continue;
      edgeSeen[eid] = true;
      outEdges.push(KnowledgeGraph_toApiEdge_(edgeRow));
    }
  }

  return {
    ok: true,
    nodes: outNodes,
    edges: outEdges,
    truncated: truncated,
    stats: {
      selectedNodes: outNodes.length,
      selectedEdges: outEdges.length,
      depth: depth,
      seedCount: seedIds.length,
    },
  };
}

/**
 * @return {{ok:boolean,industries:Array<string>,clients:Array<{id:string,name:string}>}}
 */
function KnowledgeGraph_listFilterOptions() {
  KnowledgeGraph_requireView_();
  /** @type {Array<string>} */
  var industries = [];
  var indRows = KnowledgeGraphStore_listNodesByType('industry', 200);
  var ii;
  for (ii = 0; ii < indRows.length; ii++) {
    var ilbl = String(indRows[ii].label || '').trim();
    if (ilbl) industries.push(ilbl);
  }
  industries.sort();

  /** @type {Array<Object>} */
  var clients = [];
  var clRows = KnowledgeGraphStore_listNodesByType('client', 400);
  var ci;
  for (ci = 0; ci < clRows.length; ci++) {
    var pl =
      clRows[ci].payload && typeof clRows[ci].payload === 'object'
        ? clRows[ci].payload
        : {};
    var cid = String(pl.client_id || '').trim();
    if (!cid) {
      var nid = String(clRows[ci].node_id || '');
      if (nid.indexOf('client:') === 0) cid = nid.replace(/^client:/, '');
    }
    if (!cid) continue;
    clients.push({
      id: cid,
      name: String(clRows[ci].label || pl.name || cid),
    });
  }
  clients.sort(function (a, b) {
    return String(a.name || '').localeCompare(String(b.name || ''));
  });

  return { ok: true, industries: industries, clients: clients };
}

/**
 * @param {Object} filters
 * @return {{ok:boolean,nodes:Array<Object>,edges:Array<Object>,totalNodes:number,totalEdges:number,truncated:boolean,stats:Object}}
 */
function KnowledgeGraph_getSnapshot(filters) {
  KnowledgeGraph_requireView_();
  filters = filters || {};
  var allowed = filters.allowedNodeTypes;
  if (typeof allowed === 'string' && allowed) {
    try {
      allowed = JSON.parse(allowed);
    } catch (eParse) {
      allowed = null;
    }
  }

  var normFilters = {
    contentType: String(filters.contentType || '').trim(),
    industry: String(filters.industry || '').trim(),
    clientId: String(filters.clientId || '').trim(),
    centerNodeId: String(filters.centerNodeId || '').trim(),
    searchQuery: String(filters.searchQuery || '').trim(),
    depth: filters.depth,
    maxNodes: filters.maxNodes,
    allowedNodeTypes: allowed,
  };

  var seedIds = KnowledgeGraph_resolveSeedIds_(normFilters);
  if (!seedIds.length) {
    return {
      ok: true,
      nodes: [],
      edges: [],
      totalNodes: 0,
      totalEdges: 0,
      truncated: false,
      stats: { selectedNodes: 0, selectedEdges: 0, seedCount: 0 },
    };
  }

  var expanded = KnowledgeGraph_expandSubgraph_(seedIds, normFilters);
  return {
    ok: true,
    nodes: expanded.nodes,
    edges: expanded.edges,
    totalNodes: expanded.nodes.length,
    totalEdges: expanded.edges.length,
    truncated: expanded.truncated,
    stats: expanded.stats,
  };
}

/**
 * @param {number} skip
 * @param {number} limit
 * @return {{ok:boolean,processed:number,done:number,failed:number,skip:number,limit:number,total:number,hasMore:boolean,pruned:number,errors:Array<string>}}
 */
function KnowledgeGraph_rebuildBatch(skip, limit) {
  KnowledgeGraph_requireAdmin_();
  var s = Math.max(0, Number(skip) || 0);
  var lim = Math.min(
    KNOWLEDGE_GRAPH_REBUILD_BATCH_MAX,
    Math.max(1, Number(limit) || 25),
  );
  var rows = ContentCatalogStore_listAll();
  var slice = rows.slice(s, s + lim);
  var done = 0;
  var failed = 0;
  /** @type {Array<string>} */
  var errors = [];

  for (var i = 0; i < slice.length; i++) {
    try {
      KnowledgeGraph_syncContent_(String(slice[i].content_id || ''));
      done += 1;
    } catch (eRow) {
      failed += 1;
      errors.push(
        String(slice[i].content_id || '') +
          ': ' +
          String(eRow.message || eRow).slice(0, 120),
      );
    }
  }

  /** @type {Object|null} */
  var finalizeStats = null;
  if (s + lim >= rows.length) {
    try {
      finalizeStats = KnowledgeGraph_syncFromSupabaseFinalize_();
    } catch (eFin) {
      console.log('[KG] rebuild finalize: ' + String(eFin.message || eFin).slice(0, 120));
    }
  }

  return {
    ok: true,
    processed: slice.length,
    done: done,
    failed: failed,
    skip: s,
    limit: lim,
    total: rows.length,
    hasMore: s + lim < rows.length,
    pruned: finalizeStats ? finalizeStats.pruned : 0,
    staleRemoved: finalizeStats ? finalizeStats.staleRemoved : 0,
    finalize: finalizeStats,
    errors: errors.slice(0, 5),
  };
}
