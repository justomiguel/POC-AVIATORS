/**
 * @fileoverview Persistencia de roles en Supabase.
 */

/**
 * @param {string} email
 * @return {{label:string,key:string}|null}
 */
function RoleDirectoryStore_lookup(email) {
  var em = String(email || '').trim().toLowerCase();
  if (!em) return null;
  var q = SupabaseRest_query_([
    'select=role_label,role_key',
    SupabaseRest_filter_('email', 'eq', em),
    'limit=1',
  ]);
  var rows = SupabaseRest_select(SUPABASE_TABLE.ROLES, q);
  if (!rows.length) return null;
  var row = rows[0];
  var label = String(row.role_label || '').trim() || 'Miembro';
  var key = String(row.role_key || '').trim();
  if (!key) {
    key = label
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_áéíóúñ]/gi, '');
  }
  if (!key) key = 'miembro';
  return { label: label, key: key };
}

/**
 * @return {Array<Object>}
 */
function RoleDirectoryStore_listAll() {
  return SupabaseRest_select(
    SUPABASE_TABLE.ROLES,
    'select=email,role_label,role_key&order=email.asc',
  );
}

/**
 * @param {Array<{email:string,role_label:string,role_key:string}>} rows
 */
function RoleDirectoryStore_replaceAll(rows) {
  SupabaseRest_delete(SUPABASE_TABLE.ROLES, 'email=not.is.null');
  if (!rows || !rows.length) return;
  SupabaseRest_insert(SUPABASE_TABLE.ROLES, rows, { prefer: 'return=minimal' });
}

/**
 * @param {Object} row
 */
function RoleDirectoryStore_upsert(row) {
  SupabaseRest_upsert(SUPABASE_TABLE.ROLES, row, 'email');
}

/**
 * @param {string} email
 */
function RoleDirectoryStore_delete(email) {
  var em = String(email || '').trim().toLowerCase();
  if (!em) return;
  SupabaseRest_delete(
    SUPABASE_TABLE.ROLES,
    SupabaseRest_filter_('email', 'eq', em),
  );
}

/**
 * @param {Object} row
 * @return {Object}
 */
function RoleDirectoryStore_toApiItem_(row) {
  return {
    email: String(row.email || '').trim().toLowerCase(),
    role_label: String(row.role_label || '').trim() || 'Miembro',
    role_key: String(row.role_key || '').trim() || 'miembro',
    updated_at: String(row.updated_at || ''),
  };
}
