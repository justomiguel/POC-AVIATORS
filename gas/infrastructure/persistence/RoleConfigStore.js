/**
 * @fileoverview Definiciones de roles y permisos en app_settings (Supabase).
 */

/**
 * @return {Object|null}
 */
function RoleConfigStore_loadRaw_() {
  var q = SupabaseRest_query_([
    'select=value',
    SupabaseRest_filter_('key', 'eq', SUPABASE_SETTINGS_KEY.ROLE_DEFINITIONS),
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
function RoleConfigStore_saveRaw_(payload) {
  SupabaseRest_upsert(
    SUPABASE_TABLE.APP_SETTINGS,
    {
      key: SUPABASE_SETTINGS_KEY.ROLE_DEFINITIONS,
      value: payload || { roles: [] },
      updated_at: new Date().toISOString(),
    },
    'key',
  );
}
