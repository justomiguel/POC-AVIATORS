/**
 * @fileoverview Grafo de conocimiento: sincronización y consulta.
 */

/** @type {number} */
var KNOWLEDGE_GRAPH_MAX_NODES_DEFAULT = 150;

/** @type {number} */
var KNOWLEDGE_GRAPH_MAX_NODES_CAP = 300;

/** @type {number} */
var KNOWLEDGE_GRAPH_REBUILD_BATCH_MAX = 12;

/** @type {string} */
var KNOWLEDGE_GRAPH_REBUILD_PROGRESS_KEY_ = 'KG_REBUILD_PROGRESS';

/** @type {string} */
var KNOWLEDGE_GRAPH_AUTO_CATCHUP_PROGRESS_KEY_ = 'KG_AUTO_CATCHUP_PROGRESS';

/** @type {number} */
var KNOWLEDGE_GRAPH_AUTO_CATCHUP_BATCH_ = 10;

/** @type {string} */
var KG_BG_CATCHUP_HANDLER_ = 'KnowledgeGraph_backgroundCatchupJob_';

/** @type {number} */
var KG_BG_CATCHUP_MAX_MS_ = 270000;

/** @type {number} */
var KG_BG_CATCHUP_KICKSTART_MS_ = 45000;

/** @type {number} */
var KG_BG_CATCHUP_CONT_MINUTES_ = 2;

/** @type {Array<string>} */
var KNOWLEDGE_GRAPH_REBUILD_PHASES_ = [
  'contents',
  'clients',
  'salesforce',
  'embeddings',
  'semantic',
  'entities',
  'stale',
  'prune',
];

/** @type {number} */
var KNOWLEDGE_GRAPH_EMBEDDINGS_BATCH_MAX = 8;

/** @type {number} */
var KNOWLEDGE_GRAPH_SEMANTIC_MATCH_COUNT = 6;

/** @type {number} */
var KNOWLEDGE_GRAPH_SEMANTIC_THRESHOLD = 0.78;

/** @type {number} */
var KNOWLEDGE_GRAPH_ENTITIES_BATCH_MAX = 4;

/** @type {number} */
var KNOWLEDGE_GRAPH_BFS_DEPTH_DEFAULT = 2;

/** @type {number} */
var KNOWLEDGE_GRAPH_BFS_DEPTH_CAP = 4;

/** @type {number} */
var KNOWLEDGE_GRAPH_HUB_SEED_LIMIT = 30;

/** @type {Array<string>} */
var KNOWLEDGE_GRAPH_ENTITY_NODE_TYPES_ = [
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
  'theme',
];

/** @type {Array<string>} */
var KNOWLEDGE_GRAPH_ENTITY_RELATION_TYPES_ = [
  'belongs_to',
  'tagged_with',
  'in_industry',
  'related_content',
  'has_stage',
  'has_pricing_model',
  'similar_to',
  'delivers',
  'uses_technology',
  'achieved',
  'addresses_theme',
];

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

  var paired = KnowledgeGraph_relatedContentEdges_(id, ctype, clientName);
  var pi;
  for (pi = 0; pi < paired.length; pi++) {
    edges.push(paired[pi]);
  }

  KnowledgeGraphStore_replaceEdgesForSource(contentNodeId, edges);
}

/**
 * Aristas proposal ↔ success_case (y simétricas) para el mismo cliente.
 * @param {string} contentId
 * @param {string} contentType
 * @param {string} clientName
 * @return {Array<{target_id:string,relation_type:string}>}
 */
function KnowledgeGraph_relatedContentEdges_(contentId, contentType, clientName) {
  var cid = String(contentId || '').trim();
  var ctype = String(contentType || '').trim();
  var cn = String(clientName || '').trim();
  if (!cid || !cn) return [];
  if (ctype !== 'proposal' && ctype !== 'success_case') return [];

  var norm = ClientsMaster_normalizeName_(cn);
  if (!norm) return [];

  var catalogHits = ContentCatalog_findDocsByClient(cn);
  var docs = catalogHits.docs || [];
  /** @type {Array<{target_id:string,relation_type:string}>} */
  var out = [];
  var seen = {};
  var max = 20;
  var i;
  for (i = 0; i < docs.length && out.length < max; i++) {
    var d = docs[i];
    var otherId = String(d.contentId || '').trim();
    var otherType = String(d.contentType || '').trim();
    if (!otherId || otherId === cid) continue;
    if (otherType !== 'proposal' && otherType !== 'success_case') continue;
    if (ctype === otherType) continue;
    var targetNode = KnowledgeGraph_nodeId_('content', otherId);
    var key = targetNode;
    if (seen[key]) continue;
    seen[key] = true;
    out.push({ target_id: targetNode, relation_type: 'related_content' });
  }
  return out;
}

/**
 * Aristas semánticas (embedding) hacia otros contenidos similares.
 * @param {string} contentId
 * @return {Array<{target_id:string,relation_type:string,source:string,weight:number,payload:Object}>}
 */
function KnowledgeGraph_semanticEdges_(contentId) {
  var id = String(contentId || '').trim();
  if (!id) return [];
  var row = ContentCatalogStore_getById(id);
  if (!row || !ContentCatalogStore_rowHasEmbedding_(row)) return [];

  /** @type {Array<Object>} */
  var neighbors = [];
  try {
    var rpcRes = SupabaseRest_rpc('match_content_neighbors', {
      source_id: id,
      match_count: KNOWLEDGE_GRAPH_SEMANTIC_MATCH_COUNT,
      match_threshold: KNOWLEDGE_GRAPH_SEMANTIC_THRESHOLD,
    });
    if (Array.isArray(rpcRes)) neighbors = rpcRes;
    else if (rpcRes && typeof rpcRes === 'object') neighbors = [rpcRes];
  } catch (eRpc) {
    console.log(
      '[KG] semantic neighbors rpc failed: ' + String(eRpc.message || eRpc).slice(0, 120),
    );
    return [];
  }

  /** @type {Array<Object>} */
  var out = [];
  var seen = {};
  var i;
  for (i = 0; i < neighbors.length; i++) {
    var hit = neighbors[i] || {};
    var otherId = String(hit.content_id || '').trim();
    if (!otherId || otherId === id) continue;
    var sim = Number(hit.similarity);
    if (isNaN(sim) || sim < KNOWLEDGE_GRAPH_SEMANTIC_THRESHOLD) continue;
    var targetNode = KnowledgeGraph_nodeId_('content', otherId);
    if (seen[targetNode]) continue;
    seen[targetNode] = true;
    out.push({
      target_id: targetNode,
      relation_type: 'similar_to',
      source: 'embedding',
      weight: sim,
      payload: { similarity: sim, threshold: KNOWLEDGE_GRAPH_SEMANTIC_THRESHOLD },
    });
  }
  return out;
}

/**
 * Sincroniza aristas semánticas (capa embedding) para un contenido.
 * @param {string} contentId
 */
function KnowledgeGraph_syncSemanticForContent_(contentId) {
  var id = String(contentId || '').trim();
  if (!id) return;
  try {
    ContentEmbedding_refreshForContentIdIfMissing_(id);
  } catch (eEmb) {
    console.log(
      '[KG] embedding before semantic failed: ' + String(eEmb.message || eEmb).slice(0, 120),
    );
    return;
  }
  var row = ContentCatalogStore_getById(id);
  if (!row || !ContentCatalogStore_rowHasEmbedding_(row)) return;
  var contentNodeId = KnowledgeGraph_nodeId_('content', id);
  var edges = KnowledgeGraph_semanticEdges_(id);
  KnowledgeGraphStore_replaceEdgesForSourceByProvenance_(contentNodeId, 'embedding', edges);
}

/**
 * Sincroniza entidades de negocio (capa LLM) para un contenido.
 * @param {string} contentId
 */
function KnowledgeGraph_syncEntitiesForContent_(contentId) {
  var id = String(contentId || '').trim();
  if (!id) return;
  if (typeof KnowledgeGraphExtraction_syncForContentId_ !== 'function') return;
  KnowledgeGraphExtraction_syncForContentId_(id);
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
 * Solo nodo cliente + arista a industria (sin reescanear catálogo).
 * @param {string} clientId
 */
function KnowledgeGraph_syncClientMetadata_(clientId) {
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
  KnowledgeGraph_syncClientMetadata_(cid);
  var name = String(row.client_name || '').trim();
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
    offering: true,
    technology: true,
    outcome: true,
    theme: true,
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
 * Elimina nodos content:* que ya no existen en contents (un lote).
 * @param {number} skip
 * @param {number} limit
 * @return {{processed:number,removed:number,hasMore:boolean}}
 */
function KnowledgeGraph_reconcileStaleContentBatch_(skip, limit) {
  var s = Math.max(0, Number(skip) || 0);
  var lim = Math.min(40, Math.max(1, Number(limit) || 20));
  var nodes = KnowledgeGraphStore_listNodesPage('content', s, lim);
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
  return {
    processed: nodes.length,
    removed: removed,
    hasMore: nodes.length >= lim,
  };
}

/**
 * @param {number} skip
 * @param {number} limit
 * @return {{processed:number,removed:number,hasMore:boolean}}
 */
function KnowledgeGraph_pruneOrphanBatch_(skip, limit) {
  var s = Math.max(0, Number(skip) || 0);
  var lim = Math.min(30, Math.max(1, Number(limit) || 15));
  var nodes = KnowledgeGraphStore_listPrunableNodesPage(s, lim);
  var removed = 0;
  var ni;
  for (ni = 0; ni < nodes.length; ni++) {
    var nid = String(nodes[ni].node_id || '');
    if (!nid) continue;
    var outE = KnowledgeGraphStore_listEdgesBySource(nid);
    var inE = KnowledgeGraphStore_listEdgesByTarget(nid);
    if (outE.length || inE.length) continue;
    KnowledgeGraphStore_deleteNode(nid);
    removed++;
  }
  return {
    processed: nodes.length,
    removed: removed,
    hasMore: nodes.length >= lim,
  };
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
 * @return {Object|null}
 */
function KnowledgeGraph_rebuildProgressRead_() {
  try {
    var raw = PropertiesService.getScriptProperties().getProperty(
      KNOWLEDGE_GRAPH_REBUILD_PROGRESS_KEY_,
    );
    if (!raw) return null;
    var parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (ignore) {
    return null;
  }
}

/**
 * @param {Object} patch
 */
function KnowledgeGraph_rebuildProgressWrite_(patch) {
  var cur = KnowledgeGraph_rebuildProgressRead_() || {};
  var keys = patch || {};
  var k;
  for (k in keys) {
    if (Object.prototype.hasOwnProperty.call(keys, k)) cur[k] = keys[k];
  }
  cur.updated_at = new Date().toISOString();
  PropertiesService.getScriptProperties().setProperty(
    KNOWLEDGE_GRAPH_REBUILD_PROGRESS_KEY_,
    JSON.stringify(cur),
  );
}

function KnowledgeGraph_rebuildProgressClear_() {
  PropertiesService.getScriptProperties().deleteProperty(
    KNOWLEDGE_GRAPH_REBUILD_PROGRESS_KEY_,
  );
}

/**
 * @return {{ok:boolean,inProgress:boolean,progress:Object|null}}
 */
function KnowledgeGraph_getRebuildProgress() {
  KnowledgeGraph_requireAdmin_();
  var p = KnowledgeGraph_rebuildProgressRead_();
  return {
    ok: true,
    inProgress: !!(p && p.phase && p.phase !== 'done'),
    progress: p,
  };
}

/**
 * Descarta progreso de rebuild manual interrumpido (no borra datos del grafo).
 * @return {{ok:boolean}}
 */
function AdminKnowledgeGraph_discardRebuildProgress() {
  return AdminKnowledgeGraph_discardBackgroundSync();
}

/**
 * @param {string} phase
 * @return {string}
 */
function KnowledgeGraph_nextRebuildPhase_(phase) {
  var ph = String(phase || '').trim();
  var i;
  for (i = 0; i < KNOWLEDGE_GRAPH_REBUILD_PHASES_.length; i++) {
    if (KNOWLEDGE_GRAPH_REBUILD_PHASES_[i] === ph) {
      return i + 1 < KNOWLEDGE_GRAPH_REBUILD_PHASES_.length
        ? KNOWLEDGE_GRAPH_REBUILD_PHASES_[i + 1]
        : 'done';
    }
  }
  return 'done';
}

/**
 * Estado de alineación catálogo ↔ grafo (persistido en Supabase; no implica rebuild).
 * needsRebuild: grafo vacío o nodos huérfanos (conviene sincronizar).
 * needsCatchUp: hay contenidos en catálogo sin nodo (sincronización incremental o manual).
 * needsSync: needsRebuild || needsCatchUp (solo informativo; la UI no debe forzar rebuild al abrir).
 * @return {Object}
 */
function KnowledgeGraph_getSyncStatusInternal_() {
  var catalogRows = ContentCatalogStore_listAll();
  var catalogCount = catalogRows.length;
  /** @type {Object<string, boolean>} */
  var catalogIds = {};
  /** @type {Object<string, boolean>} */
  var graphContentIds = {};
  var ci;
  for (ci = 0; ci < catalogRows.length; ci++) {
    var cid = String(catalogRows[ci].content_id || '').trim();
    if (cid) catalogIds[cid] = true;
  }

  var contentNodes = KnowledgeGraphStore_listNodesByType('content', 10000);
  var graphContent = contentNodes.length;
  var stale = 0;
  var ni;
  for (ni = 0; ni < contentNodes.length; ni++) {
    var nid = String(contentNodes[ni].node_id || '');
    var id = nid.indexOf('content:') === 0 ? nid.replace(/^content:/, '') : '';
    if (!id) continue;
    graphContentIds[id] = true;
    if (!catalogIds[id]) stale++;
  }

  var missing = 0;
  var missingEmbeddings = 0;
  var catalogWithEmbeddings = 0;
  for (ci = 0; ci < catalogRows.length; ci++) {
    var mid = String(catalogRows[ci].content_id || '').trim();
    if (mid && !graphContentIds[mid]) missing++;
    if (ContentCatalogStore_rowHasEmbedding_(catalogRows[ci])) catalogWithEmbeddings++;
    else missingEmbeddings++;
  }

  var clientNodes = KnowledgeGraphStore_listNodesByType('client', 5000);
  var needsRebuild = (catalogCount > 0 && graphContent === 0) || stale > 0;
  var needsCatchUp = missing > 0;
  var needsEmbeddings = missingEmbeddings > 0;
  var needsSync = needsRebuild || needsCatchUp || needsEmbeddings;

  return {
    ok: true,
    catalogContents: catalogCount,
    graphContentNodes: graphContent,
    graphClientNodes: clientNodes.length,
    staleGraphNodes: stale,
    missingContents: missing,
    catalogWithEmbeddings: catalogWithEmbeddings,
    missingEmbeddings: missingEmbeddings,
    needsEmbeddings: needsEmbeddings,
    needsRebuild: needsRebuild,
    needsCatchUp: needsCatchUp,
    needsSync: needsSync,
  };
}

/**
 * @return {Object}
 */
function KnowledgeGraph_getSyncStatus() {
  KnowledgeGraph_requireView_();
  return KnowledgeGraph_getSyncStatusInternal_();
}

/**
 * @param {string} phase
 * @param {number} skip
 * @param {number} limit
 * @return {Object}
 */
function KnowledgeGraph_executePhaseBatch_(phase, skip, limit) {
  var ph = String(phase || 'contents').trim();
  var s = Math.max(0, Number(skip) || 0);
  var lim = Math.min(
    KNOWLEDGE_GRAPH_REBUILD_BATCH_MAX,
    Math.max(1, Number(limit) || KNOWLEDGE_GRAPH_REBUILD_BATCH_MAX),
  );
  var done = 0;
  var failed = 0;
  var removed = 0;
  /** @type {Array<string>} */
  var errors = [];
  var slice = [];
  var hasMore = false;
  var nextPhase = ph;
  var nextSkip = 0;

  if (ph === 'contents') {
    slice = ContentCatalogStore_listPage(s, lim);
    hasMore = slice.length >= lim;
    nextSkip = hasMore ? s + lim : 0;
    nextPhase = hasMore ? 'contents' : KnowledgeGraph_nextRebuildPhase_('contents');
    var i;
    for (i = 0; i < slice.length; i++) {
      try {
        KnowledgeGraph_syncContent_(String(slice[i].content_id || ''));
        done++;
      } catch (eRow) {
        failed++;
        errors.push(
          String(slice[i].content_id || '') +
            ': ' +
            String(eRow.message || eRow).slice(0, 120),
        );
      }
    }
  } else if (ph === 'clients') {
    slice = ClientsMasterStore_listPage(s, lim);
    hasMore = slice.length >= lim;
    nextSkip = hasMore ? s + lim : 0;
    nextPhase = hasMore ? 'clients' : KnowledgeGraph_nextRebuildPhase_('clients');
    var ci;
    for (ci = 0; ci < slice.length; ci++) {
      try {
        KnowledgeGraph_syncClientMetadata_(String(slice[ci].client_id || ''));
        done++;
      } catch (eCl) {
        failed++;
        errors.push(
          String(slice[ci].client_id || '') +
            ': ' +
            String(eCl.message || eCl).slice(0, 80),
        );
      }
    }
  } else if (ph === 'salesforce') {
    slice = SalesforceAccountsStore_listPage(s, lim);
    hasMore = slice.length >= lim;
    nextSkip = hasMore ? s + lim : 0;
    nextPhase = hasMore ? 'salesforce' : KnowledgeGraph_nextRebuildPhase_('salesforce');
    var si;
    for (si = 0; si < slice.length; si++) {
      try {
        var contentId = String(slice[si].content_id || '').trim();
        if (contentId) {
          KnowledgeGraph_syncContent_(contentId);
        } else {
          KnowledgeGraph_syncClientMetadata_(String(slice[si].client_id || ''));
        }
        done++;
      } catch (eSf) {
        failed++;
        errors.push(
          String(slice[si].account_key || '') +
            ': ' +
            String(eSf.message || eSf).slice(0, 80),
        );
      }
    }
  } else if (ph === 'embeddings') {
    var embLim = Math.min(
      KNOWLEDGE_GRAPH_EMBEDDINGS_BATCH_MAX,
      Math.max(1, Number(limit) || KNOWLEDGE_GRAPH_EMBEDDINGS_BATCH_MAX),
    );
    slice = ContentCatalogStore_listPage(s, embLim);
    hasMore = slice.length >= embLim;
    nextSkip = hasMore ? s + embLim : 0;
    nextPhase = hasMore ? 'embeddings' : KnowledgeGraph_nextRebuildPhase_('embeddings');
    var emi;
    for (emi = 0; emi < slice.length; emi++) {
      try {
        var embRow = slice[emi];
        var embCid = String(embRow.content_id || '').trim();
        if (!embCid) continue;
        if (ContentCatalogStore_rowHasEmbedding_(embRow)) {
          done++;
          continue;
        }
        ContentEmbedding_refreshForRow_(embRow);
        done++;
      } catch (eEmb) {
        failed++;
        errors.push(
          String(slice[emi].content_id || '') +
            ': ' +
            String(eEmb.message || eEmb).slice(0, 80),
        );
      }
    }
  } else if (ph === 'semantic') {
    slice = ContentCatalogStore_listPage(s, lim);
    hasMore = slice.length >= lim;
    nextSkip = hasMore ? s + lim : 0;
    nextPhase = hasMore ? 'semantic' : KnowledgeGraph_nextRebuildPhase_('semantic');
    var smi;
    for (smi = 0; smi < slice.length; smi++) {
      try {
        var semRow = slice[smi];
        if (!ContentCatalogStore_rowHasEmbedding_(semRow)) {
          continue;
        }
        KnowledgeGraph_syncSemanticForContent_(String(semRow.content_id || ''));
        done++;
      } catch (eSem) {
        failed++;
        errors.push(
          String(slice[smi].content_id || '') +
            ': ' +
            String(eSem.message || eSem).slice(0, 80),
        );
      }
    }
  } else if (ph === 'entities') {
    var entLim = Math.min(
      KNOWLEDGE_GRAPH_ENTITIES_BATCH_MAX,
      Math.max(1, Number(limit) || KNOWLEDGE_GRAPH_ENTITIES_BATCH_MAX),
    );
    slice = ContentCatalogStore_listPage(s, entLim);
    hasMore = slice.length >= entLim;
    nextSkip = hasMore ? s + entLim : 0;
    nextPhase = hasMore ? 'entities' : KnowledgeGraph_nextRebuildPhase_('entities');
    var eiEnt;
    for (eiEnt = 0; eiEnt < slice.length; eiEnt++) {
      try {
        KnowledgeGraph_syncEntitiesForContent_(String(slice[eiEnt].content_id || ''));
        done++;
      } catch (eEnt) {
        failed++;
        errors.push(
          String(slice[eiEnt].content_id || '') +
            ': ' +
            String(eEnt.message || eEnt).slice(0, 80),
        );
      }
    }
  } else if (ph === 'stale') {
    var staleRes = KnowledgeGraph_reconcileStaleContentBatch_(s, lim);
    done = staleRes.processed;
    removed = staleRes.removed;
    hasMore = staleRes.hasMore;
    nextSkip = hasMore ? s + lim : 0;
    nextPhase = hasMore ? 'stale' : KnowledgeGraph_nextRebuildPhase_('stale');
  } else if (ph === 'prune') {
    var pruneRes = KnowledgeGraph_pruneOrphanBatch_(s, lim);
    done = pruneRes.processed;
    removed = pruneRes.removed;
    hasMore = pruneRes.hasMore;
    nextSkip = hasMore ? s + lim : 0;
    nextPhase = hasMore ? 'prune' : 'done';
  } else {
    return { ok: false, error: 'invalid_phase', phase: ph };
  }

  return {
    ok: true,
    phase: ph,
    done: done,
    failed: failed,
    removed: removed,
    hasMore: hasMore,
    nextPhase: nextPhase,
    nextSkip: nextSkip,
    processed: slice.length || done,
    errors: errors.slice(0, 5),
  };
}

/**
 * @return {Object|null}
 */
function KnowledgeGraph_autoCatchupProgressRead_() {
  try {
    var raw = PropertiesService.getScriptProperties().getProperty(
      KNOWLEDGE_GRAPH_AUTO_CATCHUP_PROGRESS_KEY_,
    );
    if (!raw) return null;
    var parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (ignore) {
    return null;
  }
}

/**
 * @param {Object} patch
 */
function KnowledgeGraph_autoCatchupProgressWrite_(patch) {
  var cur = KnowledgeGraph_autoCatchupProgressRead_() || {};
  var keys = patch || {};
  var k;
  for (k in keys) {
    if (Object.prototype.hasOwnProperty.call(keys, k)) cur[k] = keys[k];
  }
  cur.updated_at = new Date().toISOString();
  PropertiesService.getScriptProperties().setProperty(
    KNOWLEDGE_GRAPH_AUTO_CATCHUP_PROGRESS_KEY_,
    JSON.stringify(cur),
  );
}

function KnowledgeGraph_autoCatchupProgressClear_() {
  PropertiesService.getScriptProperties().deleteProperty(
    KNOWLEDGE_GRAPH_AUTO_CATCHUP_PROGRESS_KEY_,
  );
}

/**
 * Sincronización incremental del grafo (sin sesión admin; usada por trigger SF).
 * @param {number} maxMs
 * @return {Object}
 */
function KnowledgeGraph_runAutomaticCatchUpWithBudget_(maxMs) {
  if (!AviatorsDataBackend_supabaseConfigured_()) {
    return {
      ok: false,
      skipped: true,
      reason: 'no_supabase',
      hasMore: false,
      processed: 0,
      failed: 0,
    };
  }

  var budget = Math.max(30000, Number(maxMs) || 90000);
  var startMs = Date.now();
  var progress = KnowledgeGraph_autoCatchupProgressRead_();
  var inProgress = !!(progress && progress.phase && progress.phase !== 'done');

  if (!inProgress) {
    var st = KnowledgeGraph_getSyncStatusInternal_();
    if (!st.needsSync) {
      return {
        ok: true,
        skipped: true,
        reason: 'aligned',
        hasMore: false,
        processed: 0,
        failed: 0,
      };
    }
    progress = {
      started_at: new Date().toISOString(),
      phase: 'contents',
      skip: 0,
      totals: {},
    };
    KnowledgeGraph_autoCatchupProgressWrite_(progress);
  }

  var totalDone = 0;
  var totalFailed = 0;
  var totalRemoved = 0;

  while (Date.now() - startMs < budget) {
    var ph = String(progress.phase || 'contents');
    if (ph === 'done') break;

    var batch = KnowledgeGraph_executePhaseBatch_(
      ph,
      progress.skip,
      KNOWLEDGE_GRAPH_AUTO_CATCHUP_BATCH_,
    );
    if (!batch.ok) break;

    totalDone += batch.done || 0;
    totalFailed += batch.failed || 0;
    totalRemoved += batch.removed || 0;

    if (!progress.totals) progress.totals = {};
    progress.totals[ph + '_done'] =
      (Number(progress.totals[ph + '_done']) || 0) + (batch.done || 0);
    progress.totals[ph + '_failed'] =
      (Number(progress.totals[ph + '_failed']) || 0) + (batch.failed || 0);
    if (batch.removed) {
      progress.totals[ph + '_removed'] =
        (Number(progress.totals[ph + '_removed']) || 0) + batch.removed;
    }

    if (batch.hasMore) {
      progress.phase = ph;
      progress.skip = batch.nextSkip;
    } else {
      progress.phase = batch.nextPhase;
      progress.skip = batch.nextSkip;
    }

    if (progress.phase === 'done') {
      KnowledgeGraph_autoCatchupProgressWrite_(progress);
      KnowledgeGraph_autoCatchupProgressClear_();
      break;
    }
    KnowledgeGraph_autoCatchupProgressWrite_(progress);
  }

  var hasMore = !!(progress && progress.phase && progress.phase !== 'done');
  return {
    ok: true,
    skipped: false,
    hasMore: hasMore,
    phase: progress ? progress.phase : 'done',
    processed: totalDone,
    failed: totalFailed,
    removed: totalRemoved,
    progress: progress,
  };
}

/**
 * @return {{ok:boolean, triggers:Array, error:string}}
 */
function KnowledgeGraph_listTriggersSafe_() {
  try {
    return { ok: true, triggers: ScriptApp.getProjectTriggers(), error: '' };
  } catch (e) {
    var msg = e && e.message ? String(e.message) : String(e);
    console.log('[KG-BG] ScriptApp.getProjectTriggers failed: ' + msg);
    return { ok: false, triggers: [], error: msg };
  }
}

/**
 * @return {boolean}
 */
function KnowledgeGraph_backgroundCatchupTriggerInstalled_() {
  var listed = KnowledgeGraph_listTriggersSafe_();
  if (!listed.ok) return false;
  var i;
  for (i = 0; i < listed.triggers.length; i++) {
    if (listed.triggers[i].getHandlerFunction() === KG_BG_CATCHUP_HANDLER_) {
      return true;
    }
  }
  return false;
}

function KnowledgeGraph_deleteBackgroundCatchupTriggers_() {
  var listed = KnowledgeGraph_listTriggersSafe_();
  if (!listed.ok) return;
  var i;
  for (i = 0; i < listed.triggers.length; i++) {
    if (listed.triggers[i].getHandlerFunction() === KG_BG_CATCHUP_HANDLER_) {
      ScriptApp.deleteTrigger(listed.triggers[i]);
    }
  }
}

function KnowledgeGraph_scheduleBackgroundCatchup_() {
  var listed = KnowledgeGraph_listTriggersSafe_();
  if (!listed.ok) {
    console.log('[KG-BG] cannot schedule continuation: ScriptApp scope');
    return;
  }
  KnowledgeGraph_deleteBackgroundCatchupTriggers_();
  ScriptApp.newTrigger(KG_BG_CATCHUP_HANDLER_)
    .timeBased()
    .afterMinutes(KG_BG_CATCHUP_CONT_MINUTES_)
    .create();
}

/**
 * Entrada del trigger encadenado (sin sesión de usuario).
 */
function KnowledgeGraph_backgroundCatchupJob_() {
  KnowledgeGraph_deleteBackgroundCatchupTriggers_();
  try {
    var res = KnowledgeGraph_runAutomaticCatchUpWithBudget_(KG_BG_CATCHUP_MAX_MS_);
    if (res && res.hasMore) {
      KnowledgeGraph_scheduleBackgroundCatchup_();
    }
  } catch (e) {
    console.error('[KG-BG] job failed: ' + (e.message || e));
    throw e;
  }
}

/**
 * @return {Object}
 */
function KnowledgeGraph_getBackgroundCatchupStatus() {
  KnowledgeGraph_requireView_();
  var p = KnowledgeGraph_autoCatchupProgressRead_();
  return {
    ok: true,
    inProgress: !!(p && p.phase && p.phase !== 'done'),
    triggerScheduled: KnowledgeGraph_backgroundCatchupTriggerInstalled_(),
    progress: p,
  };
}

/**
 * Arranca sync en segundo plano: un lote corto ahora + triggers hasta terminar.
 * @param {boolean} reset
 * @return {Object}
 */
function AdminKnowledgeGraph_enqueueBackgroundSync(reset) {
  KnowledgeGraph_requireAdmin_();
  if (reset) {
    KnowledgeGraph_autoCatchupProgressClear_();
    KnowledgeGraph_rebuildProgressClear_();
    KnowledgeGraph_deleteBackgroundCatchupTriggers_();
  }
  var kick = KnowledgeGraph_runAutomaticCatchUpWithBudget_(KG_BG_CATCHUP_KICKSTART_MS_);
  if (kick.reason === 'aligned') {
    return {
      ok: true,
      aligned: true,
      hasMore: false,
      processed: 0,
      phase: 'done',
    };
  }
  if (kick.hasMore) {
    KnowledgeGraph_scheduleBackgroundCatchup_();
  }
  return {
    ok: true,
    aligned: false,
    hasMore: !!kick.hasMore,
    triggerScheduled: KnowledgeGraph_backgroundCatchupTriggerInstalled_(),
    processed: kick.processed || 0,
    failed: kick.failed || 0,
    phase: kick.phase || 'contents',
    progress: kick.progress || null,
  };
}

/**
 * Cancela sync en segundo plano (no borra nodos ya escritos en Supabase).
 * @return {{ok:boolean}}
 */
function AdminKnowledgeGraph_discardBackgroundSync() {
  KnowledgeGraph_requireAdmin_();
  KnowledgeGraph_autoCatchupProgressClear_();
  KnowledgeGraph_rebuildProgressClear_();
  KnowledgeGraph_deleteBackgroundCatchupTriggers_();
  return { ok: true };
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
  var weight = Number(edgeRow.weight);
  if (isNaN(weight) || weight <= 0) weight = 1.0;
  return {
    id: String(edgeRow.edge_id || ''),
    source: String(edgeRow.source_id || ''),
    target: String(edgeRow.target_id || ''),
    relation: String(edgeRow.relation_type || ''),
    weight: weight,
    edgeSource: String(edgeRow.source || 'structural'),
    payload:
      edgeRow.payload && typeof edgeRow.payload === 'object' && !Array.isArray(edgeRow.payload)
        ? edgeRow.payload
        : {},
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
    // 1 HTTP con ilike en vez de 5 queries por tipo
    var searchRows = KnowledgeGraphStore_bulkListNodes({ cap: 200, searchQ: searchQ });
    var q = searchQ.toLowerCase();
    var hits = [];
    var ri;
    for (ri = 0; ri < searchRows.length && hits.length < 25; ri++) {
      var lbl = String(searchRows[ri].label || searchRows[ri].node_id || '').toLowerCase();
      if (lbl.indexOf(q) >= 0) {
        hits.push(String(searchRows[ri].node_id || ''));
      }
    }
    return hits;
  }

  var hubLimit = KnowledgeGraphLimits_get().hubSeedLimit;
  var contentRows = KnowledgeGraphStore_listNodesByType('content', hubLimit + 40);
  /** @type {Array<string>} */
  var seeds = [];
  var ci;
  for (ci = 0; ci < contentRows.length && seeds.length < hubLimit; ci++) {
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
 * BFS en memoria sobre todos los nodos/aristas pre-cargados en bulk (2 queries HTTP).
 * Elimina el patrón N+1 anterior (2 HTTP por nodo en frontier + 1 por vecino).
 *
 * Estrategia:
 *  1. Bulk-load de todos los nodos del grafo (1 HTTP).
 *  2. BFS en memoria para elegir subconjunto desde seedIds, respetando filtros y maxNodes.
 *  3. Bulk-load paginado de todas las aristas (varias HTTP, sin IN en URL).
 *
 * @param {Array<string>} seedIds
 * @param {Object} filters
 * @return {{ok:boolean,nodes:Array<Object>,edges:Array<Object>,truncated:boolean,stats:Object}}
 */
function KnowledgeGraph_expandSubgraph_(seedIds, filters) {
  filters = filters || {};
  var limits = KnowledgeGraphLimits_get();
  var maxNodes = Math.min(
    limits.maxNodesCap,
    Math.max(50, Number(filters.maxNodes) || limits.maxNodesDefault),
  );
  var depth = Math.min(
    limits.bfsDepthCap,
    Math.max(1, Number(filters.depth) || limits.bfsDepthDefault),
  );

  // --- 1. Bulk-load de nodos (paginado: todos, no solo los primeros 500 por node_id) ---
  var allNodeRows = KnowledgeGraphStore_bulkListAllNodes();

  /** @type {Object<string, Object>} */
  var allNodesById = {};
  var ni;
  for (ni = 0; ni < allNodeRows.length; ni++) {
    var nr = allNodeRows[ni];
    allNodesById[String(nr.node_id || '')] = nr;
  }

  // --- 2. BFS en memoria ---
  /** @type {Object<string, boolean>} */
  var selected = {};
  /** @type {Array<string>} */
  var order = [];

  function tryAdd_(nid) {
    if (!nid || selected[nid]) return false;
    var row = allNodesById[nid];
    if (!row) {
      row = KnowledgeGraphStore_getNode(nid);
      if (row) allNodesById[nid] = row;
    }
    if (!row) return false;
    if (!KnowledgeGraph_nodePassesFilters_(row, filters)) return false;
    if (order.length >= maxNodes) return false;
    selected[nid] = true;
    order.push(nid);
    return true;
  }

  // Semillas: cargar solo las que existen en el bulk
  var si;
  for (si = 0; si < seedIds.length; si++) {
    tryAdd_(seedIds[si]);
  }

  // Si alguna semilla no está en el bulk (grafo muy grande), recuperarla individualmente
  if (!order.length && seedIds.length) {
    var fallbackRows = KnowledgeGraphStore_getNodesByIds(seedIds);
    for (si = 0; si < fallbackRows.length; si++) {
      var fb = fallbackRows[si];
      var fbId = String(fb.node_id || '');
      if (!allNodesById[fbId]) allNodesById[fbId] = fb;
      tryAdd_(fbId);
    }
  }

  // Pre-indexar aristas por nodo para BFS eficiente.
  // 1 HTTP, sin filtro por IDs: filtrar por IN(node_ids) revienta el URL
  // de UrlFetchApp (límite 2 KB) cuando hay > ~40 ids.
  var allEdgeRows = KnowledgeGraphStore_bulkListAllEdges();

  /** @type {Object<string, Array<Object>>} */
  var edgesBySrc = {};
  /** @type {Object<string, Array<Object>>} */
  var edgesByTgt = {};
  var ei;
  for (ei = 0; ei < allEdgeRows.length; ei++) {
    var er = allEdgeRows[ei];
    var src = String(er.source_id || '');
    var tgt = String(er.target_id || '');
    if (src) {
      if (!edgesBySrc[src]) edgesBySrc[src] = [];
      edgesBySrc[src].push(er);
    }
    if (tgt) {
      if (!edgesByTgt[tgt]) edgesByTgt[tgt] = [];
      edgesByTgt[tgt].push(er);
    }
  }

  var truncated = false;
  var frontier = order.slice();
  var d;
  for (d = 0; d < depth; d++) {
    if (!frontier.length || order.length >= maxNodes) break;
    var nextFrontier = [];
    var fi;
    for (fi = 0; fi < frontier.length; fi++) {
      if (order.length >= maxNodes) { truncated = true; break; }
      var fid = frontier[fi];
      var neighbors = (edgesBySrc[fid] || []).concat(edgesByTgt[fid] || []);
      for (ei = 0; ei < neighbors.length; ei++) {
        if (order.length >= maxNodes) { truncated = true; break; }
        var edge = neighbors[ei];
        var other = String(edge.source_id || '') === fid
          ? String(edge.target_id || '')
          : String(edge.source_id || '');
        if (!other || selected[other]) continue;
        if (tryAdd_(other)) nextFrontier.push(other);
      }
    }
    frontier = nextFrontier;
  }

  if (order.length >= maxNodes) truncated = true;

  // --- 3. Construir nodos de salida ---
  var outNodes = [];
  for (si = 0; si < order.length; si++) {
    var onid = order[si];
    if (allNodesById[onid]) outNodes.push(KnowledgeGraph_toApiNode_(allNodesById[onid]));
  }

  // --- 4. Filtrar aristas: solo las que conectan dos nodos seleccionados ---
  var edgeSeen = {};
  var outEdges = [];
  for (si = 0; si < order.length; si++) {
    var nid2 = order[si];
    var edgesForNode = (edgesBySrc[nid2] || []).concat(edgesByTgt[nid2] || []);
    for (ei = 0; ei < edgesForNode.length; ei++) {
      var edgeRow = edgesForNode[ei];
      var eSrc = String(edgeRow.source_id || '');
      var eTgt = String(edgeRow.target_id || '');
      if (!selected[eSrc] || !selected[eTgt]) continue;
      var eid2 = String(edgeRow.edge_id || eSrc + '|' + eTgt + '|' + edgeRow.relation_type);
      if (edgeSeen[eid2]) continue;
      edgeSeen[eid2] = true;
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
      loadedNodes: allNodeRows.length,
      loadedEdges: allEdgeRows.length,
      depth: depth,
      maxDepth: limits.bfsDepthCap,
      maxNodes: maxNodes,
      maxNodesCap: limits.maxNodesCap,
      seedCount: seedIds.length,
    },
  };
}

/** @type {number} */
var KNOWLEDGE_GRAPH_CHAT_MAX_NODES = 32;

/** @type {number} */
var KNOWLEDGE_GRAPH_CHAT_DEPTH = 2;

/**
 * @param {string} relation
 * @return {string}
 */
function KnowledgeGraph_relationLabelEs_(relation) {
  var map = {
    belongs_to: 'pertenece a',
    in_industry: 'industria',
    tagged_with: 'tag',
    has_stage: 'etapa',
    has_pricing_model: 'modelo comercial',
    related_content: 'contenido relacionado',
    similar_to: 'similar semánticamente',
    delivers: 'ofrece',
    uses_technology: 'usa tecnología',
    achieved: 'logró resultado',
    addresses_theme: 'aborda tema',
  };
  return map[String(relation || '')] || String(relation || '');
}

/**
 * @param {string} question
 * @return {{seedIds:Array<string>,clientName:string,clientId:string,industry:string,contentType:string}}
 */
function KnowledgeGraph_detectSeedsFromQuestion_(question) {
  var q = String(question || '').trim();
  var qLower = q.toLowerCase();
  /** @type {Array<string>} */
  var seedIds = [];
  var clientName = '';
  var clientId = '';
  var industry = '';
  var contentType = '';

  if (/success|caso\s+de\s+éxito|caso\s+de\s+exito|success\s+case/i.test(q)) {
    contentType = 'success_case';
  } else if (/propuesta|proposal|\brfp\b/i.test(q)) {
    contentType = 'proposal';
  } else if (/onboarding/i.test(q)) {
    contentType = 'onboarding';
  }

  try {
    var combo = ClientsMaster_listForCombo();
    var clients = (combo && combo.clients) || [];
    var i;
    for (i = 0; i < clients.length; i++) {
      var name = String(clients[i].name || '').trim();
      if (!name) continue;
      var nameLower = name.toLowerCase();
      if (qLower.indexOf(nameLower) >= 0) {
        clientName = name;
        clientId = String(clients[i].id || '').trim();
        break;
      }
      var words = nameLower.split(/\s+/);
      var w;
      for (w = 0; w < words.length; w++) {
        if (words[w].length < 4 || qLower.indexOf(words[w]) < 0) continue;
        clientName = name;
        clientId = String(clients[i].id || '').trim();
        break;
      }
      if (clientName) break;
    }
  } catch (eCl) {
    console.log('[KG-CHAT] client detect: ' + String(eCl.message || eCl).slice(0, 80));
  }

  if (clientId) {
    seedIds.push(KnowledgeGraph_nodeId_('client', clientId));
  }

  if (typeof CLIENTS_ALLOWED_INDUSTRIES !== 'undefined' && CLIENTS_ALLOWED_INDUSTRIES.length) {
    var ii;
    for (ii = 0; ii < CLIENTS_ALLOWED_INDUSTRIES.length; ii++) {
      var ind = String(CLIENTS_ALLOWED_INDUSTRIES[ii] || '').trim();
      if (!ind) continue;
      if (qLower.indexOf(ind.toLowerCase()) >= 0) {
        industry = ind;
        seedIds.push(KnowledgeGraph_nodeId_('industry', KnowledgeGraph_slug_(ind)));
        break;
      }
    }
  }

  if (!seedIds.length && q.length >= 3) {
    seedIds = KnowledgeGraph_resolveSeedIds_({ searchQuery: q, contentType: contentType });
  }

  return {
    seedIds: seedIds,
    clientName: clientName,
    clientId: clientId,
    industry: industry,
    contentType: contentType,
  };
}

/**
 * @param {string} contentNodeId
 * @param {Array<Object>} edges
 * @param {Object<string, Object>} nodeById
 * @return {{path:string,tags:Array<string>,client:string,industry:string}}
 */
function KnowledgeGraph_hintsForContentNode_(contentNodeId, edges, nodeById) {
  var tags = [];
  var client = '';
  var industry = '';
  var ei;
  for (ei = 0; ei < edges.length; ei++) {
    var e = edges[ei];
    if (String(e.source || e.source_id || '') !== contentNodeId) continue;
    var tgt = String(e.target || e.target_id || '');
    var n = nodeById[tgt];
    if (!n) continue;
    var rel = String(e.relation_type || '');
    var lbl = String(n.label || tgt);
    if (rel === 'tagged_with') tags.push(lbl);
    else if (rel === 'belongs_to') client = lbl;
    else if (rel === 'in_industry') industry = lbl;
    else if (rel === 'related_content' || rel === 'similar_to') tags.push('↔ ' + lbl);
    else if (
      rel === 'delivers' ||
      rel === 'uses_technology' ||
      rel === 'achieved' ||
      rel === 'addresses_theme'
    ) {
      tags.push(lbl);
    }
  }
  var eiIn;
  for (eiIn = 0; eiIn < edges.length; eiIn++) {
    var eIn = edges[eiIn];
    if (String(eIn.target || eIn.target_id || '') !== contentNodeId) continue;
    if (String(eIn.relation || eIn.relation_type || '') !== 'related_content') continue;
    var src = String(eIn.source || eIn.source_id || '');
    var nIn = nodeById[src];
    if (nIn) tags.push('↔ ' + String(nIn.label || src));
  }
  var parts = [];
  if (client) parts.push('Cliente: ' + client);
  if (industry) parts.push('Industria: ' + industry);
  if (tags.length) parts.push('Vínculos: ' + tags.join(', '));
  return {
    path: parts.join(' | '),
    tags: tags,
    client: client,
    industry: industry,
  };
}

/**
 * @param {Array<Object>} apiNodes
 * @param {Array<Object>} apiEdges
 * @param {string} clientHint
 * @return {string}
 */
function KnowledgeGraph_buildGraphSummaryText_(apiNodes, apiEdges, clientHint) {
  var lines = [];
  lines.push('Subgrafo del catálogo Aviators relevante a la consulta:');
  if (clientHint) lines.push('- Cliente foco: ' + clientHint);

  var clients = [];
  var industries = [];
  var tags = [];
  var ni;
  for (ni = 0; ni < apiNodes.length; ni++) {
    var nt = String(apiNodes[ni].type || '');
    var lbl = String(apiNodes[ni].label || '');
    if (nt === 'client' || nt === 'client_label') clients.push(lbl);
    else if (nt === 'industry') industries.push(lbl);
    else if (nt === 'tag') tags.push(lbl);
  }
  if (clients.length) lines.push('- Clientes en el subgrafo: ' + clients.slice(0, 8).join('; '));
  if (industries.length) {
    lines.push('- Industrias: ' + industries.slice(0, 6).join('; '));
  }
  if (tags.length) lines.push('- Tags: ' + tags.slice(0, 12).join('; '));

  var relCount = {};
  var ei;
  for (ei = 0; ei < apiEdges.length && ei < 40; ei++) {
    var rel = String(apiEdges[ei].relation || '');
    relCount[rel] = (relCount[rel] || 0) + 1;
  }
  var relParts = [];
  var rk;
  for (rk in relCount) {
    if (Object.prototype.hasOwnProperty.call(relCount, rk)) {
      relParts.push(KnowledgeGraph_relationLabelEs_(rk) + ' (' + relCount[rk] + ')');
    }
  }
  if (relParts.length) lines.push('- Tipos de vínculo: ' + relParts.join(', '));

  var contentCount = 0;
  for (ni = 0; ni < apiNodes.length; ni++) {
    if (String(apiNodes[ni].type || '') === 'content') contentCount++;
  }
  lines.push('- Documentos de contenido enlazados: ' + contentCount);
  return lines.join('\n').slice(0, 3500);
}

/**
 * @param {Array<Object>} apiNodes
 * @param {Array<Object>} apiEdges
 * @param {number} limit
 * @return {Array<Object>}
 */
function KnowledgeGraph_graphToCatalogDocs_(apiNodes, apiEdges, limit) {
  var lim = Math.min(15, Math.max(1, Number(limit) || 12));
  /** @type {Object<string, Object>} */
  var nodeById = {};
  var ni;
  for (ni = 0; ni < apiNodes.length; ni++) {
    nodeById[String(apiNodes[ni].id || '')] = apiNodes[ni];
  }

  /** @type {Array<Object>} */
  var contentNodes = [];
  for (ni = 0; ni < apiNodes.length; ni++) {
    if (String(apiNodes[ni].type || '') === 'content') contentNodes.push(apiNodes[ni]);
  }

  /** @type {Array<Object>} */
  var docs = [];
  for (ni = 0; ni < contentNodes.length && docs.length < lim; ni++) {
    var node = contentNodes[ni];
    var nid = String(node.id || '');
    var cid = nid.indexOf('content:') === 0 ? nid.replace(/^content:/, '') : '';
    var pl = node.payload && typeof node.payload === 'object' ? node.payload : {};
    if (!cid) cid = String(pl.content_id || '').trim();
    if (!cid) continue;
    var row = ContentCatalogStore_getById(cid);
    if (!row || !ContentCatalog_rowHasCatalogContext_(row)) continue;
    var doc = ContentCatalog_mapRowToCatalogDoc_(row);
    var hints = KnowledgeGraph_hintsForContentNode_(nid, apiEdges, nodeById);
    doc.graphPath = hints.path;
    doc.graphTags = hints.tags.join(', ');
    doc.graphSource = 'knowledge_graph';
    doc.catalogContextOnly = true;
    docs.push(doc);
  }
  return docs;
}

/**
 * Contexto estructurado del grafo para el chat (multi-salto cliente / industria / tags).
 * @param {string} question
 * @param {{limit?:number,maxNodes?:number,depth?:number,ragContentIds?:Array<string>}} [opts]
 * @return {{ok:boolean,docs:Array<Object>,graphSummary:string,clientName:string,stats:Object}}
 */
function KnowledgeGraph_resolveContextForQuestion_(question, opts) {
  opts = opts || {};
  var detected = KnowledgeGraph_detectSeedsFromQuestion_(question);
  var seedIds = detected.seedIds || [];

  if (opts.ragContentIds && opts.ragContentIds.length) {
    var rc;
    for (rc = 0; rc < opts.ragContentIds.length; rc++) {
      var cidNode = KnowledgeGraph_nodeId_('content', opts.ragContentIds[rc]);
      if (seedIds.indexOf(cidNode) < 0) {
        seedIds.push(cidNode);
      }
    }
  }

  if (!seedIds.length) {
    return {
      ok: true,
      docs: [],
      graphSummary: '',
      clientName: detected.clientName || '',
      stats: { seedCount: 0, reason: 'no_seeds' },
    };
  }

  var expanded = KnowledgeGraph_expandSubgraph_(seedIds, {
    depth: opts.depth || KNOWLEDGE_GRAPH_CHAT_DEPTH,
    maxNodes: opts.maxNodes || KNOWLEDGE_GRAPH_CHAT_MAX_NODES,
    contentType: detected.contentType,
    allowedNodeTypes: {
      content: true,
      client: true,
      client_label: true,
      industry: true,
      tag: true,
      stage: true,
      pricing_model: true,
      offering: true,
      technology: true,
      outcome: true,
      theme: true,
    },
  });

  var docs = KnowledgeGraph_graphToCatalogDocs_(
    expanded.nodes,
    expanded.edges,
    opts.limit || 12,
  );
  docs = ContentCatalog_filterDocsForSessionRole_(docs);

  var summary = '';
  if (expanded.nodes.length) {
    summary = KnowledgeGraph_buildGraphSummaryText_(
      expanded.nodes,
      expanded.edges,
      detected.clientName,
    );
  }

  console.log(
    '[KG-CHAT] seeds=' +
      seedIds.length +
      ' nodes=' +
      expanded.nodes.length +
      ' docs=' +
      docs.length,
  );

  return {
    ok: true,
    docs: docs,
    graphSummary: summary,
    clientName: detected.clientName || '',
    stats: {
      seedCount: seedIds.length,
      graphNodes: expanded.nodes.length,
      graphEdges: expanded.edges.length,
      docCount: docs.length,
      truncated: expanded.truncated,
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
 * Catálogo de tipos de entidad y relación con conteos en Supabase.
 * @return {{ok:boolean,nodeTypes:Array<{type:string,count:number}>,relationTypes:Array<{relation:string,count:number}>,totalNodes:number,totalEdges:number}}
 */
function KnowledgeGraph_getEntityCatalog() {
  KnowledgeGraph_requireView_();
  /** @type {Array<{type:string,count:number}>} */
  var nodeTypes = [];
  var i;
  for (i = 0; i < KNOWLEDGE_GRAPH_ENTITY_NODE_TYPES_.length; i++) {
    var nt = KNOWLEDGE_GRAPH_ENTITY_NODE_TYPES_[i];
    nodeTypes.push({
      type: nt,
      count: KnowledgeGraphStore_countNodesByType(nt),
    });
  }
  /** @type {Array<{relation:string,count:number}>} */
  var relationTypes = [];
  for (i = 0; i < KNOWLEDGE_GRAPH_ENTITY_RELATION_TYPES_.length; i++) {
    var rel = KNOWLEDGE_GRAPH_ENTITY_RELATION_TYPES_[i];
    relationTypes.push({
      relation: rel,
      count: KnowledgeGraphStore_countEdgesByRelation(rel),
    });
  }
  return {
    ok: true,
    nodeTypes: nodeTypes,
    relationTypes: relationTypes,
    totalNodes: KnowledgeGraphStore_countAllNodes(),
    totalEdges: KnowledgeGraphStore_countAllEdges(),
  };
}

/**
 * Listado paginado de entidades (nodos) del grafo.
 * @param {Object} params
 * @return {{ok:boolean,items:Array<Object>,total:number,skip:number,limit:number,hasMore:boolean}}
 */
function KnowledgeGraph_listEntities(params) {
  KnowledgeGraph_requireView_();
  params = params || {};
  var skip = Math.max(0, Number(params.skip) || 0);
  var limit = Math.min(100, Math.max(1, Number(params.limit) || 25));
  var nodeType = String(params.nodeType || '').trim();
  var searchQuery = String(params.searchQuery || '').trim();
  if (
    nodeType &&
    KNOWLEDGE_GRAPH_ENTITY_NODE_TYPES_.indexOf(nodeType) < 0
  ) {
    throw AviatorsError_throw_(
      'ERR_KG_INVALID_ENTITY_TYPE',
      'KnowledgeGraph_listEntities',
      nodeType,
    );
  }
  var total = KnowledgeGraphStore_countEntities({
    nodeType: nodeType,
    searchQuery: searchQuery,
  });
  var rows = KnowledgeGraphStore_listEntitiesPage({
    nodeType: nodeType,
    searchQuery: searchQuery,
    skip: skip,
    limit: limit,
  });
  /** @type {Array<Object>} */
  var items = [];
  var ri;
  for (ri = 0; ri < rows.length; ri++) {
    items.push(KnowledgeGraph_toApiNode_(rows[ri]));
  }
  return {
    ok: true,
    items: items,
    total: total,
    skip: skip,
    limit: limit,
    hasMore: skip + items.length < total,
  };
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
 * Un lote de rebuild por etapa (cada RPC acota tiempo; el progreso queda en Supabase).
 * @param {string} phase contents|clients|salesforce|stale|prune
 * @param {number} skip
 * @param {number} limit
 * @return {Object}
 */
function KnowledgeGraph_rebuildStep(phase, skip, limit, reset) {
  KnowledgeGraph_requireAdmin_();
  var ph = String(phase || 'contents').trim();
  var s = Math.max(0, Number(skip) || 0);
  var lim = Math.min(
    KNOWLEDGE_GRAPH_REBUILD_BATCH_MAX,
    Math.max(1, Number(limit) || KNOWLEDGE_GRAPH_REBUILD_BATCH_MAX),
  );
  if (reset && ph === 'contents' && s === 0) {
    KnowledgeGraph_rebuildProgressWrite_({
      started_at: new Date().toISOString(),
      phase: 'contents',
      skip: 0,
      totals: {},
    });
  }

  var batch = KnowledgeGraph_executePhaseBatch_(ph, s, lim);
  if (!batch.ok) return batch;

  var done = batch.done;
  var failed = batch.failed;
  var removed = batch.removed;
  var hasMore = batch.hasMore;
  var nextPhase = batch.nextPhase;
  var nextSkip = batch.nextSkip;
  var errors = batch.errors || [];
  var total = -1;

  var progress = KnowledgeGraph_rebuildProgressRead_() || {};
  if (!progress.totals) progress.totals = {};
  progress.totals[ph + '_done'] =
    (Number(progress.totals[ph + '_done']) || 0) + done;
  progress.totals[ph + '_failed'] =
    (Number(progress.totals[ph + '_failed']) || 0) + failed;
  if (removed) {
    progress.totals[ph + '_removed'] =
      (Number(progress.totals[ph + '_removed']) || 0) + removed;
  }
  progress.phase = hasMore ? ph : nextPhase;
  progress.skip = nextSkip;
  if (nextPhase === 'done') {
    progress.completed_at = new Date().toISOString();
    KnowledgeGraph_rebuildProgressWrite_(progress);
    KnowledgeGraph_rebuildProgressClear_();
  } else {
    KnowledgeGraph_rebuildProgressWrite_(progress);
  }

  return {
    ok: true,
    phase: ph,
    nextPhase: nextPhase,
    nextSkip: nextSkip,
    processed: batch.processed,
    done: done,
    failed: failed,
    removed: removed,
    skip: s,
    limit: lim,
    total: total,
    hasMore: hasMore,
    phaseComplete: !hasMore,
    rebuildComplete: nextPhase === 'done',
    errors: errors.slice(0, 5),
    progress: progress,
  };
}

/**
 * @param {number} skip
 * @param {number} limit
 * @return {Object}
 */
function KnowledgeGraph_rebuildBatch(skip, limit) {
  return KnowledgeGraph_rebuildStep('contents', skip, limit);
}
