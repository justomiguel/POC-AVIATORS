/**
 * @fileoverview Persistencia del roster Salesforce (Supabase).
 */

/** Columnas para listados del agente de clientes (sin metadatos de sync). */
var SALESFORCE_LIST_COLUMNS_ =
  'account_key,account_name,account_owner,portfolio,account_status,account_type,' +
  'account_labels,industry,sub_industry,is_active,date_last_opty_created,' +
  'last_opportunity_won,first_opportunity_won,last_worked_opportunity_date';

var SALESFORCE_NAME_INDEX_COLUMNS_ = 'account_key,account_name';

var SALESFORCE_OWNER_CACHE_KEY_ = 'sf_distinct_account_owners_v1';
var SALESFORCE_OWNER_CACHE_TTL_SEC_ = 600;

/**
 * @deprecated Evitar en runtime caliente; usar listMatching_/listAllPages_.
 * @return {Array<Object>}
 */
function SalesforceAccountsStore_listAll() {
  return SupabaseRest_select(
    SUPABASE_TABLE.SALESFORCE_ACCOUNTS,
    'select=' + SALESFORCE_LIST_COLUMNS_ + '&order=account_name.asc',
  );
}

/**
 * @param {{activeOnly?:boolean|null, industry?:string, industries?:Array<string>, subIndustry?:string, accountOwner?:string}} filters
 * @return {number}
 */
function SalesforceAccountsStore_countFiltered_(filters) {
  filters = filters || {};
  var qParts = ['select=account_key'];
  if (filters.activeOnly === true) {
    qParts.push(SupabaseRest_filter_('is_active', 'eq', true));
  } else if (filters.activeOnly === false) {
    qParts.push(SupabaseRest_filter_('is_active', 'eq', false));
  }
  if (filters.industry) {
    qParts.push(SupabaseRest_filter_('industry', 'eq', filters.industry));
  }
  if (filters.subIndustry) {
    qParts.push(SupabaseRest_filter_('sub_industry', 'eq', filters.subIndustry));
  }
  var owner = String(filters.accountOwner || '').trim();
  if (owner) {
    var ownerPat = '*' + SupabaseRest_escapeFilterValue_(owner) + '*';
    qParts.push('account_owner.ilike.' + ownerPat);
  }
  qParts.push('limit=0');
  return SupabaseRest_count(
    SUPABASE_TABLE.SALESFORCE_ACCOUNTS,
    SupabaseRest_query_(qParts),
  );
}

/**
 * @return {boolean}
 */
function SalesforceAccountsStore_hasAny_() {
  try {
    return SalesforceAccountsStore_countFiltered_({}) > 0;
  } catch (ignore) {
    var q = SupabaseRest_query_(['select=account_key', 'limit=1']);
    var rows = SupabaseRest_select(SUPABASE_TABLE.SALESFORCE_ACCOUNTS, q);
    return !!(rows && rows.length);
  }
}

/**
 * Recorre el roster paginado con columnas ligeras.
 * @param {{activeOnly?:boolean|null, industry?:string, industries?:Array<string>, subIndustry?:string, accountOwner?:string}} filters
 * @param {number} pageSize
 * @param {number} maxRows
 * @return {Array<Object>}
 */
function SalesforceAccountsStore_listAllPages_(filters, pageSize, maxRows) {
  filters = filters || {};
  var lim = Math.min(100, Math.max(1, Number(pageSize) || 50));
  var cap = Math.max(lim, Number(maxRows) || 5000);
  /** @type {Array<Object>} */
  var out = [];
  var skip = 0;
  while (out.length < cap) {
    var qParts = ['select=' + SALESFORCE_LIST_COLUMNS_, 'order=account_name.asc'];
    if (filters.activeOnly === true) {
      qParts.push(SupabaseRest_filter_('is_active', 'eq', true));
    } else if (filters.activeOnly === false) {
      qParts.push(SupabaseRest_filter_('is_active', 'eq', false));
    }
    if (filters.industry) {
      qParts.push(SupabaseRest_filter_('industry', 'eq', filters.industry));
    } else if (filters.industries && filters.industries.length) {
      var inParts = [];
      var ii;
      for (ii = 0; ii < filters.industries.length; ii++) {
        var ind = String(filters.industries[ii] || '').trim();
        if (!ind) continue;
        inParts.push('"' + ind.replace(/"/g, '') + '"');
      }
      if (inParts.length) {
        qParts.push(SupabaseRest_filter_('industry', 'in', '(' + inParts.join(',') + ')'));
      }
    }
    if (filters.subIndustry) {
      qParts.push(SupabaseRest_filter_('sub_industry', 'eq', filters.subIndustry));
    }
    var owner = String(filters.accountOwner || '').trim();
    if (owner) {
      var ownerPat = '*' + SupabaseRest_escapeFilterValue_(owner) + '*';
      qParts.push('account_owner.ilike.' + ownerPat);
    }
    qParts.push('offset=' + skip);
    qParts.push('limit=' + lim);
    var page = SupabaseRest_select(
      SUPABASE_TABLE.SALESFORCE_ACCOUNTS,
      SupabaseRest_query_(qParts),
    );
    if (!page || !page.length) break;
    out = out.concat(page);
    if (page.length < lim) break;
    skip += lim;
  }
  if (out.length > cap) out = out.slice(0, cap);
  return out;
}

/**
 * Índice ligero account_key + account_name (match en pregunta).
 * @param {number} maxRows
 * @return {Array<Object>}
 */
function SalesforceAccountsStore_listNameIndexPages_(maxRows) {
  var lim = 100;
  var cap = Math.max(lim, Number(maxRows) || 10000);
  /** @type {Array<Object>} */
  var out = [];
  var skip = 0;
  while (out.length < cap) {
    var q = SupabaseRest_query_([
      'select=' + SALESFORCE_NAME_INDEX_COLUMNS_,
      'order=account_name.asc',
      'offset=' + skip,
      'limit=' + lim,
    ]);
    var page = SupabaseRest_select(SUPABASE_TABLE.SALESFORCE_ACCOUNTS, q);
    if (!page || !page.length) break;
    out = out.concat(page);
    if (page.length < lim) break;
    skip += lim;
  }
  if (out.length > cap) out = out.slice(0, cap);
  return out;
}

/**
 * Owners distintos cacheados 10 min (paginado en miss).
 * @return {Array<string>}
 */
function SalesforceAccountsStore_listDistinctOwnersCached_() {
  var cache = CacheService.getScriptCache();
  var cached = cache.get(SALESFORCE_OWNER_CACHE_KEY_);
  if (cached) {
    try {
      var parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) return parsed;
    } catch (ignoreParse) {}
  }
  /** @type {Object<string, boolean>} */
  var seen = {};
  var skip = 0;
  var lim = 500;
  while (true) {
    var q = SupabaseRest_query_([
      'select=account_owner',
      'order=account_owner.asc',
      'offset=' + skip,
      'limit=' + lim,
    ]);
    var rows = SupabaseRest_select(SUPABASE_TABLE.SALESFORCE_ACCOUNTS, q);
    if (!rows || !rows.length) break;
    var i;
    for (i = 0; i < rows.length; i++) {
      var owner = String(rows[i].account_owner || '').trim();
      if (owner) seen[owner] = true;
    }
    if (rows.length < lim) break;
    skip += lim;
  }
  var owners = Object.keys(seen).sort(function (a, b) {
    return a.localeCompare(b);
  });
  try {
    cache.put(SALESFORCE_OWNER_CACHE_KEY_, JSON.stringify(owners), SALESFORCE_OWNER_CACHE_TTL_SEC_);
  } catch (ignorePut) {}
  return owners;
}

/**
 * Invalida cache de owners (p. ej. tras sync Salesforce).
 */
function SalesforceAccountsStore_invalidateOwnersCache_() {
  try {
    CacheService.getScriptCache().remove(SALESFORCE_OWNER_CACHE_KEY_);
  } catch (ignore) {}
}

/**
 * Búsqueda por fragmento de nombre (PostgREST ilike).
 * @param {string} nameQuery
 * @param {number} limit
 * @return {Array<Object>}
 */
function SalesforceAccountsStore_searchByName_(nameQuery, limit) {
  var q = String(nameQuery || '').trim();
  if (!q) return [];
  var lim = Math.min(50, Math.max(1, Number(limit) || 20));
  var pattern = '*' + SupabaseRest_escapeFilterValue_(q) + '*';
  var query = SupabaseRest_query_([
    'select=' + SALESFORCE_LIST_COLUMNS_,
    'account_name.ilike.' + pattern,
    'order=account_name.asc',
    'limit=' + lim,
  ]);
  return SupabaseRest_select(SUPABASE_TABLE.SALESFORCE_ACCOUNTS, query);
}

/**
 * @param {number} skip
 * @param {number} limit
 * @return {Array<Object>}
 */
function SalesforceAccountsStore_listPage(skip, limit) {
  var s = Math.max(0, Number(skip) || 0);
  var lim = Math.min(100, Math.max(1, Number(limit) || 25));
  var q = SupabaseRest_query_([
    'select=' + SALESFORCE_LIST_COLUMNS_,
    'order=account_name.asc',
    'offset=' + s,
    'limit=' + lim,
  ]);
  return SupabaseRest_select(SUPABASE_TABLE.SALESFORCE_ACCOUNTS, q);
}

/**
 * Lista cuentas con filtros en PostgREST (evita cargar todo el roster en memoria).
 * @param {{activeOnly?:boolean|null, industry?:string, industries?:Array<string>, subIndustry?:string, accountOwner?:string}} filters
 * @return {Array<Object>}
 */
function SalesforceAccountsStore_listMatching_(filters) {
  filters = filters || {};
  var qParts = ['select=' + SALESFORCE_LIST_COLUMNS_, 'order=account_name.asc'];
  if (filters.activeOnly === true) {
    qParts.push(SupabaseRest_filter_('is_active', 'eq', true));
  } else if (filters.activeOnly === false) {
    qParts.push(SupabaseRest_filter_('is_active', 'eq', false));
  }
  if (filters.industry) {
    qParts.push(SupabaseRest_filter_('industry', 'eq', filters.industry));
  } else if (filters.industries && filters.industries.length) {
    var inParts = [];
    var ii;
    for (ii = 0; ii < filters.industries.length; ii++) {
      var ind = String(filters.industries[ii] || '').trim();
      if (!ind) continue;
      inParts.push('"' + ind.replace(/"/g, '') + '"');
    }
    if (inParts.length) {
      qParts.push(SupabaseRest_filter_('industry', 'in', '(' + inParts.join(',') + ')'));
    }
  }
  if (filters.subIndustry) {
    qParts.push(SupabaseRest_filter_('sub_industry', 'eq', filters.subIndustry));
  }
  var owner = String(filters.accountOwner || '').trim();
  if (owner) {
    var ownerPat = '*' + SupabaseRest_escapeFilterValue_(owner) + '*';
    qParts.push('account_owner.ilike.' + ownerPat);
  }
  return SupabaseRest_select(
    SUPABASE_TABLE.SALESFORCE_ACCOUNTS,
    SupabaseRest_query_(qParts),
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
