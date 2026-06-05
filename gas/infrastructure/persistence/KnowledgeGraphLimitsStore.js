/**
 * @fileoverview Límites del grafo de conocimiento en app_settings (Supabase).
 */

/**
 * @return {Object|null}
 */
function KnowledgeGraphLimitsStore_loadRaw_() {
  var q = SupabaseRest_query_([
    'select=value',
    SupabaseRest_filter_('key', 'eq', SUPABASE_SETTINGS_KEY.KNOWLEDGE_GRAPH_LIMITS),
    'limit=1',
  ]);
  var rows = SupabaseRest_select(SUPABASE_TABLE.APP_SETTINGS, q);
  if (!rows.length) return null;
  var val = rows[0].value;
  if (!val || typeof val !== 'object' || Array.isArray(val)) return null;
  return val;
}

/**
 * @param {Object} payload
 */
function KnowledgeGraphLimitsStore_saveRaw_(payload) {
  SupabaseRest_upsert(
    SUPABASE_TABLE.APP_SETTINGS,
    {
      key: SUPABASE_SETTINGS_KEY.KNOWLEDGE_GRAPH_LIMITS,
      value: payload || {},
      updated_at: new Date().toISOString(),
    },
    'key',
  );
}
