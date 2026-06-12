/**
 * @fileoverview Último acceso y conteo de sesiones (todos los usuarios autenticados).
 */

/**
 * @param {number} [limit]
 * @return {Array<Object>}
 */
function UserPresenceStore_listRecent(limit) {
  var lim = Math.min(1000, Math.max(1, Number(limit) || 500));
  return SupabaseRest_select(
    SUPABASE_TABLE.USER_PRESENCE,
    SupabaseRest_query_([
      'select=email,display_name,first_seen_at,last_seen_at,session_count',
      'order=last_seen_at.desc',
      'limit=' + lim,
    ]),
  );
}

/**
 * @return {Array<Object>}
 */
function UserPresenceStore_listAll() {
  return UserPresenceStore_listRecent(1000);
}

/**
 * @param {string} email
 * @return {Object|null}
 */
function UserPresenceStore_get(email) {
  var em = String(email || '').trim().toLowerCase();
  if (!em) return null;
  var q = SupabaseRest_query_([
    'select=email,display_name,first_seen_at,last_seen_at,session_count',
    SupabaseRest_filter_('email', 'eq', em),
    'limit=1',
  ]);
  var rows = SupabaseRest_select(SUPABASE_TABLE.USER_PRESENCE, q);
  return rows.length ? rows[0] : null;
}

/**
 * @return {Object<string, Object>}
 */
function UserPresenceStore_lookupMap_() {
  var rows = UserPresenceStore_listRecent(500);
  var map = {};
  var i;
  for (i = 0; i < rows.length; i++) {
    var em = String(rows[i].email || '').trim().toLowerCase();
    if (em) map[em] = rows[i];
  }
  return map;
}

/**
 * Registra o actualiza presencia al iniciar sesión.
 * @param {string} email
 * @param {string} [displayName]
 */
function UserPresenceStore_touchSession(email, displayName) {
  var em = String(email || '').trim().toLowerCase();
  if (!em) return;
  var now = new Date().toISOString();
  var name = String(displayName || '').trim();
  var existing = UserPresenceStore_get(em);
  if (existing) {
    SupabaseRest_update(
      SUPABASE_TABLE.USER_PRESENCE,
      {
        display_name: name || String(existing.display_name || ''),
        last_seen_at: now,
        session_count: Number(existing.session_count || 0) + 1,
      },
      SupabaseRest_filter_('email', 'eq', em),
    );
    return;
  }
  SupabaseRest_insert(
    SUPABASE_TABLE.USER_PRESENCE,
    {
      email: em,
      display_name: name,
      first_seen_at: now,
      last_seen_at: now,
      session_count: 1,
    },
    { prefer: 'return=minimal' },
  );
}
