/**
 * @fileoverview Catálogo de contenidos (Supabase / ContentCatalogStore).
 */

/** @deprecated Propiedades legacy de planilla; solo migración AdminSupabaseMigration. */
var CATALOG_PROP_SSID = 'CATALOG_SPREADSHEET_ID';
var CATALOG_PROP_TAB_COMMON = 'CATALOG_TAB_COMMON';
var CATALOG_PROP_TAB_PROPOSALS = 'CATALOG_TAB_PROPOSALS';
var CATALOG_PROP_TAB_SUCCESS_CASES = 'CATALOG_TAB_SUCCESS_CASES';
var CATALOG_PROP_TAB_CLIENTS = 'CATALOG_TAB_CLIENTS';
var CATALOG_PROP_TAB_ONBOARDING = 'CATALOG_TAB_ONBOARDING';
var CATALOG_PROP_TAGS_JSON = 'CATALOG_CONTROLLED_TAGS_JSON';

var CATALOG_TAB_COMMON_DEFAULT = 'common';
var CATALOG_TAB_PROPOSALS_DEFAULT = 'proposals';
var CATALOG_TAB_SUCCESS_CASES_DEFAULT = 'success_cases';
var CATALOG_TAB_CLIENTS_DEFAULT = 'clients';
var CATALOG_TAB_ONBOARDING_DEFAULT = 'onboarding';
/** @return {string[]} */
function ContentCatalog_headersCommon_() {
  return [
    'content_id',
    'content_type',
    'title',
    'summary',
    'client_name',
    'tags_csv',
    'file_name',
    'mime_type',
    'drive_file_id',
    'drive_file_url',
    'globant_profile_name',
    'globant_document_id',
    'uploaded_by',
    'created_at',
    'updated_at',
  ];
}

/** @return {string[]} */
function ContentCatalog_headersByType_(contentType) {
  if (contentType === 'proposal') {
    return [
      'content_id',
      'stage',
      'pricing_model',
      'effort_estimate',
      'timeline',
      'win_probability',
      'notes',
    ];
  }
  if (contentType === 'success_case') {
    return [
      'content_id',
      'challenge',
      'solution',
      'impact_metric',
      'impact_value',
      'evidence',
      'notes',
    ];
  }
  if (contentType === 'onboarding') {
    return [
      'content_id',
      'topic',
      'category',
      'audience',
      'notes',
    ];
  }
  return [
    'content_id',
    'account_status',
    'active_projects',
    'health_score',
    'renewal_date',
    'notes',
  ];
}

/**
 * Requiere presale o admin (para escritura).
 * @return {{email:string, roleKey:string, roleLabel:string}}
 */
function ContentCatalog_requireContributor_() {
  var email = ('' + Session.getActiveUser().getEmail()).trim();
  if (!email) {
    throw new Error(
      UiStrings_t(UiStrings_activeLocale_(), 'session_email_no_capture'),
    );
  }
  if (AdminAuth_emailCanWriteCatalog(email)) {
    var recWrite = RoleDirectory_lookupRole(email);
    var labelW = recWrite && recWrite.label ? String(recWrite.label) : '';
    var keyW = AdminAuth_roleKeyForEmail_(email) || 'admin';
    return {
      email: email,
      roleKey: keyW,
      roleLabel: labelW || (keyW === 'admin' ? 'Admin' : keyW),
    };
  }
  throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_admin_only'));
}

/**
 * Requiere cualquier rol activo del directorio (lectura). Solo verifica sesión y presencia en el directorio.
 */
function ContentCatalog_requireAnyRole_() {
  var email = ('' + Session.getActiveUser().getEmail()).trim();
  if (!email) {
    throw new Error(
      UiStrings_t(UiStrings_activeLocale_(), 'session_email_no_capture'),
    );
  }
  if (AdminAuth_emailCanViewCatalog(email)) return;
  throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_admin_only'));
}

/**
 * @param {GoogleAppsScript.Properties.Properties} props
 * @return {{common:string, proposals:string, successCases:string, clients:string, onboarding:string}}
 */
function ContentCatalog_resolveTabNames_(props) {
  return {
    common:
      (props.getProperty(CATALOG_PROP_TAB_COMMON) || '').trim() ||
      CATALOG_TAB_COMMON_DEFAULT,
    proposals:
      (props.getProperty(CATALOG_PROP_TAB_PROPOSALS) || '').trim() ||
      CATALOG_TAB_PROPOSALS_DEFAULT,
    successCases:
      (props.getProperty(CATALOG_PROP_TAB_SUCCESS_CASES) || '').trim() ||
      CATALOG_TAB_SUCCESS_CASES_DEFAULT,
    clients:
      (props.getProperty(CATALOG_PROP_TAB_CLIENTS) || '').trim() ||
      CATALOG_TAB_CLIENTS_DEFAULT,
    onboarding:
      (props.getProperty(CATALOG_PROP_TAB_ONBOARDING) || '').trim() ||
      CATALOG_TAB_ONBOARDING_DEFAULT,
  };
}

/**
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {string[]} headers
 */
function ContentCatalog_ensureSheetHeaders_(sheet, headers) {
  var maxCols = Math.max(headers.length, sheet.getMaxColumns());
  if (sheet.getMaxColumns() < headers.length) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), headers.length - sheet.getMaxColumns());
  }
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    return;
  }
  var existing = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  var same = true;
  var i;
  for (i = 0; i < headers.length; i++) {
    if (String(existing[i] || '') !== headers[i]) {
      same = false;
      break;
    }
  }
  if (!same) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  if (maxCols > headers.length) {
    // evita basura visual si la hoja fue usada para otra cosa.
    sheet.hideColumns(headers.length + 1, maxCols - headers.length);
  }
}

/**
 * @param {string} contentType
 * @return {boolean}
 */
function ContentCatalog_isValidType_(contentType) {
  return (
    contentType === 'proposal' ||
    contentType === 'success_case' ||
    contentType === 'client' ||
    contentType === 'onboarding'
  );
}

/**
 * @param {string} csv
 * @return {Array<string>}
 */
function ContentCatalog_csvToTags_(csv) {
  var raw = String(csv || '');
  if (!raw.trim()) return [];
  var parts = raw.split(',');
  var out = [];
  var seen = {};
  var i;
  for (i = 0; i < parts.length; i++) {
    var t = parts[i].trim();
    if (!t) continue;
    if (t.charAt(0) !== '#') t = '#' + t;
    var k = t.toLowerCase();
    if (seen[k]) continue;
    seen[k] = true;
    out.push(t);
  }
  return out;
}

/**
 * @param {Array<string>} tags
 * @return {string}
 */
function ContentCatalog_tagsToCsv_(tags) {
  if (!Array.isArray(tags)) return '';
  var out = [];
  var seen = {};
  var i;
  for (i = 0; i < tags.length; i++) {
    var t = String(tags[i] || '').trim();
    if (!t) continue;
    if (t.charAt(0) !== '#') t = '#' + t;
    var k = t.toLowerCase();
    if (seen[k]) continue;
    seen[k] = true;
    out.push(t);
  }
  return out.join(', ');
}

/**
 * @param {Object} filters
 * @return {{ok:boolean,items:Array<Object>,total:number,controlledTags:Array<string>}}
 */
function ContentCatalog_list(filters) {
  ContentCatalog_requireAnyRole_();
  return ContentCatalog_listSupabase_(filters);
}

/**
 * @param {Object} filters
 * @return {{ok:boolean,items:Array<Object>,total:number,hasMore:boolean,controlledTags:Array<string>}}
 */
function ContentCatalog_listSupabase_(filters) {
  var dbRows = ContentCatalogStore_listAll();
  var q = filters && filters.q ? String(filters.q).trim().toLowerCase() : '';
  var type = filters && filters.contentType ? String(filters.contentType).trim() : '';
  var tag = filters && filters.tag ? String(filters.tag).trim().toLowerCase() : '';
  var shouldReconcile = !(filters && filters.skipReconcile);
  var items = [];
  var repairClient = null;
  var repairClientReady = false;

  for (var i = 0; i < dbRows.length; i++) {
    var row = dbRows[i];
    var cid = String(row.content_id || '').trim();
    if (!cid) continue;
    var ctype = String(row.content_type || '').trim();
    if (type && ctype !== type) continue;
    var title = String(row.title || '');
    var summary = String(row.summary || '');
    var tagsCsv = String(row.tags_csv || '');
    if (q) {
      var hay = (title + ' ' + summary + ' ' + String(row.client_name || '') + ' ' + tagsCsv)
        .toLowerCase();
      if (hay.indexOf(q) < 0) continue;
    }
    if (tag && !ContentCatalog_rowHasTag_(tagsCsv, tag)) continue;

    var driveFileId = String(row.drive_file_id || '').trim();
    var globantProfile = String(row.globant_profile_name || '').trim();
    var globantDocId = String(row.globant_document_id || '').trim();
    var driveState = 'exists';
    if (shouldReconcile && ctype === 'success_case' && driveFileId) {
      driveState = ContentCatalog_getDriveFileState_(driveFileId);
    }
    if (driveState === 'missing') {
      ContentCatalog_tryDeleteRemoteIndex_(globantProfile, globantDocId);
      ContentCatalogStore_delete(cid);
      continue;
    }
    if (shouldReconcile && !repairClientReady && globantDocId && globantProfile) {
      repairClientReady = true;
      try {
        repairClient = ContentIngestion_createRagClient_();
      } catch (ignoreRepairClient) {
        repairClient = null;
      }
    }
    var globantIndexStatus =
      shouldReconcile && driveState === 'exists'
        ? ContentCatalog_getIndexStatus_(repairClient, globantProfile, globantDocId)
        : '';
    var needsIndexRepair =
      globantIndexStatus === 'missing' ||
      (globantIndexStatus !== '' &&
        globantIndexStatus !== 'Success' &&
        globantIndexStatus !== 'Pending' &&
        globantIndexStatus !== 'Processing');

    var apiItem = ContentCatalogStore_toApiItem_(row, ContentCatalog_csvToTags_);
    apiItem.common.globant_index_status = globantIndexStatus;
    apiItem.common.index_repair_needed = needsIndexRepair;
    items.push(apiItem);
  }

  items.sort(function (a, b) {
    return String(b.common.updated_at || '').localeCompare(String(a.common.updated_at || ''));
  });

  var total = items.length;
  var skip = filters && typeof filters.skip === 'number' ? Math.max(0, filters.skip) : 0;
  var limitRaw =
    filters && typeof filters.limit === 'number' && filters.limit > 0
      ? filters.limit
      : 0;
  var limit =
    limitRaw > 0 ? Math.min(ContentCatalog_LIST_MAX_LIMIT_, Math.max(1, limitRaw)) : 0;
  var paged = items;
  var hasMore = false;
  if (limit > 0) {
    paged = items.slice(skip, skip + limit);
    hasMore = skip + limit < total;
  }
  return {
    ok: true,
    items: paged,
    total: total,
    skip: skip,
    limit: limit,
    hasMore: hasMore,
    controlledTags: ContentCatalog_getControlledTags(),
  };
}

/** @type {number} */
var ContentCatalog_LIST_MAX_LIMIT_ = 100;

/**
 * @param {string} tagsCsv
 * @param {string} tagFilter normalized lowercase, with optional leading #
 * @return {boolean}
 */
function ContentCatalog_rowHasTag_(tagsCsv, tagFilter) {
  var want = String(tagFilter || '').trim().toLowerCase();
  if (!want) return true;
  if (want.charAt(0) !== '#') want = '#' + want;
  var tags = ContentCatalog_csvToTags_(tagsCsv);
  for (var i = 0; i < tags.length; i++) {
    if (String(tags[i] || '').toLowerCase() === want) return true;
  }
  return false;
}

/**
 * @param {string} driveFileId
 * @return {'exists'|'missing'|'unknown'}
 */
function ContentCatalog_getDriveFileState_(driveFileId) {
  var id = String(driveFileId || '').trim();
  if (!id) return 'missing';
  try {
    var f = DriveApp.getFileById(id);
    return f.isTrashed() ? 'missing' : 'exists';
  } catch (e) {
    var msg = e && e.message ? String(e.message) : String(e || '');
    if (/not found|no item|cannot find/i.test(msg)) return 'missing';
    return 'unknown';
  }
}

/**
 * @param {Object|null} ragClient
 * @param {string} profileName
 * @param {string} documentId
 * @return {boolean}
 */
/**
 * Devuelve el estado de indexación real del documento en Globant.
 * Valores posibles: 'Success', 'Failed', 'Pending', 'Processing', 'missing', '' (desconocido).
 * @param {Object|null} ragClient
 * @param {string} profileName
 * @param {string} documentId
 * @return {string}
 */
function ContentCatalog_getIndexStatus_(ragClient, profileName, documentId) {
  var pn = String(profileName || '').trim();
  var doc = String(documentId || '').trim();
  if (!pn || !doc) return 'missing';
  if (!ragClient) return '';
  try {
    return String(ragClient.getDocumentIndexStatus(pn, doc) || '');
  } catch (e) {
    return '';
  }
}

/**
 * @param {string} profileName
 * @param {string} documentId
 */
function ContentCatalog_tryDeleteRemoteIndex_(profileName, documentId) {
  var pn = String(profileName || '').trim();
  var doc = String(documentId || '').trim();
  if (!pn || !doc) return;
  try {
    ContentIngestion_createRagClient_().deleteDocument(pn, doc);
  } catch (ignore) {}
}

/**
 * @param {string} contentId
 * @return {{ok:boolean,item:Object}}
 */
function ContentCatalog_get(contentId) {
  var id = String(contentId || '').trim();
  var list = ContentCatalog_list({ skipReconcile: true });
  var i;
  for (i = 0; i < list.items.length; i++) {
    if (list.items[i].common.content_id === id) return { ok: true, item: list.items[i] };
  }
  throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_admin_agent_not_found'));
}

/**
 * @param {{common:Object,specific:Object}} payload
 * @return {{ok:boolean,item:Object}}
 */
function ContentCatalog_upsert(payload) {
  var who = ContentCatalog_requireContributor_();
  if (!payload || typeof payload !== 'object') {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_admin_agent_payload'));
  }
  var common = payload.common || {};
  var specific = payload.specific || {};
  var ctype = String(common.content_type || '').trim();
  if (!ContentCatalog_isValidType_(ctype)) {
    throw new Error('content_type invalido');
  }
  var contentId = String(common.content_id || '').trim() || Utilities.getUuid();
  var now = new Date().toISOString();

  var prevDb = ContentCatalogStore_getById(contentId);
  var prevCreatedAt = prevDb ? String(prevDb.created_at || '') : '';
  var tagsArrayDb = common.tags || [].concat(common.tags_controlled || [], common.tags_free || []);
  var commonRowDb = {
    content_id: contentId,
    content_type: ctype,
    title: String(common.title || '').trim(),
    summary: String(common.summary || '').trim(),
    client_name: String(common.client_name || '').trim(),
    tags_csv: ContentCatalog_tagsToCsv_(tagsArrayDb),
    file_name: String(common.file_name || '').trim(),
    mime_type: String(common.mime_type || '').trim(),
    drive_file_id: String(common.drive_file_id || '').trim(),
    drive_file_url: String(common.drive_file_url || '').trim(),
    globant_profile_name: String(common.globant_profile_name || '').trim(),
    globant_document_id: String(common.globant_document_id || '').trim(),
    uploaded_by: String(common.uploaded_by || who.email).trim(),
    created_at: prevCreatedAt || now,
    updated_at: now,
  };
  if (!commonRowDb.title) throw new Error('title requerido');
  specific = ContentExtraction_normalizeSpecific_(ctype, specific);
  var specificHeadersDb = ContentCatalog_headersByType_(ctype);
  var specificRowDb = { content_id: contentId };
  var hd;
  for (hd = 1; hd < specificHeadersDb.length; hd++) {
    var skey = specificHeadersDb[hd];
    specificRowDb[skey] = String(specific[skey] || '').trim();
  }
  commonRowDb.search_text = ContentCatalog_buildSearchText_({
    title: commonRowDb.title,
    summary: commonRowDb.summary,
    client_name: commonRowDb.client_name,
    tags_csv: commonRowDb.tags_csv,
    content_type: commonRowDb.content_type,
    file_name: commonRowDb.file_name,
    specific: specificRowDb,
  });
  ContentCatalogStore_upsert(commonRowDb, specificRowDb);
  try {
    ContentEmbedding_refreshForContentId_(contentId);
  } catch (eEmb) {
    console.log(
      '[CATALOG-EMB] upsert ok, embedding deferred: ' +
        String(eEmb.message || eEmb).slice(0, 200),
    );
  }
  return ContentCatalog_get(contentId);
}

/**
 * @param {string} contentId
 * @return {{ok:boolean,deleted:boolean}}
 */
function ContentCatalog_deleteHard(contentId) {
  ContentCatalog_requireContributor_();
  var id = String(contentId || '').trim();
  if (!id) throw new Error('content_id requerido');
  ContentCatalog_get(id);

  var deletedDb = ContentCatalogStore_delete(id);
  return { ok: true, deleted: deletedDb };
}

/**
 * @return {Array<string>}
 */
function ContentCatalog_getControlledTags() {
  return ContentCatalogStore_getControlledTags();
}

/**
 * Obtiene todos los tags usados en todos los contenidos (la "bolsa" de tags).
 * @return {Array<string>}
 */
function ContentCatalog_getAllTags() {
  try {
    var cloud = ContentCatalog_getTagsCloud_();
    var out = [];
    for (var i = 0; i < cloud.length; i++) {
      out.push(cloud[i].tag);
    }
    return out.sort();
  } catch (e) {
    return [];
  }
}

/**
 * Tags con conteo de contenidos (para nube de palabras).
 * @return {{ok:boolean,tags:Array<{tag:string,count:number}>,total:number}}
 */
function ContentCatalog_getTagsCloud() {
  ContentCatalog_requireAnyRole_();
  var tags = ContentCatalog_getTagsCloud_();
  return { ok: true, tags: tags, total: tags.length };
}

/**
 * @return {Array<{tag:string,count:number}>}
 */
function ContentCatalog_getTagsCloud_() {
  var dbRows = ContentCatalogStore_listAll();
  var counts = {};
  var display = {};
  for (var di = 0; di < dbRows.length; di++) {
    var tagList = ContentCatalog_csvToTags_(dbRows[di].tags_csv);
    for (var ti = 0; ti < tagList.length; ti++) {
      var t = tagList[ti];
      var k = t.toLowerCase();
      counts[k] = (counts[k] || 0) + 1;
      if (!display[k]) display[k] = t;
    }
  }
  var out = [];
  for (var key in counts) {
    if (!counts.hasOwnProperty(key)) continue;
    out.push({ tag: display[key] || key, count: counts[key] });
  }
  out.sort(function (a, b) {
    if (b.count !== a.count) return b.count - a.count;
    return String(a.tag || '').localeCompare(String(b.tag || ''));
  });
  return out;
}

/**
 * @param {Array<string>} tags
 * @return {{ok:boolean,tags:Array<string>}}
 */
function ContentCatalog_setControlledTags(tags) {
  ContentCatalog_requireContributor_();
  if (!Array.isArray(tags)) throw new Error('tags invalidos');
  var normalized = [];
  var seen = {};
  var i;
  for (i = 0; i < tags.length; i++) {
    var t = String(tags[i] || '').trim();
    if (!t) continue;
    if (t.charAt(0) !== '#') t = '#' + t;
    var k = t.toLowerCase();
    if (seen[k]) continue;
    seen[k] = true;
    normalized.push(t);
  }
  ContentCatalogStore_setControlledTags(normalized);
  return { ok: true, tags: normalized };
}

/**
 * @param {string} clientName
 * @param {string} queryLower — consulta en minúsculas
 * @return {boolean}
 */
function ContentCatalog_clientNameMatchesQuery_(clientName, queryLower) {
  var clientLower = String(clientName || '').trim().toLowerCase();
  var q = String(queryLower || '').trim().toLowerCase();
  if (!clientLower || !q) return false;
  if (clientLower.indexOf(q) >= 0 || q.indexOf(clientLower) >= 0) return true;
  var words = clientLower.split(/\s+/);
  var w;
  for (w = 0; w < words.length; w++) {
    if (words[w].length >= 3 && q.indexOf(words[w]) >= 0) return true;
  }
  var qWords = q.split(/\s+/);
  for (w = 0; w < qWords.length; w++) {
    if (qWords[w].length >= 3 && clientLower.indexOf(qWords[w]) >= 0) return true;
  }
  return false;
}

/**
 * @param {Object} row
 * @return {boolean}
 */
function ContentCatalog_rowHasCatalogContext_(row) {
  return !!String(row.summary || '').trim();
}

/**
 * @param {Object} row
 * @return {boolean}
 */
function ContentCatalog_rowHasGlobantIndex_(row) {
  return (
    !!String(row.globant_document_id || '').trim() &&
    !!String(row.globant_profile_name || '').trim()
  );
}

/**
 * @param {Object} row
 * @return {{documentId:string, profileName:string, clientName:string, fileName:string, title:string, summary:string, contentType:string, driveUrl:string, catalogContextOnly:boolean, contentId:string, driveFileId:string}}
 */
function ContentCatalog_mapRowToCatalogDoc_(row) {
  var globantDocId = String(row.globant_document_id || '').trim();
  var profileName = String(row.globant_profile_name || '').trim();
  var catalogContextOnly = !ContentCatalog_rowHasGlobantIndex_(row);
  return {
    contentId: String(row.content_id || '').trim(),
    documentId: globantDocId,
    profileName: profileName,
    clientName: String(row.client_name || '').trim(),
    fileName: String(row.file_name || '').trim(),
    driveFileId: String(row.drive_file_id || '').trim(),
    title: String(row.title || '').trim(),
    summary: String(row.summary || '').trim(),
    contentType: String(row.content_type || '').trim(),
    driveUrl: String(row.drive_file_url || '').trim(),
    catalogContextOnly: catalogContextOnly,
  };
}

/**
 * Busca documentos en el catálogo por nombre de cliente (búsqueda flexible).
 * Incluye filas con resumen aunque falte globant_document_id (contexto directo sin RAG).
 * @param {string} clientQuery — texto a buscar en client_name
 * @return {{docs: Array<{documentId:string, profileName:string, clientName:string, fileName:string, title:string, summary:string, contentType:string, driveUrl:string, catalogContextOnly:boolean}>}}
 */
function ContentCatalog_findDocsByClient(clientQuery) {
  var q = String(clientQuery || '').trim().toLowerCase();
  if (!q) return { docs: [] };

  var commonRows = ContentCatalogStore_listAll();
  var results = [];
  for (var i = 0; i < commonRows.length; i++) {
    var row = commonRows[i];
    var clientName = String(row.client_name || '').trim();
    if (!ContentCatalog_clientNameMatchesQuery_(clientName, q)) continue;

    var hasIndex = ContentCatalog_rowHasGlobantIndex_(row);
    var hasContext = ContentCatalog_rowHasCatalogContext_(row);
    if (!hasIndex && !hasContext) continue;

    results.push(ContentCatalog_mapRowToCatalogDoc_(row));
  }

  console.log('[CATALOG-SEARCH] Query: "' + q + '", Found: ' + results.length + ' docs');
  return { docs: results };
}

/**
 * Detecta cliente y documentos cuando la pregunta menciona un client_name del catálogo
 * aunque no esté en el maestro de clientes.
 * @param {string} question
 * @return {{docs: Array<Object>, clientName: string}}
 */
function ContentCatalog_findDocsByQuestion_(question) {
  var q = String(question || '').trim().toLowerCase();
  if (!q) return { docs: [], clientName: '' };

  var commonRows = ContentCatalogStore_listAll();
  var clientNames = {};
  var i;
  for (i = 0; i < commonRows.length; i++) {
    var cn = String(commonRows[i].client_name || '').trim();
    if (!cn) continue;
    var hasIndex = ContentCatalog_rowHasGlobantIndex_(commonRows[i]);
    var hasContext = ContentCatalog_rowHasCatalogContext_(commonRows[i]);
    if (!hasIndex && !hasContext) continue;
    if (ContentCatalog_clientNameMatchesQuery_(cn, q)) {
      clientNames[cn.toLowerCase()] = cn;
    }
  }

  var keys = Object.keys(clientNames);
  if (!keys.length) return { docs: [], clientName: '' };

  keys.sort(function (a, b) {
    return clientNames[b].length - clientNames[a].length;
  });
  var bestClient = clientNames[keys[0]];
  var found = ContentCatalog_findDocsByClient(bestClient);
  return { docs: found.docs || [], clientName: bestClient };
}

/** @type {Object<string, boolean>} */
var _CATALOG_QUERY_STOPWORDS_ = {
  que: true,
  con: true,
  por: true,
  para: true,
  del: true,
  los: true,
  las: true,
  una: true,
  uno: true,
  the: true,
  and: true,
  for: true,
  with: true,
  what: true,
  did: true,
  how: true,
  hicimos: true,
  hizo: true,
  sobre: true,
  acerca: true,
};

/**
 * Tokens de búsqueda útiles a partir de la pregunta del usuario.
 * @param {string} question
 * @return {Array<string>}
 */
function ContentCatalog_questionSearchTokens_(question) {
  var q = String(question || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  var raw = q.split(/[^a-z0-9]+/);
  var out = [];
  var seen = {};
  var i;
  for (i = 0; i < raw.length; i++) {
    var w = String(raw[i] || '').trim();
    if (w.length < 3 || _CATALOG_QUERY_STOPWORDS_[w] || seen[w]) continue;
    seen[w] = true;
    out.push(w);
  }
  return out;
}

/**
 * Texto denormalizado para búsqueda léxica (título, resumen, tags, specific).
 * @param {Object} row
 * @return {string}
 */
function ContentCatalog_buildSearchText_(row) {
  var parts = [
    String(row.title || '').trim(),
    String(row.summary || '').trim(),
    String(row.client_name || '').trim(),
    String(row.tags_csv || '').trim(),
    String(row.content_type || '').trim(),
    String(row.file_name || '').trim(),
  ];
  var specific = row.specific;
  if (specific && typeof specific === 'object' && !Array.isArray(specific)) {
    var k;
    for (k in specific) {
      if (!Object.prototype.hasOwnProperty.call(specific, k)) continue;
      if (k === 'content_id') continue;
      parts.push(String(specific[k] != null ? specific[k] : '').trim());
    }
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

/**
 * Filtra filas del catálogo según el rol del usuario (visitante → solo success cases).
 * @param {Array<Object>} docs
 * @return {Array<Object>}
 */
function ContentCatalog_filterDocsForSessionRole_(docs) {
  var role = AgentOrchestrator_resolveUserRoleTag_();
  if (role !== 'visitante') return docs || [];
  var out = [];
  var i;
  for (i = 0; i < (docs || []).length; i++) {
    if ((docs[i].contentType || '') === 'success_case') out.push(docs[i]);
  }
  return out;
}

/**
 * @param {Object} doc
 * @return {string}
 */
function ContentCatalog_docMergeKey_(doc) {
  return (
    (doc.documentId || '') +
    '|' +
    (doc.title || doc.fileName || '') +
    '|' +
    (doc.contentType || '')
  );
}

/**
 * Búsqueda semántica (pgvector) con fallback silencioso si RPC/embeddings no están listos.
 * @param {string} question
 * @param {{limit?:number,threshold?:number}} [opts]
 * @return {Array<{score:number,similarity:number,doc:Object}>}
 */
function ContentCatalog_findRowsSemantic_(question, opts) {
  var limit = opts && opts.limit ? Math.min(15, Math.max(1, opts.limit)) : 8;
  var threshold =
    opts && opts.threshold != null ? Number(opts.threshold) : CONTENT_EMBEDDING_MATCH_THRESHOLD;
  var q = String(question || '').trim();
  if (!q) return [];
  try {
    var vector = ContentEmbedding_createVector_(q);
    if (!vector.length) return [];
    var rows = ContentCatalogStore_matchSemantic(vector, {
      limit: limit,
      threshold: threshold,
    });
    var out = [];
    var i;
    for (i = 0; i < rows.length; i++) {
      var sim = Number(rows[i].similarity || 0);
      out.push({
        score: sim * 10,
        similarity: sim,
        doc: ContentCatalog_mapRowToCatalogDoc_(rows[i]),
      });
    }
    console.log('[CATALOG-SEM] hits=' + out.length);
    return out;
  } catch (eSem) {
    console.log('[CATALOG-SEM] skip: ' + String(eSem.message || eSem).slice(0, 200));
    return [];
  }
}

/**
 * @param {Array<{score:number,doc:Object}>} hits
 * @param {number} limit
 * @return {Array<Object>}
 */
function ContentCatalog_scoredHitsToDocs_(hits, limit) {
  hits.sort(function (a, b) {
    return b.score - a.score;
  });
  var results = [];
  var i;
  for (i = 0; i < hits.length && results.length < limit; i++) {
    results.push(hits[i].doc);
  }
  return results;
}

/**
 * Backfill paginado de embeddings del catálogo.
 * @param {number} skip
 * @param {number} limit
 */
function ContentCatalog_rebuildEmbeddingsBatch(skip, limit) {
  return ContentEmbedding_rebuildBatch_(skip, limit);
}

/**
 * @param {string} question
 * @param {{topics?:Array<string>,industry?:string,clientHint?:string,docKind?:string}} hints
 * @param {{limit?:number}} [opts]
 * @return {Array<Object>}
 */
function ContentCatalog_findRowsForEphemeralDocument_(question, hints, opts) {
  var limit = opts && opts.limit ? Math.min(15, Math.max(1, opts.limit)) : 8;
  var parts = [String(question || '').trim()];
  if (hints) {
    if (hints.industry) parts.push(String(hints.industry));
    if (hints.clientHint) parts.push(String(hints.clientHint));
    if (hints.docKind) parts.push(String(hints.docKind));
    if (Array.isArray(hints.topics)) {
      for (var ti = 0; ti < hints.topics.length; ti++) {
        parts.push(String(hints.topics[ti] || ''));
      }
    }
  }
  var combined = parts.join(' ').replace(/\s+/g, ' ').trim();

  /** @type {Object<string, {score:number, doc:Object}>} */
  var byKey = {};
  var addHits = function (query, weight) {
    var hits = ContentCatalog_findRowsMatchingQuestion_(query, { limit: limit });
    var hi;
    for (hi = 0; hi < hits.length; hi++) {
      var doc = hits[hi];
      var key = ContentCatalog_docMergeKey_(doc);
      if (!byKey[key]) byKey[key] = { score: 0, doc: doc };
      byKey[key].score += weight;
    }
  };

  addHits(combined, 3);
  if (hints && hints.clientHint) addHits(String(hints.clientHint), 4);
  if (hints && Array.isArray(hints.topics)) {
    for (var tj = 0; tj < hints.topics.length; tj++) {
      addHits(String(hints.topics[tj] || ''), 2);
    }
  }
  addHits(String(question || ''), 2);

  var scored = [];
  var bk;
  for (bk in byKey) {
    if (Object.prototype.hasOwnProperty.call(byKey, bk)) scored.push(byKey[bk]);
  }
  scored.sort(function (a, b) {
    return b.score - a.score;
  });

  var results = [];
  for (var ri = 0; ri < scored.length && results.length < limit; ri++) {
    results.push(scored[ri].doc);
  }
  return results;
}

/**
 * Busca filas del catálogo relevantes a la pregunta (título, resumen, cliente, tags).
 * No exige globant_document_id; requiere resumen para usar como contexto.
 * @param {string} question
 * @param {{limit?: number}} [opts]
 * @return {Array<Object>}
 */
function ContentCatalog_findRowsMatchingQuestion_(question, opts) {
  var limit = opts && opts.limit ? Math.min(15, Math.max(1, opts.limit)) : 10;
  var tokens = ContentCatalog_questionSearchTokens_(question);
  var q = String(question || '').trim();

  /** @type {Object<string, {score:number, doc:Object}>} */
  var byKey = {};
  var commonRows = ContentCatalogStore_listAll();
  var i;

  if (tokens.length) {
    for (i = 0; i < commonRows.length; i++) {
      var row = commonRows[i];
      if (!ContentCatalog_rowHasCatalogContext_(row)) continue;

      var title = String(row.title || '').trim();
      var summary = String(row.summary || '').trim();
      var clientName = String(row.client_name || '').trim();
      var tagsCsv = String(row.tags_csv || '').trim();
      var searchText = String(row.search_text || '').trim();
      var hay = (title + ' ' + summary + ' ' + clientName + ' ' + tagsCsv + ' ' + searchText)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      var score = 0;
      var t;
      for (t = 0; t < tokens.length; t++) {
        if (hay.indexOf(tokens[t]) >= 0) score += 2;
      }
      if (ContentCatalog_clientNameMatchesQuery_(clientName, q)) {
        score += 5;
      }
      if (score <= 0) continue;

      var docLex = ContentCatalog_mapRowToCatalogDoc_(row);
      var keyLex = ContentCatalog_docMergeKey_(docLex);
      if (!byKey[keyLex]) byKey[keyLex] = { score: 0, doc: docLex };
      byKey[keyLex].score += score;
    }
  }

  var semHits = ContentCatalog_findRowsSemantic_(q, { limit: limit });
  for (i = 0; i < semHits.length; i++) {
    var docSem = semHits[i].doc;
    var keySem = ContentCatalog_docMergeKey_(docSem);
    if (!byKey[keySem]) byKey[keySem] = { score: 0, doc: docSem };
    byKey[keySem].score += semHits[i].score;
  }

  var scored = [];
  var k;
  for (k in byKey) {
    if (Object.prototype.hasOwnProperty.call(byKey, k)) scored.push(byKey[k]);
  }

  if (!scored.length) return [];

  var results = ContentCatalog_scoredHitsToDocs_(scored, limit);

  console.log(
    '[CATALOG-MATCH] tokens=' +
      tokens.join(',') +
      ' sem=' +
      semHits.length +
      ' hits=' +
      results.length,
  );
  return results;
}

