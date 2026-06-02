/**
 * @fileoverview Persistencia del roster Salesforce (Supabase).
 */

/**
 * @return {Array<Object>}
 */
function SalesforceAccountsStore_listAll() {
  return SupabaseRest_select(
    SUPABASE_TABLE.SALESFORCE_ACCOUNTS,
    'select=*&order=account_name.asc',
  );
}

/**
 * @param {string} accountKey
 * @return {Object|null}
 */
function SalesforceAccountsStore_getByKey(accountKey) {
  var key = String(accountKey || '').trim();
  if (!key) return null;
  var q = SupabaseRest_query_([
    'select=*',
    SupabaseRest_filter_('account_key', 'eq', key),
    'limit=1',
  ]);
  var rows = SupabaseRest_select(SUPABASE_TABLE.SALESFORCE_ACCOUNTS, q);
  return rows.length ? rows[0] : null;
}

/**
 * @param {Object} row
 * @return {Object}
 */
function SalesforceAccountsStore_upsert(row) {
  var payload = {
    account_key: String(row.account_key || '').trim(),
    account_name: String(row.account_name || '').trim(),
    account_owner: String(row.account_owner || '').trim(),
    account_owner_email: String(row.account_owner_email || '').trim(),
    portfolio: String(row.portfolio || '').trim(),
    account_status: String(row.account_status || '').trim(),
    account_type: String(row.account_type || '').trim(),
    account_labels: String(row.account_labels || '').trim(),
    date_last_opty_created: row.date_last_opty_created || null,
    last_opportunity_won: row.last_opportunity_won || null,
    first_opportunity_won: row.first_opportunity_won || null,
    last_worked_opportunity_date: row.last_worked_opportunity_date || null,
    industry: String(row.industry || '').trim(),
    sub_industry: String(row.sub_industry || '').trim(),
    client_id: row.client_id ? String(row.client_id).trim() : null,
    content_id: row.content_id ? String(row.content_id).trim() : null,
    row_hash: String(row.row_hash || '').trim(),
    is_active: row.is_active !== false,
    synced_at: row.synced_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString(),
  };
  if (!payload.account_key || !payload.account_name) {
    throw new Error('account_key y account_name requeridos');
  }
  var saved = SupabaseRest_upsert(
    SUPABASE_TABLE.SALESFORCE_ACCOUNTS,
    payload,
    'account_key',
  );
  if (Array.isArray(saved) && saved.length) return saved[0];
  return payload;
}

/**
 * Marca inactivas las cuentas cuya clave no está en el roster actual del sheet.
 * @param {Array<string>} activeKeys
 * @return {number}
 */
function SalesforceAccountsStore_markInactiveExcept_(activeKeys) {
  var keep = {};
  var i;
  for (i = 0; i < (activeKeys || []).length; i++) {
    var k = String(activeKeys[i] || '').trim();
    if (k) keep[k] = true;
  }
  var rows = SalesforceAccountsStore_listAll();
  var now = new Date().toISOString();
  var count = 0;
  for (i = 0; i < rows.length; i++) {
    var row = rows[i];
    var key = String(row.account_key || '').trim();
    if (!key || keep[key]) continue;
    if (row.is_active === false) continue;
    SalesforceAccountsStore_upsert({
      account_key: key,
      account_name: String(row.account_name || ''),
      account_owner: String(row.account_owner || ''),
      account_owner_email: String(row.account_owner_email || ''),
      portfolio: String(row.portfolio || ''),
      account_status: String(row.account_status || ''),
      account_type: String(row.account_type || ''),
      account_labels: String(row.account_labels || ''),
      date_last_opty_created: row.date_last_opty_created || null,
      last_opportunity_won: row.last_opportunity_won || null,
      first_opportunity_won: row.first_opportunity_won || null,
      last_worked_opportunity_date: row.last_worked_opportunity_date || null,
      industry: String(row.industry || ''),
      sub_industry: String(row.sub_industry || ''),
      client_id: row.client_id || null,
      content_id: row.content_id || null,
      row_hash: String(row.row_hash || ''),
      is_active: false,
      synced_at: now,
      updated_at: now,
    });
    count++;
  }
  return count;
}
