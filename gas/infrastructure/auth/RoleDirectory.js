/**
 * @fileoverview Roles exclusivamente desde Supabase (tabla `roles`).
 * Sin planillas ni Script Properties de etiquetas admin: permisos vía `role_key`.
 *
 * Claves canónicas: admin | presales | manager | tech | client_partner | miembro
 */

var ROLE_DIR_CACHE_SEC = 300;

/**
 * @param {string} msg
 */
function RoleDirectory_trace_(msg) {
  Logger.log(msg);
  try {
    console.log(msg);
    console.info(msg);
    console.warn(msg);
  } catch (ignore) {}
}

/**
 * @param {unknown} err
 */
function RoleDirectory_traceError_(err) {
  var m = err && err.message ? String(err.message) : String(err);
  var st = err && err.stack ? String(err.stack) : '';
  RoleDirectory_trace_('[RoleDirectory] EXCEPTION message=' + m);
  try {
    console.error('[RoleDirectory] EXCEPTION message=' + m);
  } catch (ignore) {}
  if (st) {
    var stMsg = '[RoleDirectory] EXCEPTION stack (trim)=' + st.slice(0, 2500);
    RoleDirectory_trace_(stMsg);
    try {
      console.error(stMsg);
    } catch (ignore2) {}
  }
}

/**
 * @param {{ label?: string, key?: string }|null} rec
 * @return {string}
 */
function RoleDirectory_roleKeyFromRec_(rec) {
  if (!rec) return '';
  var key = String(rec.key || '').trim().toLowerCase();
  if (key) return key;
  var label = String(rec.label || '').trim();
  if (!label) return '';
  key = label
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_áéíóúñ]/gi, '');
  return key || 'miembro';
}

/**
 * @param {string} email
 */
function RoleDirectory_invalidateCache_(email) {
  var em = ('' + (email || '')).trim().toLowerCase();
  if (!em) return;
  try {
    CacheService.getScriptCache().remove('rd_v3_' + em);
  } catch (ignore) {}
}

/**
 * @param {string} email
 * @return {string}
 */
function RoleDirectory_roleKeyForEmail_(email) {
  try {
    return RoleDirectory_roleKeyFromRec_(RoleDirectory_lookupRole(email));
  } catch (ignore) {
    return '';
  }
}

/**
 * @param {string} email
 * @return {{ label: string, key: string }|null} null → visitante
 */
function RoleDirectory_lookupRole(email) {
  var em = ('' + (email || '')).trim().toLowerCase();
  if (!em) {
    RoleDirectory_trace_('[RoleDirectory_lookupRole] Empty email → no role.');
    return null;
  }

  try {
    var au = Session.getActiveUser().getEmail();
    var eu = Session.getEffectiveUser().getEmail();
    RoleDirectory_trace_(
      '[RoleDirectory_lookupRole] Session activeUser=' +
        au +
        ' effectiveUser=' +
        eu +
        ' lookupEmailParam=' +
        em,
    );
  } catch (sessEx) {
    RoleDirectory_trace_(
      '[RoleDirectory_lookupRole] Session.get*User email failed: ' +
        (sessEx && sessEx.message ? sessEx.message : String(sessEx)),
    );
  }

  var cache = CacheService.getScriptCache();
  var ck = 'rd_v3_' + em;
  var hit = cache.get(ck);
  if (hit !== null) {
    if (hit === '__none__') {
      RoleDirectory_trace_(
        '[RoleDirectory_lookupRole] Cache hit → no mapping for this session email.',
      );
      return null;
    }
    try {
      RoleDirectory_trace_('[RoleDirectory_lookupRole] Cache hit → role JSON from cache.');
      return JSON.parse(hit);
    } catch (e) {
      RoleDirectory_trace_(
        '[RoleDirectory_lookupRole] Cache hit but JSON parse failed, reloading Supabase.',
      );
    }
  } else {
    RoleDirectory_trace_('[RoleDirectory_lookupRole] Cache miss → Supabase roles table.');
  }

  AviatorsDataBackend_requireSupabase_();
  try {
    var storeRec = RoleDirectoryStore_lookup(em);
    if (!storeRec) {
      RoleDirectory_trace_(
        '[RoleDirectory_lookupRole] Supabase roles table miss → visitor.',
      );
      cache.put(ck, '__none__', ROLE_DIR_CACHE_SEC);
      return null;
    }
    var normalized = {
      label: String(storeRec.label || '').trim() || 'Miembro',
      key: RoleDirectory_roleKeyFromRec_(storeRec),
    };
    cache.put(ck, JSON.stringify(normalized), ROLE_DIR_CACHE_SEC);
    return normalized;
  } catch (eSupaLookup) {
    RoleDirectory_traceError_(eSupaLookup);
    throw eSupaLookup;
  }
}

/**
 * @param {{ label?: string, key?: string }|null} rec
 * @return {boolean}
 */
function RoleDirectory_roleRecordIsPresale_(rec) {
  var k = RoleDirectory_roleKeyFromRec_(rec);
  return k === 'presales' || k === 'presale' || k === 'preventa';
}

/**
 * @param {string} email
 * @return {boolean}
 */
function RoleDirectory_emailIsPresale(email) {
  var em = ('' + (email || '')).trim();
  if (!em) return false;
  return RoleDirectory_roleRecordIsPresale_(RoleDirectory_lookupRole(em));
}

/**
 * @return {Object}
 */
function RoleDirectory_diagnostic() {
  var email = ('' + Session.getActiveUser().getEmail()).trim().toLowerCase();
  RoleDirectory_trace_(
    '[RoleDirectory_diagnostic] Active user email (normalized)=' + email,
  );

  /** @type {Object} */
  var out = {
    emailUsed: email,
    backend: 'supabase',
    supabaseConfigured: AviatorsDataBackend_supabaseConfigured_(),
    step: 'init',
    roleFound: false,
    role: null,
    roleKey: '',
    rolesRowCount: 0,
    thrownCode: null,
    errorMessage: null,
  };

  if (!AviatorsDataBackend_supabaseConfigured_()) {
    out.step = 'supabase_not_configured';
    out.thrownCode = 'ERR_SUPABASE_NOT_CONFIGURED';
    out.errorMessage =
      'Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en Propiedades del script.';
    return out;
  }

  out.step = 'supabase_lookup';
  try {
    var rec = RoleDirectoryStore_lookup(email);
    out.roleFound = !!rec;
    if (rec) {
      out.role = {
        label: String(rec.label || '').trim(),
        key: RoleDirectory_roleKeyFromRec_(rec),
      };
      out.roleKey = out.role.key;
    }
    out.emailRowMatch = !!rec;
    out.step = rec ? 'ok' : 'no_email_row';
    try {
      var all = RoleDirectoryStore_listAll();
      out.rolesRowCount = all.length;
    } catch (ignoreCount) {}
  } catch (eSupa) {
    out.step = 'supabase_error';
    out.thrownCode = 'ERR_ROLE_SUPABASE';
    out.errorMessage = eSupa && eSupa.message ? eSupa.message : String(eSupa);
    RoleDirectory_traceError_(eSupa);
  }
  RoleDirectory_trace_(
    '[RoleDirectory_diagnostic] Result step=' +
      out.step +
      ' roleFound=' +
      out.roleFound +
      ' roleKey=' +
      out.roleKey,
  );
  return out;
}
