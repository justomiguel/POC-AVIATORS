/**
 * @fileoverview Persistencia de visitantes (sin fila en `roles`) en Supabase.
 */

/**
 * @param {number} [limit]
 * @return {Array<Object>}
 */
function VisitorsStore_listRecent(limit) {
  var lim = Math.min(1000, Math.max(1, Number(limit) || 500));
  return SupabaseRest_select(
    SUPABASE_TABLE.VISITORS,
    SupabaseRest_query_([
      'select=email,display_name,first_seen_at,last_seen_at,visit_count',
      'order=last_seen_at.desc',
      'limit=' + lim,
    ]),
  );
}

/**
 * @return {Array<Object>}
 */
function VisitorsStore_listAll() {
  return VisitorsStore_listRecent(1000);
}

/**
 * @param {string} email
 * @return {Object|null}
 */
function VisitorsStore_get(email) {
  var em = String(email || '').trim().toLowerCase();
  if (!em) return null;
  var q = SupabaseRest_query_([
    'select=email,display_name,first_seen_at,last_seen_at,visit_count',
    SupabaseRest_filter_('email', 'eq', em),
    'limit=1',
  ]);
  var rows = SupabaseRest_select(SUPABASE_TABLE.VISITORS, q);
  return rows.length ? rows[0] : null;
}

/**
 * Registra o actualiza un visitante al iniciar sesión sin rol.
 * @param {string} email
 * @param {string} [displayName]
 */
function VisitorsStore_touchSession(email, displayName) {
  var em = String(email || '').trim().toLowerCase();
  if (!em) return;
  var now = new Date().toISOString();
  var name = String(displayName || '').trim();
  var existing = VisitorsStore_get(em);
  if (existing) {
    SupabaseRest_update(
      SUPABASE_TABLE.VISITORS,
      {
        display_name: name || String(existing.display_name || ''),
        last_seen_at: now,
        visit_count: Number(existing.visit_count || 0) + 1,
      },
      SupabaseRest_filter_('email', 'eq', em),
    );
    return;
  }
  SupabaseRest_insert(
    SUPABASE_TABLE.VISITORS,
    {
      email: em,
      display_name: name,
      first_seen_at: now,
      last_seen_at: now,
      visit_count: 1,
    },
    { prefer: 'return=minimal' },
  );
}

/**
 * @param {string} email
 */
function VisitorsStore_delete(email) {
  var em = String(email || '').trim().toLowerCase();
  if (!em) return;
  SupabaseRest_delete(
    SUPABASE_TABLE.VISITORS,
    SupabaseRest_filter_('email', 'eq', em),
  );
}

/**
 * @param {Object} row
 * @return {Object}
 */
function VisitorsStore_toApiItem_(row) {
  return {
    email: String(row.email || '').trim().toLowerCase(),
    display_name: String(row.display_name || '').trim(),
    first_seen_at: String(row.first_seen_at || ''),
    last_seen_at: String(row.last_seen_at || ''),
    visit_count: Number(row.visit_count || 0),
  };
}
