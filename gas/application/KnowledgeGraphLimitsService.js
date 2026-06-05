/**
 * @fileoverview Límites configurables del grafo de conocimiento (app_settings).
 */

/** @type {string} */
var KG_LIMITS_CACHE_KEY_ = 'kg_limits_v1';

/** @type {number} */
var KG_LIMITS_CACHE_SEC = 300;

/**
 * @return {Object}
 */
function KnowledgeGraphLimits_defaults_() {
  return {
    version: 1,
    maxNodesDefault:
      typeof KNOWLEDGE_GRAPH_MAX_NODES_DEFAULT !== 'undefined'
        ? KNOWLEDGE_GRAPH_MAX_NODES_DEFAULT
        : 150,
    maxNodesCap:
      typeof KNOWLEDGE_GRAPH_MAX_NODES_CAP !== 'undefined'
        ? KNOWLEDGE_GRAPH_MAX_NODES_CAP
        : 300,
    bfsDepthDefault:
      typeof KNOWLEDGE_GRAPH_BFS_DEPTH_DEFAULT !== 'undefined'
        ? KNOWLEDGE_GRAPH_BFS_DEPTH_DEFAULT
        : 2,
    bfsDepthCap:
      typeof KNOWLEDGE_GRAPH_BFS_DEPTH_CAP !== 'undefined'
        ? KNOWLEDGE_GRAPH_BFS_DEPTH_CAP
        : 4,
    densityCompact: 80,
    densityNormal: 150,
    densityWide: 250,
    hubSeedLimit:
      typeof KNOWLEDGE_GRAPH_HUB_SEED_LIMIT !== 'undefined'
        ? KNOWLEDGE_GRAPH_HUB_SEED_LIMIT
        : 30,
  };
}

/**
 * @param {*} val
 * @param {number} min
 * @param {number} max
 * @param {number} fallback
 * @return {number}
 */
function KnowledgeGraphLimits_clampInt_(val, min, max, fallback) {
  var n = parseInt(String(val), 10);
  if (isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/**
 * @param {Object|null|undefined} raw
 * @return {Object}
 */
function KnowledgeGraphLimits_normalize_(raw) {
  var d = KnowledgeGraphLimits_defaults_();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return d;

  var maxNodesCap = KnowledgeGraphLimits_clampInt_(raw.maxNodesCap, 100, 500, d.maxNodesCap);
  var bfsDepthCap = KnowledgeGraphLimits_clampInt_(raw.bfsDepthCap, 1, 6, d.bfsDepthCap);
  var maxNodesDefault = KnowledgeGraphLimits_clampInt_(
    raw.maxNodesDefault,
    50,
    maxNodesCap,
    Math.min(d.maxNodesDefault, maxNodesCap),
  );
  var bfsDepthDefault = KnowledgeGraphLimits_clampInt_(
    raw.bfsDepthDefault,
    1,
    bfsDepthCap,
    Math.min(d.bfsDepthDefault, bfsDepthCap),
  );
  var hubSeedLimit = KnowledgeGraphLimits_clampInt_(raw.hubSeedLimit, 5, 100, d.hubSeedLimit);

  var densityCompact = KnowledgeGraphLimits_clampInt_(
    raw.densityCompact,
    50,
    maxNodesCap,
    Math.min(d.densityCompact, maxNodesCap),
  );
  var densityNormal = KnowledgeGraphLimits_clampInt_(
    raw.densityNormal,
    densityCompact + 1,
    maxNodesCap,
    Math.min(Math.max(d.densityNormal, densityCompact + 1), maxNodesCap),
  );
  var densityWide = KnowledgeGraphLimits_clampInt_(
    raw.densityWide,
    densityNormal + 1,
    maxNodesCap,
    Math.min(Math.max(d.densityWide, densityNormal + 1), maxNodesCap),
  );

  return {
    version: 1,
    maxNodesDefault: maxNodesDefault,
    maxNodesCap: maxNodesCap,
    bfsDepthDefault: bfsDepthDefault,
    bfsDepthCap: bfsDepthCap,
    densityCompact: densityCompact,
    densityNormal: densityNormal,
    densityWide: densityWide,
    hubSeedLimit: hubSeedLimit,
  };
}

function KnowledgeGraphLimits_invalidateCache_() {
  try {
    CacheService.getScriptCache().remove(KG_LIMITS_CACHE_KEY_);
  } catch (ignore) {}
}

/**
 * Límites efectivos del grafo (cache + Supabase + defaults de código).
 * @return {Object}
 */
function KnowledgeGraphLimits_get() {
  var cache = CacheService.getScriptCache();
  var hit = cache.get(KG_LIMITS_CACHE_KEY_);
  if (hit) {
    try {
      return KnowledgeGraphLimits_normalize_(JSON.parse(hit));
    } catch (ignoreParse) {}
  }
  var raw = null;
  if (AviatorsDataBackend_supabaseConfigured_()) {
    try {
      raw = KnowledgeGraphLimitsStore_loadRaw_();
    } catch (ignoreLoad) {}
  }
  var normalized = KnowledgeGraphLimits_normalize_(raw);
  try {
    cache.put(KG_LIMITS_CACHE_KEY_, JSON.stringify(normalized), KG_LIMITS_CACHE_SEC);
  } catch (ignorePut) {}
  return normalized;
}

/**
 * @param {Object|string} configJson
 * @return {Object}
 */
function AdminKnowledgeGraphLimits_save(configJson) {
  KnowledgeGraph_requireAdmin_();
  var parsed = configJson;
  if (typeof configJson === 'string') {
    try {
      parsed = JSON.parse(configJson);
    } catch (eParse) {
      AviatorsError_throw_('ERR_KG_LIMITS_INVALID', 'AdminKnowledgeGraphLimits_save', eParse);
    }
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    AviatorsError_throw_('ERR_KG_LIMITS_INVALID', 'AdminKnowledgeGraphLimits_save', 'not_object');
  }
  var normalized = KnowledgeGraphLimits_normalize_(parsed);
  if (AviatorsDataBackend_supabaseConfigured_()) {
    KnowledgeGraphLimitsStore_saveRaw_(normalized);
  }
  KnowledgeGraphLimits_invalidateCache_();
  return { ok: true, limits: normalized };
}

/**
 * @return {Object}
 */
function KnowledgeGraph_getLimitsConfig() {
  KnowledgeGraph_requireView_();
  return { ok: true, limits: KnowledgeGraphLimits_get() };
}
