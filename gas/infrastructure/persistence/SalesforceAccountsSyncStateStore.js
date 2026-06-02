/**
 * @fileoverview Estado de sync del roster Salesforce (app_settings).
 */

/**
 * @return {Object}
 */
function SalesforceAccountsSyncStateStore_load_() {
  var q = SupabaseRest_query_([
    'select=value',
    SupabaseRest_filter_('key', 'eq', SUPABASE_SETTINGS_KEY.SALESFORCE_ACCOUNTS_SYNC),
    'limit=1',
  ]);
  var rows = SupabaseRest_select(SUPABASE_TABLE.APP_SETTINGS, q);
  if (!rows.length) {
    return {
      last_event_row: 0,
      last_sheet_hash: '',
      last_sync_at: '',
      last_sync_status: '',
      last_sync_message: '',
      accounts_upserted: 0,
      accounts_inactivated: 0,
      roles_assigned: 0,
    };
  }
  var val = rows[0].value;
  if (!val || typeof val !== 'object' || Array.isArray(val)) {
    return {
      last_event_row: 0,
      last_sheet_hash: '',
      last_sync_at: '',
      last_sync_status: '',
      last_sync_message: '',
      accounts_upserted: 0,
      accounts_inactivated: 0,
      roles_assigned: 0,
    };
  }
  return {
    last_event_row: Number(val.last_event_row || 0),
    last_sheet_hash: String(val.last_sheet_hash || ''),
    last_sync_at: String(val.last_sync_at || ''),
    last_sync_status: String(val.last_sync_status || ''),
    last_sync_message: String(val.last_sync_message || ''),
    accounts_upserted: Number(val.accounts_upserted || 0),
    accounts_inactivated: Number(val.accounts_inactivated || 0),
    roles_assigned: Number(val.roles_assigned || 0),
  };
}

/**
 * @param {Object} state
 */
function SalesforceAccountsSyncStateStore_save_(state) {
  SupabaseRest_upsert(
    SUPABASE_TABLE.APP_SETTINGS,
    {
      key: SUPABASE_SETTINGS_KEY.SALESFORCE_ACCOUNTS_SYNC,
      value: state || {},
      updated_at: new Date().toISOString(),
    },
    'key',
  );
}
