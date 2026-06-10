/**
 * @fileoverview Extracción de entidades de negocio (grafo conceptual) vía Globant LLM.
 */

/** @type {Array<string>} */
var KG_EXTRACTION_ENTITY_TYPES_ = ['offering', 'technology', 'outcome', 'theme'];

/** @type {Object<string, boolean>} */
var KG_EXTRACTION_RELATIONS_ = {
  delivers: true,
  uses_technology: true,
  achieved: true,
  addresses_theme: true,
};

/** @type {number} */
var KG_EXTRACTION_MAX_ENTITIES_ = 8;

/** @type {number} */
var KG_EXTRACTION_MAX_RELATIONS_ = 12;

/** @type {number} */
var KG_EXTRACTION_MIN_TEXT_CHARS_ = 80;

/**
 * @return {ReturnType<GlobantAssistantApiClient_create>}
 */
function KnowledgeGraphExtraction_createClient_() {
  var props = PropertiesService.getScriptProperties();
  var apiKey = (props.getProperty(LLM_PROP.GLOBANT_API_KEY) || '').trim();
  if (!apiKey) throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_falta_globant_key'));
  var baseUrl = (props.getProperty(LLM_PROP.GLOBANT_BASE_URL) || '').trim();
  return GlobantAssistantApiClient_create({
    apiKey: apiKey,
    baseUrl: baseUrl || undefined,
  });
}

/**
 * @param {string} text
 * @return {Object}
 */
function KnowledgeGraphExtraction_parseJson_(text) {
  var raw = String(text || '').trim();
  if (!raw) return {};
  var start = raw.indexOf('{');
  if (start < 0) return {};
  if (typeof ContentExtraction_findJsonEnd_ === 'function') {
    var end = ContentExtraction_findJsonEnd_(raw, start);
    if (end >= 0) {
      try {
        var parsed = JSON.parse(raw.substring(start, end + 1));
        return parsed && typeof parsed === 'object' ? parsed : {};
      } catch (ignoreParse) {}
    }
  }
  if (typeof ContentExtraction_parseLooseJson_ === 'function') {
    return ContentExtraction_parseLooseJson_(raw);
  }
  return {};
}

/**
 * @param {Object} row
 * @return {string}
 */
function KnowledgeGraphExtraction_catalogOfferingEnum_(row) {
  if (typeof KnowledgeGraph_resolveProposalOfferingEnum_ === 'function') {
    var specific = ContentCatalogStore_rowToSpecific_(row);
    return KnowledgeGraph_resolveProposalOfferingEnum_(specific);
  }
  return '';
}

/**
 * @param {Object} row
 * @return {Array<string>}
 */
function KnowledgeGraphExtraction_catalogTechnologyKeys_(row) {
  var specific = ContentCatalogStore_rowToSpecific_(row);
  var raw = specific && specific.technologies ? String(specific.technologies) : '';
  if (!raw || typeof KnowledgeGraph_splitTechnologies_ !== 'function') return [];
  var list = KnowledgeGraph_splitTechnologies_(raw);
  var out = [];
  var i;
  for (i = 0; i < list.length; i++) {
    var slug = KnowledgeGraph_slug_(list[i]);
    if (slug && slug !== 'unknown') out.push(slug);
  }
  return out;
}

/**
 * @param {string} entityType
 * @param {string} label
 * @param {Object} [row]
 * @return {{nodeId:string,label:string,slug:string,type:string}|null}
 */
function KnowledgeGraphExtraction_canonicalizeEntity_(entityType, label, row) {
  var type = String(entityType || '').trim();
  if (KG_EXTRACTION_ENTITY_TYPES_.indexOf(type) < 0) return null;
  var lbl = String(label || '').trim();
  if (!lbl || lbl.length < 2) return null;

  if (type === 'offering') {
    var catalogOff = row ? KnowledgeGraphExtraction_catalogOfferingEnum_(row) : '';
    if (catalogOff) return null;
    var enumFromLabel =
      typeof ContentExtraction_normalizeProposalPricingEnum_ === 'function'
        ? ContentExtraction_normalizeProposalPricingEnum_(lbl)
        : '';
    if (enumFromLabel) {
      var enumNodeId = KnowledgeGraph_nodeId_('offering', enumFromLabel);
      var enumLabel =
        typeof KnowledgeGraph_offeringEnumLabel_ === 'function'
          ? KnowledgeGraph_offeringEnumLabel_(enumFromLabel)
          : enumFromLabel;
      return {
        nodeId: enumNodeId,
        label: enumLabel,
        slug: enumFromLabel.toLowerCase(),
        type: 'offering',
      };
    }
  }

  if (lbl.length > 120) lbl = lbl.slice(0, 120);
  var slug = KnowledgeGraph_slug_(lbl);
  if (!slug || slug === 'unknown') return null;

  if (type === 'technology' && row) {
    var techKeys = KnowledgeGraphExtraction_catalogTechnologyKeys_(row);
    if (techKeys.indexOf(slug) >= 0) return null;
  }

  var nodeId = KnowledgeGraph_nodeId_(type, slug);
  return { nodeId: nodeId, label: lbl, slug: slug, type: type };
}

/**
 * @param {Object} row
 * @return {string}
 */
function KnowledgeGraphExtraction_buildContextText_(row) {
  if (!row || typeof row !== 'object') return '';
  var parts = [];
  var title = String(row.title || '').trim();
  var summary = String(row.summary || '').trim();
  var ctype = String(row.content_type || '').trim();
  var client = String(row.client_name || '').trim();
  var industry = String(row.industry || '').trim();
  var tags = String(row.tags_csv || '').trim();
  if (title) parts.push('Title: ' + title);
  if (ctype) parts.push('Type: ' + ctype);
  if (client) parts.push('Client: ' + client);
  if (industry) parts.push('Industry: ' + industry);
  if (summary) parts.push('Summary: ' + summary);
  if (tags) parts.push('Tags: ' + tags);
  var searchText = String(row.search_text || '').trim();
  if (searchText) parts.push('Body excerpt:\n' + searchText.slice(0, 6000));
  var specific = ContentCatalogStore_rowToSpecific_(row);
  if (specific && typeof specific === 'object') {
    var sk;
    for (sk in specific) {
      if (!Object.prototype.hasOwnProperty.call(specific, sk)) continue;
      var sv = String(specific[sk] || '').trim();
      if (sv) parts.push(sk + ': ' + sv.slice(0, 800));
    }
  }
  return parts.join('\n');
}

/**
 * @param {Object} row
 * @return {string}
 */
function KnowledgeGraphExtraction_systemPrompt_(row) {
  row = row || {};
  var catalogOff = KnowledgeGraphExtraction_catalogOfferingEnum_(row);
  var offeringRule;
  if (catalogOff) {
    offeringRule =
      'Catalog already has offering enum ' +
      catalogOff +
      ' — do NOT emit type offering; use technology/outcome/theme only.';
  } else {
    offeringRule =
      'offering: ONLY named Globant engagement models (AI Pods, T&M, Fixed Price, Managed Services) when NOT already in catalog metadata.';
  }
  return PromptCatalog_render('kg.extract.system', {
    offeringRule: offeringRule,
    maxEntities: String(KG_EXTRACTION_MAX_ENTITIES_),
    maxRelations: String(KG_EXTRACTION_MAX_RELATIONS_),
  });
}

/**
 * @param {Object} row
 * @return {string}
 */
function KnowledgeGraphExtraction_userPrompt_(row) {
  return PromptCatalog_render('kg.extract.user', {
    contentId: String(row.content_id || ''),
    contextText: KnowledgeGraphExtraction_buildContextText_(row),
  });
}

/**
 * @param {Object} parsed
 * @param {string} contentNodeId
 * @param {Object} row
 * @return {{nodes:Array<Object>,edges:Array<Object>}}
 */
function KnowledgeGraphExtraction_materialize_(parsed, contentNodeId, row) {
  parsed = parsed && typeof parsed === 'object' ? parsed : {};
  var rawEntities = Array.isArray(parsed.entities) ? parsed.entities : [];
  /** @type {Array<{nodeId:string,label:string,type:string,payload:Object}>} */
  var nodes = [];
  /** @type {Array<Object>} */
  var edges = [];
  var entityByIndex = {};
  var seenNode = {};
  var ei;
  for (ei = 0; ei < rawEntities.length && nodes.length < KG_EXTRACTION_MAX_ENTITIES_; ei++) {
    var ent = rawEntities[ei] || {};
    var hit = KnowledgeGraphExtraction_canonicalizeEntity_(ent.type, ent.label, row);
    if (!hit) continue;
    if (seenNode[hit.nodeId]) continue;
    seenNode[hit.nodeId] = true;
    var payload = { slug: hit.slug, source: 'llm' };
    if (String(ent.metric || '').trim()) payload.metric = String(ent.metric).trim();
    if (ent.value != null && ent.value !== '') payload.value = ent.value;
    nodes.push({
      nodeId: hit.nodeId,
      label: hit.label,
      type: hit.type,
      payload: payload,
    });
    entityByIndex[ei] = hit.nodeId;
  }

  var rawRelations = Array.isArray(parsed.relations) ? parsed.relations : [];
  var ri;
  for (ri = 0; ri < rawRelations.length && edges.length < KG_EXTRACTION_MAX_RELATIONS_; ri++) {
    var relRow = rawRelations[ri] || {};
    var rel = String(relRow.relation || '').trim();
    if (!KG_EXTRACTION_RELATIONS_[rel]) continue;
    var idx = Number(relRow.entity_index);
    if (isNaN(idx) || idx < 0 || !entityByIndex[idx]) continue;
    var conf = Number(relRow.confidence);
    if (isNaN(conf) || conf < 0.5) conf = 0.75;
    if (conf > 1) conf = 1;
    edges.push({
      target_id: entityByIndex[idx],
      relation_type: rel,
      source: 'llm',
      weight: conf,
      payload: { confidence: conf },
    });
  }

  return { nodes: nodes, edges: edges };
}

/**
 * @param {Object} row
 * @return {{nodes:Array<Object>,edges:Array<Object>}}
 */
function KnowledgeGraphExtraction_extractFromRow_(row) {
  var ctx = KnowledgeGraphExtraction_buildContextText_(row);
  if (ctx.length < KG_EXTRACTION_MIN_TEXT_CHARS_) {
    return { nodes: [], edges: [] };
  }
  var client = KnowledgeGraphExtraction_createClient_();
  var out = client.chatSimple(
    KnowledgeGraphExtraction_systemPrompt_(row),
    KnowledgeGraphExtraction_userPrompt_(row),
  );
  var parsed = KnowledgeGraphExtraction_parseJson_(out.text || '');
  var contentNodeId = KnowledgeGraph_nodeId_('content', String(row.content_id || ''));
  return KnowledgeGraphExtraction_materialize_(parsed, contentNodeId, row);
}

/**
 * Persiste nodos y aristas LLM para un contenido.
 * @param {string} contentId
 */
function KnowledgeGraphExtraction_syncForContentId_(contentId) {
  var id = String(contentId || '').trim();
  if (!id) return;
  var row = ContentCatalogStore_getById(id);
  if (!row) {
    var nodeId = KnowledgeGraph_nodeId_('content', id);
    KnowledgeGraphStore_replaceEdgesForSourceByProvenance_(nodeId, 'llm', []);
    return;
  }

  var extracted = KnowledgeGraphExtraction_extractFromRow_(row);
  var now = new Date().toISOString();
  var ni;
  for (ni = 0; ni < extracted.nodes.length; ni++) {
    var n = extracted.nodes[ni];
    KnowledgeGraphStore_upsertNode({
      node_id: n.nodeId,
      node_type: n.type,
      label: n.label,
      payload: n.payload || {},
      updated_at: now,
    });
  }

  var contentNodeId = KnowledgeGraph_nodeId_('content', id);
  KnowledgeGraphStore_replaceEdgesForSourceByProvenance_(
    contentNodeId,
    'llm',
    extracted.edges || [],
  );
}
