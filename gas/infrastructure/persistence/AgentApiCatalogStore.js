/**
 * @fileoverview Catálogo API de agentes (model/strategy) en Supabase.
 */

/**
 * @return {Array<{model:string,strategy:string}>}
 */
function AgentApiCatalogStore_listAll() {
  var rows = SupabaseRest_select(
    SUPABASE_TABLE.AGENT_API_CATALOG,
    'select=model,strategy&order=id.asc',
  );
  return rows.map(function (r) {
    return {
      model: String(r.model || '').trim(),
      strategy: String(r.strategy || '').trim(),
    };
  });
}

/**
 * @param {Array<{model:string,strategy:string}>} rows
 */
function AgentApiCatalogStore_replaceAll(rows) {
  SupabaseRest_delete(
    SUPABASE_TABLE.AGENT_API_CATALOG,
    SupabaseRest_filter_('id', 'gt', '0'),
  );
  if (!rows || !rows.length) return;
  var payload = [];
  for (var i = 0; i < rows.length; i++) {
    payload.push({
      model: String(rows[i].model || '').trim(),
      strategy: String(rows[i].strategy || '').trim(),
    });
  }
  SupabaseRest_insert(SUPABASE_TABLE.AGENT_API_CATALOG, payload, { prefer: 'return=minimal' });
}

/**
 * @return {number}
 */
function AgentApiCatalogStore_clearAll() {
  var rows = AgentApiCatalogStore_listAll();
  if (!rows.length) return 0;
  SupabaseRest_delete(
    SUPABASE_TABLE.AGENT_API_CATALOG,
    SupabaseRest_filter_('id', 'gt', '0'),
  );
  return rows.length;
}
