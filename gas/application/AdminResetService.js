/**
 * @fileoverview Restablecimiento total de datos operativos en spreadsheets (solo admin).
 * No toca la planilla de roles ni secretos de Script Properties.
 */

/**
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @return {number} filas de datos borradas
 */
function AdminReset_clearSheetDataKeepHeader_(sheet) {
  var last = sheet.getLastRow();
  if (last <= 1) return 0;
  var numRows = last - 1;
  var numCols = Math.max(1, sheet.getLastColumn());
  sheet.getRange(2, 1, numRows, numCols).clearContent();
  return numRows;
}

/**
 * @param {GoogleAppsScript.Properties.Properties} props
 * @param {string} propKey
 * @return {GoogleAppsScript.Spreadsheet.Spreadsheet|null}
 */
function AdminReset_tryOpenSpreadsheetByProp_(props, propKey) {
  var ssId = String(props.getProperty(propKey) || '').trim();
  if (!ssId) return null;
  try {
    return SpreadsheetApp.openById(ssId);
  } catch (ignoreOpen) {
    return null;
  }
}

/**
 * @param {GoogleAppsScript.Properties.Properties} props
 * @return {Object<string, number>}
 */
function AdminReset_clearContentCatalog_(props) {
  var ss = AdminReset_tryOpenSpreadsheetByProp_(props, CATALOG_PROP_SSID);
  if (!ss) return { common: 0, proposals: 0, successCases: 0, clients: 0, onboarding: 0 };

  var tabs = ContentCatalog_resolveTabNames_(props);
  var out = {
    common: 0,
    proposals: 0,
    successCases: 0,
    clients: 0,
    onboarding: 0,
  };

  function clearTab(name, headers, key) {
    var sh = ss.getSheetByName(name);
    if (!sh) {
      sh = ss.insertSheet(name);
      ContentCatalog_ensureSheetHeaders_(sh, headers);
      out[key] = 0;
      return;
    }
    ContentCatalog_ensureSheetHeaders_(sh, headers);
    out[key] = AdminReset_clearSheetDataKeepHeader_(sh);
  }

  clearTab(tabs.common, ContentCatalog_headersCommon_(), 'common');
  clearTab(tabs.proposals, ContentCatalog_headersByType_('proposal'), 'proposals');
  clearTab(tabs.successCases, ContentCatalog_headersByType_('success_case'), 'successCases');
  clearTab(tabs.clients, ContentCatalog_headersByType_('client'), 'clients');
  clearTab(tabs.onboarding, ContentCatalog_headersByType_('onboarding'), 'onboarding');

  props.deleteProperty(CATALOG_PROP_TAGS_JSON);
  return out;
}

/**
 * @param {GoogleAppsScript.Properties.Properties} props
 * @return {Object<string, number>}
 */
function AdminReset_clearMetrics_(props) {
  if (!String(props.getProperty(METRICS_PROP_SPREADSHEET_ID) || '').trim()) {
    return {
      usage: 0,
      unanswered: 0,
      monthly: 0,
      feedback: 0,
      chatHistory: 0,
      quickPrompts: 0,
    };
  }

  var db = MetricsService_getOrCreateSpreadsheet_();
  return {
    usage: AdminReset_clearSheetDataKeepHeader_(db.usageSheet),
    unanswered: AdminReset_clearSheetDataKeepHeader_(db.unansweredSheet),
    monthly: AdminReset_clearSheetDataKeepHeader_(db.monthlySheet),
    feedback: AdminReset_clearSheetDataKeepHeader_(db.feedbackSheet),
    chatHistory: AdminReset_clearSheetDataKeepHeader_(db.chatHistorySheet),
    quickPrompts: AdminReset_clearSheetDataKeepHeader_(db.quickPromptsSheet),
  };
}

/**
 * @param {GoogleAppsScript.Properties.Properties} props
 * @return {number}
 */
function AdminReset_clearClientsMaster_(props) {
  var ss = AdminReset_tryOpenSpreadsheetByProp_(props, CLIENTS_PROP_SPREADSHEET_ID);
  if (!ss) return 0;
  var db = ClientsMaster_getOrCreateSpreadsheet_();
  var headers = ClientsMaster_headers_();
  if (db.sheet.getLastRow() < 1) {
    db.sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    db.sheet.setFrozenRows(1);
    return 0;
  }
  var row = db.sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  var same = true;
  var i;
  for (i = 0; i < headers.length; i++) {
    if (String(row[i] || '') !== headers[i]) {
      same = false;
      break;
    }
  }
  if (!same) {
    db.sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    db.sheet.setFrozenRows(1);
  }
  return AdminReset_clearSheetDataKeepHeader_(db.sheet);
}

/**
 * @param {GoogleAppsScript.Properties.Properties} props
 * @return {number}
 */
function AdminReset_clearAgentApiCatalog_(props) {
  var ss = AdminReset_tryOpenSpreadsheetByProp_(props, _ADMIN_AGENTS_API_CATALOG_SSID_PROP);
  if (!ss) return 0;
  var cat = AdminAgents_getOrCreateApiCatalogSheet_(props);
  return AdminReset_clearSheetDataKeepHeader_(cat.sheet);
}

/**
 * Borra filas de datos en todos los spreadsheets operativos (cabeceras intactas).
 * Excluye la planilla de roles (acceso y permisos).
 * @return {{ok:boolean, cleared:Object, preserved:Array<string>}}
 */
function AdminReset_resetAllSpreadsheetData() {
  AdminAuth_requireAdmin();

  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var props = PropertiesService.getScriptProperties();
    var cleared = {
      contentCatalog: AdminReset_clearContentCatalog_(props),
      metrics: AdminReset_clearMetrics_(props),
      clientsMaster: AdminReset_clearClientsMaster_(props),
      agentApiCatalog: AdminReset_clearAgentApiCatalog_(props),
    };

    return {
      ok: true,
      cleared: cleared,
      preserved: ['roles_spreadsheet', 'script_secrets'],
    };
  } finally {
    lock.releaseLock();
  }
}
