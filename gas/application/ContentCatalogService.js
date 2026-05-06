/**
 * @fileoverview Catalogo de contenidos (1 spreadsheet + 4 tabs).
 */

var CATALOG_PROP_SSID = 'CATALOG_SPREADSHEET_ID';
var CATALOG_PROP_TAB_COMMON = 'CATALOG_TAB_COMMON';
var CATALOG_PROP_TAB_PROPOSALS = 'CATALOG_TAB_PROPOSALS';
var CATALOG_PROP_TAB_SUCCESS_CASES = 'CATALOG_TAB_SUCCESS_CASES';
var CATALOG_PROP_TAB_CLIENTS = 'CATALOG_TAB_CLIENTS';
var CATALOG_PROP_TAGS_JSON = 'CATALOG_CONTROLLED_TAGS_JSON';

var CATALOG_TAB_COMMON_DEFAULT = 'common';
var CATALOG_TAB_PROPOSALS_DEFAULT = 'proposals';
var CATALOG_TAB_SUCCESS_CASES_DEFAULT = 'success_cases';
var CATALOG_TAB_CLIENTS_DEFAULT = 'clients';
var CATALOG_ROOT_FOLDER_ID = '1gkNVvIEN3UfPMnphZKLJ3600s5bkmTwG';

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
  if (AdminAuth_emailIsAdmin(email)) {
    return { email: email, roleKey: 'admin', roleLabel: 'Admin' };
  }
  var rec = RoleDirectory_lookupRole(email);
  if (!RoleDirectory_roleRecordIsPresale_(rec)) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_admin_only'));
  }
  var label = rec && rec.label ? String(rec.label) : '';
  var key = rec && rec.key ? String(rec.key) : '';
  return {
    email: email,
    roleKey: key || 'presale',
    roleLabel: label || 'Presale',
  };
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
  if (AdminAuth_emailIsAdmin(email)) return;
  var rec = RoleDirectory_lookupRole(email);
  if (!rec || !rec.key) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_admin_only'));
  }
}

/**
 * @param {GoogleAppsScript.Properties.Properties} props
 * @return {{common:string, proposals:string, successCases:string, clients:string}}
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
 * @param {GoogleAppsScript.Properties.Properties} props
 * @return {{spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet, tabs: {common:string,proposals:string,successCases:string,clients:string}}}
 */
function ContentCatalog_getOrCreateSpreadsheet_(props) {
  var tabs = ContentCatalog_resolveTabNames_(props);
  var ssId = (props.getProperty(CATALOG_PROP_SSID) || '').trim();
  var ss;
  if (ssId) {
    ss = SpreadsheetApp.openById(ssId);
  } else {
    ss = SpreadsheetApp.create('aviators-content-catalog');
    props.setProperty(CATALOG_PROP_SSID, ss.getId());
    try {
      var file = DriveApp.getFileById(ss.getId());
      var rootFolder = DriveApp.getFolderById(CATALOG_ROOT_FOLDER_ID);
      rootFolder.addFile(file);
      DriveApp.getRootFolder().removeFile(file);
    } catch (ignoreMove) {}
  }

  function ensureSheet(name) {
    var sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    return sh;
  }

  ContentCatalog_ensureSheetHeaders_(
    ensureSheet(tabs.common),
    ContentCatalog_headersCommon_(),
  );
  ContentCatalog_ensureSheetHeaders_(
    ensureSheet(tabs.proposals),
    ContentCatalog_headersByType_('proposal'),
  );
  ContentCatalog_ensureSheetHeaders_(
    ensureSheet(tabs.successCases),
    ContentCatalog_headersByType_('success_case'),
  );
  ContentCatalog_ensureSheetHeaders_(
    ensureSheet(tabs.clients),
    ContentCatalog_headersByType_('client'),
  );

  return { spreadsheet: ss, tabs: tabs };
}

/**
 * @param {string} contentType
 * @return {boolean}
 */
function ContentCatalog_isValidType_(contentType) {
  return (
    contentType === 'proposal' ||
    contentType === 'success_case' ||
    contentType === 'client'
  );
}

/**
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {string[]} headers
 * @return {Array<Object>}
 */
function ContentCatalog_readRows_(sheet, headers) {
  var last = sheet.getLastRow();
  if (last < 2) return [];
  var vals = sheet.getRange(2, 1, last - 1, headers.length).getValues();
  var out = [];
  var i;
  var j;
  for (i = 0; i < vals.length; i++) {
    var row = {};
    for (j = 0; j < headers.length; j++) {
      row[headers[j]] = vals[i][j];
    }
    out.push(row);
  }
  return out;
}

/**
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {string[]} headers
 * @param {Object} rowObj
 * @return {number} row index in sheet (1-based)
 */
function ContentCatalog_upsertRowByContentId_(sheet, headers, rowObj) {
  var last = sheet.getLastRow();
  var targetRow = -1;
  var contentId = String(rowObj.content_id || '').trim();
  if (!contentId) throw new Error('content_id requerido');
  if (last >= 2) {
    var ids = sheet.getRange(2, 1, last - 1, 1).getValues();
    var i;
    for (i = 0; i < ids.length; i++) {
      if (String(ids[i][0] || '').trim() === contentId) {
        targetRow = i + 2;
        break;
      }
    }
  }
  var values = [];
  var h;
  for (h = 0; h < headers.length; h++) {
    values.push(rowObj[headers[h]] != null ? rowObj[headers[h]] : '');
  }
  if (targetRow < 0) {
    targetRow = last + 1;
  }
  sheet.getRange(targetRow, 1, 1, headers.length).setValues([values]);
  return targetRow;
}

/**
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {string} contentId
 * @return {boolean}
 */
function ContentCatalog_deleteRowByContentId_(sheet, contentId) {
  var last = sheet.getLastRow();
  if (last < 2) return false;
  var ids = sheet.getRange(2, 1, last - 1, 1).getValues();
  var i;
  for (i = 0; i < ids.length; i++) {
    if (String(ids[i][0] || '').trim() === contentId) {
      sheet.deleteRow(i + 2);
      return true;
    }
  }
  return false;
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
  var props = PropertiesService.getScriptProperties();
  var catalog = ContentCatalog_getOrCreateSpreadsheet_(props);
  var ss = catalog.spreadsheet;
  var tabs = catalog.tabs;
  var commonHeaders = ContentCatalog_headersCommon_();
  var commonRows = ContentCatalog_readRows_(ss.getSheetByName(tabs.common), commonHeaders);
  var proposalsRows = ContentCatalog_readRows_(
    ss.getSheetByName(tabs.proposals),
    ContentCatalog_headersByType_('proposal'),
  );
  var successRows = ContentCatalog_readRows_(
    ss.getSheetByName(tabs.successCases),
    ContentCatalog_headersByType_('success_case'),
  );
  var clientRows = ContentCatalog_readRows_(
    ss.getSheetByName(tabs.clients),
    ContentCatalog_headersByType_('client'),
  );
  var byIdSpecific = {};
  var i;
  for (i = 0; i < proposalsRows.length; i++) {
    byIdSpecific[String(proposalsRows[i].content_id || '').trim()] = proposalsRows[i];
  }
  for (i = 0; i < successRows.length; i++) {
    byIdSpecific[String(successRows[i].content_id || '').trim()] = successRows[i];
  }
  for (i = 0; i < clientRows.length; i++) {
    byIdSpecific[String(clientRows[i].content_id || '').trim()] = clientRows[i];
  }

  var q = filters && filters.q ? String(filters.q).trim().toLowerCase() : '';
  var type = filters && filters.contentType ? String(filters.contentType).trim() : '';
  var tag = filters && filters.tag ? String(filters.tag).trim().toLowerCase() : '';
  var shouldReconcile = !(filters && filters.skipReconcile);
  var items = [];
  var repairClient = null;
  var repairClientReady = false;
  for (i = 0; i < commonRows.length; i++) {
    var c = commonRows[i];
    var cid = String(c.content_id || '').trim();
    if (!cid) continue;
    var ctype = String(c.content_type || '').trim();
    if (type && ctype !== type) continue;
    var title = String(c.title || '');
    var summary = String(c.summary || '');
    var tagsCsv = String(c.tags_csv || '');
    if (q) {
      var hay = (title + ' ' + summary + ' ' + String(c.client_name || '') + ' ' + tagsCsv)
        .toLowerCase();
      if (hay.indexOf(q) < 0) continue;
    }
    if (tag && tagsCsv.toLowerCase().indexOf(tag) < 0) continue;
    var driveFileId = String(c.drive_file_id || '').trim();
    var globantProfile = String(c.globant_profile_name || '').trim();
    var globantDocId = String(c.globant_document_id || '').trim();
    var driveState = shouldReconcile
      ? ContentCatalog_getDriveFileState_(driveFileId)
      : 'exists';
    if (driveState === 'missing') {
      ContentCatalog_tryDeleteRemoteIndex_(globantProfile, globantDocId);
      ContentCatalog_deleteRowsByType_(ss, tabs, ctype, cid);
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
    var needsIndexRepair =
      shouldReconcile &&
      driveState === 'exists' &&
      ContentCatalog_needsIndexRepair_(repairClient, globantProfile, globantDocId);
    items.push({
      common: {
        content_id: cid,
        content_type: ctype,
        title: title,
        summary: summary,
        client_name: String(c.client_name || ''),
        tags: ContentCatalog_csvToTags_(tagsCsv),
        file_name: String(c.file_name || ''),
        mime_type: String(c.mime_type || ''),
        drive_file_id: driveFileId,
        drive_file_url: String(c.drive_file_url || ''),
        globant_profile_name: globantProfile,
        globant_document_id: globantDocId,
        index_repair_needed: needsIndexRepair,
        uploaded_by: String(c.uploaded_by || ''),
        created_at: String(c.created_at || ''),
        updated_at: String(c.updated_at || ''),
      },
      specific: byIdSpecific[cid] || { content_id: cid },
    });
  }
  items.sort(function (a, b) {
    return String(b.common.updated_at || '').localeCompare(String(a.common.updated_at || ''));
  });

  var total = items.length;
  var skip = filters && typeof filters.skip === 'number' ? Math.max(0, filters.skip) : 0;
  var limit = filters && typeof filters.limit === 'number' && filters.limit > 0 ? filters.limit : 0;
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
    hasMore: hasMore,
    controlledTags: ContentCatalog_getControlledTags(),
  };
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
function ContentCatalog_needsIndexRepair_(ragClient, profileName, documentId) {
  var pn = String(profileName || '').trim();
  var doc = String(documentId || '').trim();
  if (!pn || !doc) return true;
  if (!ragClient) return false;
  try {
    return ragClient.getDocumentIndexStatus(pn, doc) !== 'Success';
  } catch (e) {
    return true;
  }
}

/**
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss
 * @param {{common:string,proposals:string,successCases:string,clients:string}} tabs
 * @param {string} contentType
 * @param {string} contentId
 * @return {boolean}
 */
function ContentCatalog_deleteRowsByType_(ss, tabs, contentType, contentId) {
  var id = String(contentId || '').trim();
  if (!id) return false;
  var commonSheet = ss.getSheetByName(tabs.common);
  var specificTab =
    contentType === 'proposal'
      ? tabs.proposals
      : contentType === 'success_case'
        ? tabs.successCases
        : tabs.clients;
  var specificSheet = ss.getSheetByName(specificTab);
  var deletedCommon = commonSheet
    ? ContentCatalog_deleteRowByContentId_(commonSheet, id)
    : false;
  if (specificSheet) ContentCatalog_deleteRowByContentId_(specificSheet, id);
  return deletedCommon;
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

  var props = PropertiesService.getScriptProperties();
  var catalog = ContentCatalog_getOrCreateSpreadsheet_(props);
  var ss = catalog.spreadsheet;
  var tabs = catalog.tabs;
  var commonSheet = ss.getSheetByName(tabs.common);
  var specificTab =
    ctype === 'proposal'
      ? tabs.proposals
      : ctype === 'success_case'
        ? tabs.successCases
        : tabs.clients;
  var specificSheet = ss.getSheetByName(specificTab);
  var commonHeaders = ContentCatalog_headersCommon_();
  var specificHeaders = ContentCatalog_headersByType_(ctype);

  var prevCreatedAt = '';
  var prevContentType = '';
  var existingRows = ContentCatalog_readRows_(commonSheet, commonHeaders);
  var i;
  for (i = 0; i < existingRows.length; i++) {
    if (String(existingRows[i].content_id || '').trim() === contentId) {
      prevCreatedAt = String(existingRows[i].created_at || '');
      prevContentType = String(existingRows[i].content_type || '').trim();
      break;
    }
  }

  if (prevContentType && prevContentType !== ctype) {
    var oldTab =
      prevContentType === 'proposal'
        ? tabs.proposals
        : prevContentType === 'success_case'
          ? tabs.successCases
          : tabs.clients;
    var oldSheet = ss.getSheetByName(oldTab);
    if (oldSheet) {
      ContentCatalog_deleteRowByContentId_(oldSheet, contentId);
    }
  }

  var tagsArray = common.tags || [].concat(common.tags_controlled || [], common.tags_free || []);
  var commonRow = {
    content_id: contentId,
    content_type: ctype,
    title: String(common.title || '').trim(),
    summary: String(common.summary || '').trim(),
    client_name: String(common.client_name || '').trim(),
    tags_csv: ContentCatalog_tagsToCsv_(tagsArray),
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
  if (!commonRow.title) throw new Error('title requerido');
  ContentCatalog_upsertRowByContentId_(commonSheet, commonHeaders, commonRow);

  var specificRow = { content_id: contentId };
  var h;
  for (h = 1; h < specificHeaders.length; h++) {
    var key = specificHeaders[h];
    specificRow[key] = String(specific[key] || '').trim();
  }
  ContentCatalog_upsertRowByContentId_(specificSheet, specificHeaders, specificRow);
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
  var item = ContentCatalog_get(id).item;
  var ctype = item.common.content_type;

  var props = PropertiesService.getScriptProperties();
  var catalog = ContentCatalog_getOrCreateSpreadsheet_(props);
  var ss = catalog.spreadsheet;
  var tabs = catalog.tabs;
  var deletedCommon = ContentCatalog_deleteRowsByType_(ss, tabs, ctype, id);
  return { ok: true, deleted: deletedCommon };
}

/**
 * @return {Array<string>}
 */
function ContentCatalog_getControlledTags() {
  var raw = (PropertiesService.getScriptProperties().getProperty(CATALOG_PROP_TAGS_JSON) || '').trim();
  if (!raw) return [];
  try {
    var arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    var out = [];
    var seen = {};
    var i;
    for (i = 0; i < arr.length; i++) {
      var t = String(arr[i] || '').trim();
      if (!t) continue;
      if (t.charAt(0) !== '#') t = '#' + t;
      var k = t.toLowerCase();
      if (seen[k]) continue;
      seen[k] = true;
      out.push(t);
    }
    return out;
  } catch (e) {
    return [];
  }
}

/**
 * Obtiene todos los tags usados en todos los contenidos (la "bolsa" de tags).
 * @return {Array<string>}
 */
function ContentCatalog_getAllTags() {
  try {
    var props = PropertiesService.getScriptProperties();
    var catalog = ContentCatalog_getOrCreateSpreadsheet_(props);
    var ss = catalog.spreadsheet;
    var commonSheet = ss.getSheetByName(catalog.tabs.common);
    if (!commonSheet) return [];
    var last = commonSheet.getLastRow();
    if (last < 2) return [];
    var headers = ContentCatalog_headersCommon_();
    var tagsIdx = headers.indexOf('tags_csv');
    if (tagsIdx < 0) return [];
    var data = commonSheet.getRange(2, tagsIdx + 1, last - 1, 1).getValues();
    var seen = {};
    var out = [];
    for (var r = 0; r < data.length; r++) {
      var csv = String(data[r][0] || '');
      if (!csv.trim()) continue;
      var parts = csv.split(',');
      for (var p = 0; p < parts.length; p++) {
        var t = parts[p].trim();
        if (!t) continue;
        if (t.charAt(0) !== '#') t = '#' + t;
        var k = t.toLowerCase();
        if (seen[k]) continue;
        seen[k] = true;
        out.push(t);
      }
    }
    return out.sort();
  } catch (e) {
    return [];
  }
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
  PropertiesService.getScriptProperties().setProperty(
    CATALOG_PROP_TAGS_JSON,
    JSON.stringify(normalized),
  );
  return { ok: true, tags: normalized };
}

