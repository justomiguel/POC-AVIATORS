/**
 * @fileoverview Solicitudes de acceso de visitantes en Supabase.
 */

var ACCESS_REQUEST_STATUS = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  DISMISSED: 'dismissed',
});

/**
 * @return {Array<Object>}
 */
function AccessRequestsStore_listAll() {
  return SupabaseRest_select(
    SUPABASE_TABLE.ACCESS_REQUESTS,
    'select=id,email,display_name,desired_role_key,desired_role_label,reason,status,created_at,updated_at,reviewed_by_email,reviewed_at&order=created_at.desc',
  );
}

/**
 * @param {string} email
 * @return {Object|null}
 */
function AccessRequestsStore_getPendingByEmail(email) {
  var em = String(email || '').trim().toLowerCase();
  if (!em) return null;
  var q = SupabaseRest_query_([
    'select=id,email,display_name,desired_role_key,desired_role_label,reason,status,created_at,updated_at,reviewed_by_email,reviewed_at',
    SupabaseRest_filter_('email', 'eq', em),
    SupabaseRest_filter_('status', 'eq', ACCESS_REQUEST_STATUS.PENDING),
    'limit=1',
  ]);
  var rows = SupabaseRest_select(SUPABASE_TABLE.ACCESS_REQUESTS, q);
  return rows.length ? rows[0] : null;
}

/**
 * @param {Object} row
 * @return {Object}
 */
function AccessRequestsStore_insert(row) {
  var now = new Date().toISOString();
  var payload = {
    email: String(row.email || '').trim().toLowerCase(),
    display_name: String(row.display_name || '').trim(),
    desired_role_key: String(row.desired_role_key || '').trim().toLowerCase(),
    desired_role_label: String(row.desired_role_label || '').trim(),
    reason: String(row.reason || '').trim(),
    status: ACCESS_REQUEST_STATUS.PENDING,
    created_at: now,
    updated_at: now,
  };
  var inserted = SupabaseRest_insert(SUPABASE_TABLE.ACCESS_REQUESTS, payload, {
    prefer: 'return=representation',
  });
  if (Array.isArray(inserted) && inserted.length) return inserted[0];
  if (inserted && inserted.id) return inserted;
  return payload;
}

/**
 * @param {string} id
 * @param {string} status
 * @param {string} [reviewerEmail]
 */
function AccessRequestsStore_updateStatus(id, status, reviewerEmail) {
  var rid = String(id || '').trim();
  if (!rid) return;
  var st = String(status || '').trim().toLowerCase();
  if (
    st !== ACCESS_REQUEST_STATUS.PENDING &&
    st !== ACCESS_REQUEST_STATUS.APPROVED &&
    st !== ACCESS_REQUEST_STATUS.DISMISSED
  ) {
    return;
  }
  var now = new Date().toISOString();
  var patch = {
    status: st,
    updated_at: now,
  };
  if (st !== ACCESS_REQUEST_STATUS.PENDING) {
    patch.reviewed_at = now;
    patch.reviewed_by_email = String(reviewerEmail || '').trim().toLowerCase();
  }
  SupabaseRest_update(
    SUPABASE_TABLE.ACCESS_REQUESTS,
    patch,
    SupabaseRest_filter_('id', 'eq', rid),
  );
}

/**
 * @param {string} email
 * @param {string} status
 * @param {string} [reviewerEmail]
 */
function AccessRequestsStore_updatePendingForEmail(email, status, reviewerEmail) {
  var pending = AccessRequestsStore_getPendingByEmail(email);
  if (!pending || !pending.id) return;
  AccessRequestsStore_updateStatus(pending.id, status, reviewerEmail);
}

/**
 * @param {Object} row
 * @return {Object}
 */
function AccessRequestsStore_toApiItem_(row) {
  return {
    id: String(row.id || ''),
    email: String(row.email || '').trim().toLowerCase(),
    display_name: String(row.display_name || '').trim(),
    desired_role_key: String(row.desired_role_key || '').trim().toLowerCase(),
    desired_role_label: String(row.desired_role_label || '').trim(),
    reason: String(row.reason || '').trim(),
    status: String(row.status || ACCESS_REQUEST_STATUS.PENDING)
      .trim()
      .toLowerCase(),
    created_at: String(row.created_at || ''),
    updated_at: String(row.updated_at || ''),
    reviewed_by_email: String(row.reviewed_by_email || '').trim(),
    reviewed_at: row.reviewed_at ? String(row.reviewed_at) : '',
  };
}
