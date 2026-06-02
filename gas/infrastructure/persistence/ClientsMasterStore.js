/**
 * @fileoverview Persistencia del maestro de clientes en Supabase.
 */

/**
 * @return {Array<Object>}
 */
function ClientsMasterStore_listAll() {
  return SupabaseRest_select(
    SUPABASE_TABLE.CLIENTS,
    'select=*&order=client_name.asc',
  );
}

/**
 * @param {string} clientId
 * @return {Object|null}
 */
function ClientsMasterStore_getById(clientId) {
  var id = String(clientId || '').trim();
  if (!id) return null;
  var q = SupabaseRest_query_([
    'select=*',
    SupabaseRest_filter_('client_id', 'eq', id),
    'limit=1',
  ]);
  var rows = SupabaseRest_select(SUPABASE_TABLE.CLIENTS, q);
  return rows.length ? rows[0] : null;
}

/**
 * @param {string} normalizedName
 * @return {Object|null}
 */
function ClientsMasterStore_getByNormalizedName(normalizedName) {
  var norm = String(normalizedName || '').trim();
  if (!norm) return null;
  var q = SupabaseRest_query_([
    'select=*',
    SupabaseRest_filter_('normalized_name', 'eq', norm),
    'limit=1',
  ]);
  var rows = SupabaseRest_select(SUPABASE_TABLE.CLIENTS, q);
  return rows.length ? rows[0] : null;
}

/**
 * @param {Object} row
 * @return {Object}
 */
function ClientsMasterStore_upsert(row) {
  var payload = {
    client_id: String(row.client_id || '').trim() || Utilities.getUuid(),
    client_name: String(row.client_name || '').trim(),
    normalized_name: String(row.normalized_name || '').trim(),
    industry: String(row.industry || '').trim(),
    sub_industry: String(row.sub_industry || '').trim(),
    country: String(row.country || '').trim(),
    main_contact_name: String(row.main_contact_name || '').trim(),
    main_contact_email: String(row.main_contact_email || '').trim(),
    logo_url: String(row.logo_url || '').trim(),
    notes: String(row.notes || '').trim(),
    created_at: row.created_at || new Date().toISOString(),
    created_by: String(row.created_by || '').trim(),
    updated_at: row.updated_at || new Date().toISOString(),
  };
  var saved = SupabaseRest_upsert(SUPABASE_TABLE.CLIENTS, payload, 'client_id');
  if (Array.isArray(saved) && saved.length) return saved[0];
  return payload;
}

/**
 * @param {string} clientId
 * @return {boolean}
 */
function ClientsMasterStore_delete(clientId) {
  var id = String(clientId || '').trim();
  if (!id) return false;
  SupabaseRest_delete(
    SUPABASE_TABLE.CLIENTS,
    SupabaseRest_filter_('client_id', 'eq', id),
  );
  return true;
}

/**
 * @return {number}
 */
function ClientsMasterStore_clearAll() {
  var rows = ClientsMasterStore_listAll();
  if (!rows.length) return 0;
  SupabaseRest_delete(SUPABASE_TABLE.CLIENTS, 'client_id=not.is.null');
  return rows.length;
}

/**
 * @param {Object} row
 * @return {Object}
 */
function ClientsMasterStore_toApiItem_(row) {
  return {
    client_id: String(row.client_id || ''),
    client_name: String(row.client_name || ''),
    normalized_name: String(row.normalized_name || ''),
    industry: String(row.industry || ''),
    sub_industry: String(row.sub_industry || ''),
    country: String(row.country || ''),
    main_contact_name: String(row.main_contact_name || ''),
    main_contact_email: String(row.main_contact_email || ''),
    logo_url: String(row.logo_url || ''),
    notes: String(row.notes || ''),
    created_at: String(row.created_at || ''),
    created_by: String(row.created_by || ''),
    updated_at: String(row.updated_at || ''),
  };
}
