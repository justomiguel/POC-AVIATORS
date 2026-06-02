/**
 * @fileoverview Restablecimiento total de datos operativos en Supabase (solo admin).
 * No toca roles ni secretos de Script Properties.
 */

/**
 * Borra filas operativas en tablas Supabase (catálogo, métricas, clientes, catálogo API).
 * @return {{ok:boolean, cleared:Object, preserved:Array<string>, backend:string}}
 */
function AdminReset_resetAllOperationalData() {
  AdminAuth_requireAdmin();
  AviatorsDataBackend_requireSupabase_();

  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var clearedSb = {
      contentCatalog: {
        common: ContentCatalogStore_clearAll(),
        proposals: 0,
        successCases: 0,
        clients: 0,
        onboarding: 0,
      },
      metrics: MetricsStore_clearAll(),
      clientsMaster: ClientsMasterStore_clearAll(),
      agentApiCatalog: AgentApiCatalogStore_clearAll(),
    };
    return {
      ok: true,
      cleared: clearedSb,
      preserved: ['roles', 'script_secrets'],
      backend: 'supabase',
    };
  } finally {
    lock.releaseLock();
  }
}

/**
 * @deprecated Usar AdminReset_resetAllOperationalData. Mantiene RPC legacy en Code.js.
 * @return {{ok:boolean, cleared:Object, preserved:Array<string>, backend:string}}
 */
function AdminReset_resetAllSpreadsheetData() {
  return AdminReset_resetAllOperationalData();
}
