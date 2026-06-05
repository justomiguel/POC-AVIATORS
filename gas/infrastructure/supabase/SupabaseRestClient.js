/**
 * @fileoverview Cliente PostgREST para Supabase (UrlFetchApp, service role).
 */

/**
 * @return {{url:string,key:string,schema:string}}
 */
function SupabaseRest_config_() {
  var url = AviatorsConfig_scriptProp_(AVIATORS_PROP.SUPABASE_URL).replace(/\/+$/, '');
  var key = AviatorsConfig_scriptProp_(AVIATORS_PROP.SUPABASE_SERVICE_ROLE_KEY);
  var schema =
    AviatorsConfig_scriptProp_(AVIATORS_PROP.SUPABASE_SCHEMA) || 'public';
  if (!url || !key) {
    throw new Error('ERR_SUPABASE_NOT_CONFIGURED');
  }
  return { url: url, key: key, schema: schema };
}

/**
 * @param {string} table
 * @param {string} [query]
 * @return {string}
 */
function SupabaseRest_tableUrl_(table, query) {
  var cfg = SupabaseRest_config_();
  var base = cfg.url + '/rest/v1/' + encodeURIComponent(table);
  return query ? base + '?' + query : base;
}

/**
 * @param {string} method
 * @param {string} table
 * @param {Object} opts
 * @return {*}
 */
function SupabaseRest_request_(method, table, opts) {
  var o = opts || {};
  var cfg = SupabaseRest_config_();
  var url = SupabaseRest_tableUrl_(table, o.query || '');
  var headers = {
    apikey: cfg.key,
    Authorization: 'Bearer ' + cfg.key,
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'Accept-Profile': cfg.schema,
    'Content-Profile': cfg.schema,
  };
  if (o.prefer) headers.Prefer = o.prefer;

  var fetchOpts = {
    method: method,
    headers: headers,
    muteHttpExceptions: true,
  };
  if (o.body != null) {
    fetchOpts.payload = JSON.stringify(o.body);
  }

  var res = BearerHttp_fetch(url, fetchOpts);
  var code = res.getResponseCode();
  var text = res.getContentText() || '';

  if (!BearerHttp_isSuccess(code)) {
    var snippet = text.length > 400 ? text.slice(0, 400) + '…' : text;
    throw new Error(
      'ERR_SUPABASE_HTTP_' +
        code +
        ': ' +
        method +
        ' ' +
        table +
        ' ' +
        snippet,
    );
  }
  if (code === 204 || !text.trim()) return null;
  try {
    return JSON.parse(text);
  } catch (parseErr) {
    throw new Error('ERR_SUPABASE_JSON: ' + String(parseErr.message || parseErr));
  }
}

/**
 * @param {string} table
 * @param {string} [query]
 * @return {Array<Object>}
 */
function SupabaseRest_select(table, query) {
  var rows = SupabaseRest_request_('get', table, { query: query || 'select=*' });
  return Array.isArray(rows) ? rows : [];
}

/**
 * Cuenta filas que coinciden con el query (PostgREST Prefer: count=exact).
 * @param {string} table
 * @param {string} [query]
 * @return {number}
 */
function SupabaseRest_count(table, query) {
  var cfg = SupabaseRest_config_();
  var q = query || SupabaseRest_query_(['select=content_id', 'limit=0']);
  var url = SupabaseRest_tableUrl_(table, q);
  var headers = {
    apikey: cfg.key,
    Authorization: 'Bearer ' + cfg.key,
    Accept: 'application/json',
    'Accept-Profile': cfg.schema,
    Prefer: 'count=exact',
  };
  var res = BearerHttp_fetch(url, {
    method: 'get',
    headers: headers,
    muteHttpExceptions: true,
  });
  var code = res.getResponseCode();
  if (!BearerHttp_isSuccess(code)) {
    var text = res.getContentText() || '';
    var snippet = text.length > 400 ? text.slice(0, 400) + '…' : text;
    throw new Error('ERR_SUPABASE_HTTP_' + code + ': count ' + table + ' ' + snippet);
  }
  var allHeaders = res.getHeaders() || {};
  var range =
    allHeaders['Content-Range'] ||
    allHeaders['content-range'] ||
    '';
  var m = String(range).match(/\/(\d+)\s*$/);
  if (m) return Number(m[1]) || 0;
  return 0;
}

/**
 * @param {string} table
 * @param {Object|Array<Object>} rowOrRows
 * @param {Object} [opts]
 * @return {Array<Object>|Object|null}
 */
function SupabaseRest_insert(table, rowOrRows, opts) {
  var o = opts || {};
  var prefer = o.prefer || 'return=representation';
  return SupabaseRest_request_('post', table, {
    query: o.query || '',
    body: rowOrRows,
    prefer: prefer,
  });
}

/**
 * @param {string} table
 * @param {Object} patch
 * @param {string} query
 * @return {Array<Object>|null}
 */
function SupabaseRest_update(table, patch, query) {
  return SupabaseRest_request_('patch', table, {
    query: query,
    body: patch,
    prefer: 'return=representation',
  });
}

/**
 * @param {string} table
 * @param {string} query
 * @return {null}
 */
function SupabaseRest_delete(table, query) {
  SupabaseRest_request_('delete', table, { query: query, prefer: 'return=minimal' });
  return null;
}

/**
 * @param {string} table
 * @param {Object|Array<Object>} rowOrRows
 * @param {string} onConflict
 * @return {Array<Object>|Object|null}
 */
function SupabaseRest_upsert(table, rowOrRows, onConflict) {
  var q = 'on_conflict=' + encodeURIComponent(onConflict);
  return SupabaseRest_insert(table, rowOrRows, {
    query: q,
    prefer: 'resolution=merge-duplicates,return=representation',
  });
}

/**
 * @param {string} field
 * @param {string} op
 * @param {string|number|boolean} value
 * @return {string}
 */
function SupabaseRest_filter_(field, op, value) {
  var v = value;
  if (typeof v === 'boolean') v = v ? 'true' : 'false';
  return encodeURIComponent(field) + '=' + op + '.' + encodeURIComponent(String(v));
}

/**
 * @param {Array<string>} parts
 * @return {string}
 */
function SupabaseRest_query_(parts) {
  return parts.filter(function (p) {
    return !!p;
  }).join('&');
}

/**
 * Invoca una función RPC de PostgREST.
 * @param {string} fnName
 * @param {Object} body
 * @return {Array<Object>|Object|null}
 */
function SupabaseRest_rpc(fnName, body) {
  var cfg = SupabaseRest_config_();
  var url = cfg.url + '/rest/v1/rpc/' + encodeURIComponent(fnName);
  var headers = {
    apikey: cfg.key,
    Authorization: 'Bearer ' + cfg.key,
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'Accept-Profile': cfg.schema,
    'Content-Profile': cfg.schema,
  };
  var res = BearerHttp_fetch(url, {
    method: 'post',
    headers: headers,
    contentType: 'application/json',
    payload: JSON.stringify(body || {}),
    muteHttpExceptions: true,
  });
  var code = res.getResponseCode();
  var text = res.getContentText() || '';
  if (!BearerHttp_isSuccess(code)) {
    var snippet = text.length > 400 ? text.slice(0, 400) + '…' : text;
    throw new Error(
      'ERR_SUPABASE_HTTP_' + code + ': rpc ' + fnName + ' ' + snippet,
    );
  }
  if (code === 204 || !text.trim()) return null;
  try {
    return JSON.parse(text);
  } catch (parseErr) {
    throw new Error('ERR_SUPABASE_JSON: ' + String(parseErr.message || parseErr));
  }
}

/**
 * Escapa valor para filtros ilike / eq en PostgREST.
 * @param {string} raw
 * @return {string}
 */
function SupabaseRest_escapeFilterValue_(raw) {
  return String(raw || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
