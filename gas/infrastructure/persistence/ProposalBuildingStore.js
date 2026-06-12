/**
 * @fileoverview Sesiones de armado de propuestas en Drive (planilla índice por usuario + session.json).
 * No usa Supabase: índice en Google Sheets bajo Propuestas/_Usuarios/{usuario}/ y payload en _Sesiones/{id}/session.json.
 */

/** @type {number} */
var PROPOSAL_BUILDING_STORE_MAX_LIMIT_ = 100;

/** @type {number} */
var PROPOSAL_BUILDING_STORE_DEFAULT_LIMIT_ = 25;

/** @type {string} */
var PROPOSAL_BUILDING_STORE_USERS_SEGMENT_ = '_Usuarios';

/** @type {string} */
var PROPOSAL_BUILDING_STORE_SESSIONS_SEGMENT_ = '_Sesiones';

/** @type {string} */
var PROPOSAL_BUILDING_STORE_SESSION_JSON_ = 'session.json';

/** @type {string} */
var PROPOSAL_BUILDING_STORE_USER_META_ = '_user_meta.json';

/** @type {string} */
var PROPOSAL_BUILDING_STORE_INDEX_SHEET_ = 'Sesiones';

/** @type {string} */
var PROPOSAL_BUILDING_STORE_SPREADSHEET_TITLE_ = 'Aviators · Mis propuestas';

/** @type {Array<string>} */
var PROPOSAL_BUILDING_STORE_INDEX_HEADERS_ = [
  'session_id',
  'status',
  'builder_step',
  'title',
  'client_name',
  'industry_key',
  'proposal_name',
  'rfp_deadline',
  'commercial_model',
  'project_summary',
  'deck_file_id',
  'deck_file_url',
  'deck_file_name',
  'checklist_file_id',
  'checklist_file_url',
  'checklist_file_name',
  'package_folder_id',
  'package_folder_url',
  'package_folder_name',
  'created_at',
  'updated_at',
  'materials_count',
  'studios_count',
];

/**
 * @param {string} email
 * @return {string}
 */
function ProposalBuildingStore_emailFolderName_(email) {
  return String(email || '')
    .trim()
    .toLowerCase()
    .replace(/@/g, '_at_')
    .replace(/\./g, '_');
}

/**
 * @param {Object} row
 * @return {Object}
 */
function ProposalBuildingStore_rowToSession_(row) {
  row = row || {};
  return {
    sessionId: String(row.sessionId || row.session_id || ''),
    userEmail: String(row.userEmail || row.user_email || ''),
    status: String(row.status || 'in_progress'),
    builderStep: String(row.builderStep || row.builder_step || 'materials'),
    title: String(row.title || ''),
    clientName: String(row.clientName || row.client_name || ''),
    industryKey: String(row.industryKey || row.industry_key || ''),
    proposalName: String(row.proposalName || row.proposal_name || ''),
    rfpDeadline: String(row.rfpDeadline || row.rfp_deadline || ''),
    commercialModel: String(row.commercialModel || row.commercial_model || ''),
    projectSummary: String(row.projectSummary || row.project_summary || ''),
    draftBrief:
      row.draftBrief && typeof row.draftBrief === 'object'
        ? row.draftBrief
        : row.draft_brief_json && typeof row.draft_brief_json === 'object'
          ? row.draft_brief_json
          : {},
    validatedBrief:
      row.validatedBrief && typeof row.validatedBrief === 'object'
        ? row.validatedBrief
        : row.validated_brief_json && typeof row.validated_brief_json === 'object'
          ? row.validated_brief_json
          : null,
    materials: Array.isArray(row.materials)
      ? row.materials
      : Array.isArray(row.materials_json)
        ? row.materials_json
        : [],
    aiResponses: Array.isArray(row.aiResponses)
      ? row.aiResponses
      : Array.isArray(row.ai_responses_json)
        ? row.ai_responses_json
        : [],
    studioRecommendations: Array.isArray(row.studioRecommendations)
      ? row.studioRecommendations
      : Array.isArray(row.studio_recommendations_json)
        ? row.studio_recommendations_json
        : [],
    context:
      row.context && typeof row.context === 'object'
        ? row.context
        : row.context_json && typeof row.context_json === 'object'
          ? row.context_json
          : {},
    deckFileId: String(row.deckFileId || row.deck_file_id || ''),
    deckFileUrl: String(row.deckFileUrl || row.deck_file_url || ''),
    deckFileName: String(row.deckFileName || row.deck_file_name || ''),
    checklistFileId: String(row.checklistFileId || row.checklist_file_id || ''),
    checklistFileUrl: String(row.checklistFileUrl || row.checklist_file_url || ''),
    checklistFileName: String(row.checklistFileName || row.checklist_file_name || ''),
    packageFolderId: String(row.packageFolderId || row.package_folder_id || ''),
    packageFolderUrl: String(row.packageFolderUrl || row.package_folder_url || ''),
    packageFolderName: String(row.packageFolderName || row.package_folder_name || ''),
    createdAt: String(row.createdAt || row.created_at || ''),
    updatedAt: String(row.updatedAt || row.updated_at || ''),
  };
}

/**
 * @param {Object} session
 * @return {Array<string>}
 */
function ProposalBuildingStore_indexRowFromSession_(session) {
  session = ProposalBuildingStore_rowToSession_(session);
  var materials = Array.isArray(session.materials) ? session.materials : [];
  var studios = Array.isArray(session.studioRecommendations) ? session.studioRecommendations : [];
  return [
    session.sessionId,
    session.status,
    session.builderStep,
    session.title,
    session.clientName,
    session.industryKey,
    session.proposalName,
    session.rfpDeadline,
    session.commercialModel,
    String(session.projectSummary || '').slice(0, 500),
    session.deckFileId,
    session.deckFileUrl,
    session.deckFileName,
    session.checklistFileId,
    session.checklistFileUrl,
    session.checklistFileName,
    session.packageFolderId,
    session.packageFolderUrl,
    session.packageFolderName,
    session.createdAt,
    session.updatedAt,
    String(materials.length),
    String(studios.length),
  ];
}

/**
 * @param {Array<*>} row
 * @return {Object}
 */
function ProposalBuildingStore_indexRowToSummary_(row) {
  row = row || [];
  return {
    sessionId: String(row[0] || ''),
    status: String(row[1] || 'in_progress'),
    builderStep: String(row[2] || 'materials'),
    title: String(row[3] || ''),
    clientName: String(row[4] || ''),
    industryKey: String(row[5] || ''),
    proposalName: String(row[6] || ''),
    rfpDeadline: String(row[7] || ''),
    commercialModel: String(row[8] || ''),
    projectSummary: String(row[9] || ''),
    deckFileId: String(row[10] || ''),
    deckFileUrl: String(row[11] || ''),
    deckFileName: String(row[12] || ''),
    checklistFileId: String(row[13] || ''),
    checklistFileUrl: String(row[14] || ''),
    checklistFileName: String(row[15] || ''),
    packageFolderId: String(row[16] || ''),
    packageFolderUrl: String(row[17] || ''),
    packageFolderName: String(row[18] || ''),
    createdAt: String(row[19] || ''),
    updatedAt: String(row[20] || ''),
    materialsCount: Number(row[21] || 0),
    studiosCount: Number(row[22] || 0),
  };
}

/**
 * @param {string} email
 * @return {GoogleAppsScript.Drive.Folder}
 */
function ProposalBuildingStore_getUserDriveFolder_(email) {
  var em = String(email || '').trim();
  if (!em) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_proposal_building_forbidden'));
  }
  var proposalsRoot = ProposalBuilding_getProposalsDriveFolder_();
  var usersRoot = ProposalBuilding_getOrCreateChildFolder_(
    proposalsRoot,
    PROPOSAL_BUILDING_STORE_USERS_SEGMENT_,
  );
  return ProposalBuilding_getOrCreateChildFolder_(
    usersRoot,
    ProposalBuildingStore_emailFolderName_(em),
  );
}

/**
 * @param {GoogleAppsScript.Drive.Folder} userFolder
 * @return {Object|null}
 */
function ProposalBuildingStore_readUserMeta_(userFolder) {
  if (!userFolder) return null;
  var it = userFolder.getFilesByName(PROPOSAL_BUILDING_STORE_USER_META_);
  if (!it.hasNext()) return null;
  try {
    return JSON.parse(it.next().getBlob().getDataAsString('UTF-8'));
  } catch (ignore) {
    return null;
  }
}

/**
 * @param {GoogleAppsScript.Drive.Folder} userFolder
 * @param {Object} meta
 */
function ProposalBuildingStore_writeUserMeta_(userFolder, meta) {
  var json = JSON.stringify(meta || {});
  var it = userFolder.getFilesByName(PROPOSAL_BUILDING_STORE_USER_META_);
  while (it.hasNext()) {
    it.next().setTrashed(true);
  }
  userFolder.createFile(PROPOSAL_BUILDING_STORE_USER_META_, json, MimeType.PLAIN_TEXT);
}

/**
 * @param {string} email
 * @return {GoogleAppsScript.Spreadsheet.Spreadsheet}
 */
function ProposalBuildingStore_ensureUserSpreadsheet_(email) {
  var em = String(email || '').trim();
  var userFolder = ProposalBuildingStore_getUserDriveFolder_(em);
  var meta = ProposalBuildingStore_readUserMeta_(userFolder);
  if (meta && meta.spreadsheetId) {
    try {
      return SpreadsheetApp.openById(String(meta.spreadsheetId));
    } catch (ignoreOpen) {}
  }

  var ss = SpreadsheetApp.create(PROPOSAL_BUILDING_STORE_SPREADSHEET_TITLE_);
  var ssId = String(ss.getId() || '');
  var ssFile = DriveApp.getFileById(ssId);
  ssFile.moveTo(userFolder);

  var sheet = ss.getSheets()[0];
  sheet.setName(PROPOSAL_BUILDING_STORE_INDEX_SHEET_);
  sheet.getRange(1, 1, 1, PROPOSAL_BUILDING_STORE_INDEX_HEADERS_.length).setValues([
    PROPOSAL_BUILDING_STORE_INDEX_HEADERS_,
  ]);
  sheet.getRange(1, 1, 1, PROPOSAL_BUILDING_STORE_INDEX_HEADERS_.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
  SpreadsheetApp.flush();

  ProposalBuildingStore_writeUserMeta_(userFolder, {
    email: em,
    spreadsheetId: ssId,
    createdAt: new Date().toISOString(),
  });
  return ss;
}

/**
 * @param {string} email
 * @return {GoogleAppsScript.Spreadsheet.Sheet}
 */
function ProposalBuildingStore_getIndexSheet_(email) {
  var ss = ProposalBuildingStore_ensureUserSpreadsheet_(email);
  var sheet = ss.getSheetByName(PROPOSAL_BUILDING_STORE_INDEX_SHEET_);
  if (!sheet) {
    sheet = ss.insertSheet(PROPOSAL_BUILDING_STORE_INDEX_SHEET_);
    sheet.getRange(1, 1, 1, PROPOSAL_BUILDING_STORE_INDEX_HEADERS_.length).setValues([
      PROPOSAL_BUILDING_STORE_INDEX_HEADERS_,
    ]);
    sheet.getRange(1, 1, 1, PROPOSAL_BUILDING_STORE_INDEX_HEADERS_.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * @param {string} email
 * @return {Array<Array<*>>}
 */
function ProposalBuildingStore_readIndexDataRows_(email) {
  var sheet = ProposalBuildingStore_getIndexSheet_(email);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var width = PROPOSAL_BUILDING_STORE_INDEX_HEADERS_.length;
  return sheet.getRange(2, 1, lastRow, width).getValues();
}

/**
 * @param {string} email
 * @param {string} sessionId
 * @return {number} 0 si no existe
 */
function ProposalBuildingStore_findIndexRowNumber_(email, sessionId) {
  var sid = String(sessionId || '').trim();
  if (!sid) return 0;
  var rows = ProposalBuildingStore_readIndexDataRows_(email);
  var i;
  for (i = 0; i < rows.length; i++) {
    if (String(rows[i][0] || '').trim() === sid) return i + 2;
  }
  return 0;
}

/**
 * @param {string} email
 * @param {Object} session
 */
function ProposalBuildingStore_upsertIndexRow_(email, session) {
  var sheet = ProposalBuildingStore_getIndexSheet_(email);
  var rowValues = ProposalBuildingStore_indexRowFromSession_(session);
  var rowNum = ProposalBuildingStore_findIndexRowNumber_(email, session.sessionId);
  if (rowNum > 0) {
    sheet.getRange(rowNum, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
  SpreadsheetApp.flush();
}

/**
 * @param {string} email
 * @param {string} sessionId
 */
function ProposalBuildingStore_removeIndexRow_(email, sessionId) {
  var rowNum = ProposalBuildingStore_findIndexRowNumber_(email, sessionId);
  if (rowNum <= 0) return;
  ProposalBuildingStore_getIndexSheet_(email).deleteRow(rowNum);
  SpreadsheetApp.flush();
}

/**
 * @param {string} email
 * @param {string} sessionId
 * @return {GoogleAppsScript.Drive.Folder}
 */
function ProposalBuildingStore_getSessionFolder_(email, sessionId) {
  var sid = String(sessionId || '').trim();
  if (!sid) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'pb_err_session_missing'));
  }
  var userFolder = ProposalBuildingStore_getUserDriveFolder_(email);
  var sessionsRoot = ProposalBuilding_getOrCreateChildFolder_(
    userFolder,
    PROPOSAL_BUILDING_STORE_SESSIONS_SEGMENT_,
  );
  return ProposalBuilding_getOrCreateChildFolder_(sessionsRoot, sid);
}

/**
 * @param {GoogleAppsScript.Drive.Folder} sessionFolder
 * @return {Object|null}
 */
function ProposalBuildingStore_readSessionJson_(sessionFolder) {
  if (!sessionFolder) return null;
  var it = sessionFolder.getFilesByName(PROPOSAL_BUILDING_STORE_SESSION_JSON_);
  if (!it.hasNext()) return null;
  try {
    var parsed = JSON.parse(it.next().getBlob().getDataAsString('UTF-8'));
    return ProposalBuildingStore_rowToSession_(parsed);
  } catch (ignore) {
    return null;
  }
}

/**
 * @param {GoogleAppsScript.Drive.Folder} sessionFolder
 * @param {Object} session
 */
function ProposalBuildingStore_writeSessionJson_(sessionFolder, session) {
  var payload = ProposalBuildingStore_rowToSession_(session);
  var json = JSON.stringify(payload);
  var it = sessionFolder.getFilesByName(PROPOSAL_BUILDING_STORE_SESSION_JSON_);
  while (it.hasNext()) {
    it.next().setTrashed(true);
  }
  sessionFolder.createFile(PROPOSAL_BUILDING_STORE_SESSION_JSON_, json, MimeType.PLAIN_TEXT);
}

/**
 * Sesiones para métricas admin (lee índices en Drive de todos los usuarios).
 * @return {Array<Object>}
 */
function ProposalBuildingStore_listAllForMetrics() {
  var out = [];
  try {
    var proposalsRoot = ProposalBuilding_getProposalsDriveFolder_();
    var usersRoot = ProposalBuilding_getOrCreateChildFolder_(
      proposalsRoot,
      PROPOSAL_BUILDING_STORE_USERS_SEGMENT_,
    );
    var userFolders = usersRoot.getFolders();
    while (userFolders.hasNext()) {
      var userFolder = userFolders.next();
      var meta = ProposalBuildingStore_readUserMeta_(userFolder);
      var email = meta && meta.email ? String(meta.email).trim() : '';
      if (!email) continue;
      var rows = ProposalBuildingStore_readIndexDataRows_(email);
      var i;
      for (i = 0; i < rows.length; i++) {
        var summary = ProposalBuildingStore_indexRowToSummary_(rows[i]);
        if (!summary.sessionId) continue;
        out.push({
          session_id: summary.sessionId,
          status: summary.status,
          created_at: summary.createdAt,
          updated_at: summary.updatedAt,
          user_email: email,
          client_name: summary.clientName,
        });
      }
    }
  } catch (eMetrics) {
    Logger.log(
      '[ProposalBuildingStore_listAllForMetrics] ' +
        (eMetrics && eMetrics.message ? eMetrics.message : eMetrics),
    );
  }
  return out;
}

/** @const {Object<string, string>} */
var PROPOSAL_BUILDING_STORE_STATUS_FILTERS_ = {
  all: '',
  in_progress: 'in_progress',
  completed: 'completed',
  failed: 'failed',
};

/**
 * @param {string} statusFilter
 * @return {string}
 */
function ProposalBuildingStore_resolveStatusFilter_(statusFilter) {
  var key = String(statusFilter || 'all').trim().toLowerCase();
  return PROPOSAL_BUILDING_STORE_STATUS_FILTERS_[key] != null
    ? PROPOSAL_BUILDING_STORE_STATUS_FILTERS_[key]
    : '';
}

/**
 * @param {string} statusFilter
 * @return {string}
 */
function ProposalBuildingStore_normalizeStatusFilterKey_(statusFilter) {
  var key = String(statusFilter || 'all').trim().toLowerCase();
  return PROPOSAL_BUILDING_STORE_STATUS_FILTERS_[key] != null ? key : 'all';
}

/** @const {Object<string, string>} */
var PROPOSAL_BUILDING_STORE_BUILDER_STEP_FILTERS_ = {
  '': '',
  materials: 'materials',
  brief: 'brief',
  studios: 'studios',
  success_cases: 'success_cases',
  configure: 'configure',
  building: 'building',
};

/** @const {Object<string, string>} */
var PROPOSAL_BUILDING_STORE_INDUSTRY_FILTERS_ = {
  '': '',
  logistica: 'Logistica',
  aerolineas: 'Aerolineas',
};

/** @const {Object<string, string>} */
var PROPOSAL_BUILDING_STORE_DELIVERABLES_FILTERS_ = {
  '': '',
  any: 'any',
  deck: 'deck',
  package: 'package',
  none: 'none',
};

/**
 * @param {string=} statusFilter
 * @param {Object|string=} filtersJson
 * @return {{status:string,industry:string,builderStep:string,deliverables:string,query:string}}
 */
function ProposalBuildingStore_normalizeListFilters_(statusFilter, filtersJson) {
  var raw = {};
  if (typeof filtersJson === 'string' && filtersJson) {
    try {
      raw = JSON.parse(filtersJson);
    } catch (ignore) {
      raw = {};
    }
  } else if (filtersJson && typeof filtersJson === 'object') {
    raw = filtersJson;
  }
  var statusKey = ProposalBuildingStore_normalizeStatusFilterKey_(raw.status || statusFilter);
  var industryRaw = String(raw.industry || '')
    .trim()
    .toLowerCase();
  var industry = PROPOSAL_BUILDING_STORE_INDUSTRY_FILTERS_[industryRaw] || '';
  if (industry !== 'Logistica' && industry !== 'Aerolineas') {
    industry =
      raw.industry === 'Logistica' || raw.industry === 'Aerolineas' ? String(raw.industry) : '';
  }
  var stepRaw = String(raw.builderStep || raw.step || '')
    .trim()
    .toLowerCase();
  var builderStep = PROPOSAL_BUILDING_STORE_BUILDER_STEP_FILTERS_[stepRaw] || '';
  var deliverablesRaw = String(raw.deliverables || '')
    .trim()
    .toLowerCase();
  var deliverables = PROPOSAL_BUILDING_STORE_DELIVERABLES_FILTERS_[deliverablesRaw] || '';
  var query = String(raw.query || raw.q || '')
    .trim()
    .slice(0, 120);
  return {
    status: statusKey,
    industry: industry,
    builderStep: builderStep,
    deliverables: deliverables,
    query: query,
  };
}

/**
 * @param {Object} summary
 * @param {Object} filters
 * @return {boolean}
 */
function ProposalBuildingStore_summaryMatchesFilters_(summary, filters) {
  filters = filters || {};
  var status = ProposalBuildingStore_resolveStatusFilter_(filters.status);
  if (status && String(summary.status || '') !== status) return false;
  if (filters.industry && String(summary.industryKey || '') !== filters.industry) return false;
  if (filters.builderStep && String(summary.builderStep || '') !== filters.builderStep) return false;

  var deliverables = String(filters.deliverables || '').trim().toLowerCase();
  if (deliverables === 'deck' && !String(summary.deckFileId || '').trim()) return false;
  if (deliverables === 'package' && !String(summary.packageFolderId || '').trim()) return false;
  if (deliverables === 'any') {
    if (
      !String(summary.deckFileId || '').trim() &&
      !String(summary.packageFolderId || '').trim()
    ) {
      return false;
    }
  }
  if (deliverables === 'none') {
    if (
      String(summary.deckFileId || '').trim() ||
      String(summary.packageFolderId || '').trim()
    ) {
      return false;
    }
  }

  var q = String(filters.query || '')
    .trim()
    .toLowerCase();
  if (q) {
    var hay =
      String(summary.clientName || '').toLowerCase() +
      ' ' +
      String(summary.proposalName || '').toLowerCase() +
      ' ' +
      String(summary.title || '').toLowerCase() +
      ' ' +
      String(summary.projectSummary || '').toLowerCase();
    if (hay.indexOf(q) < 0) return false;
  }
  return true;
}

/** @const {Object<string, string>} */
var PROPOSAL_BUILDING_STORE_SORT_COLUMNS_ = {
  client: 'clientName',
  proposal: 'proposalName',
  industry: 'industryKey',
  status: 'status',
  deadline: 'rfpDeadline',
  updated: 'updatedAt',
};

/**
 * @param {string} sortBy
 * @return {string}
 */
function ProposalBuildingStore_resolveSortColumn_(sortBy) {
  var key = String(sortBy || '').trim().toLowerCase();
  return PROPOSAL_BUILDING_STORE_SORT_COLUMNS_[key] || PROPOSAL_BUILDING_STORE_SORT_COLUMNS_.updated;
}

/**
 * @param {string} sortDir
 * @return {string}
 */
function ProposalBuildingStore_resolveSortDirection_(sortDir) {
  return String(sortDir || '').trim().toLowerCase() === 'asc' ? 'asc' : 'desc';
}

/**
 * @param {Array<Object>} items
 * @param {string} sortBy
 * @param {string} sortDir
 * @return {Array<Object>}
 */
function ProposalBuildingStore_sortSummaries_(items, sortBy, sortDir) {
  var col = ProposalBuildingStore_resolveSortColumn_(sortBy);
  var dir = ProposalBuildingStore_resolveSortDirection_(sortDir);
  var sorted = (items || []).slice();
  sorted.sort(function (a, b) {
    var av = String((a && a[col]) || '');
    var bv = String((b && b[col]) || '');
    if (col === 'updatedAt' || col === 'rfpDeadline') {
      var cmp = av.localeCompare(bv);
      return dir === 'asc' ? cmp : -cmp;
    }
    var cmp2 = av.localeCompare(bv, undefined, { sensitivity: 'base' });
    return dir === 'asc' ? cmp2 : -cmp2;
  });
  return sorted;
}

/**
 * @param {string} email
 * @param {Object|string=} filters
 * @return {number}
 */
function ProposalBuildingStore_countByUser(email, filters) {
  var em = String(email || '').trim();
  if (!em) return 0;
  var normalized =
    typeof filters === 'string'
      ? ProposalBuildingStore_normalizeListFilters_(filters, null)
      : ProposalBuildingStore_normalizeListFilters_(filters && filters.status, filters);
  var rows = ProposalBuildingStore_readIndexDataRows_(em);
  var count = 0;
  var i;
  for (i = 0; i < rows.length; i++) {
    var summary = ProposalBuildingStore_indexRowToSummary_(rows[i]);
    if (ProposalBuildingStore_summaryMatchesFilters_(summary, normalized)) count++;
  }
  return count;
}

/**
 * @param {string} email
 * @param {number} skip
 * @param {number} limit
 * @param {string=} sortBy
 * @param {string=} sortDir
 * @param {Object|string=} filters
 * @return {Array<Object>}
 */
function ProposalBuildingStore_listByUser(email, skip, limit, sortBy, sortDir, filters) {
  var em = String(email || '').trim();
  if (!em) return [];
  var s = Math.max(0, Number(skip) || 0);
  var lim = Math.min(
    PROPOSAL_BUILDING_STORE_MAX_LIMIT_,
    Math.max(1, Number(limit) || PROPOSAL_BUILDING_STORE_DEFAULT_LIMIT_),
  );
  var normalized =
    typeof filters === 'string'
      ? ProposalBuildingStore_normalizeListFilters_(filters, null)
      : ProposalBuildingStore_normalizeListFilters_(filters && filters.status, filters);
  var rows = ProposalBuildingStore_readIndexDataRows_(em);
  var summaries = [];
  var i;
  for (i = 0; i < rows.length; i++) {
    var summary = ProposalBuildingStore_indexRowToSummary_(rows[i]);
    if (!summary.sessionId) continue;
    if (!ProposalBuildingStore_summaryMatchesFilters_(summary, normalized)) continue;
    summaries.push(summary);
  }
  summaries = ProposalBuildingStore_sortSummaries_(summaries, sortBy, sortDir);
  var page = summaries.slice(s, s + lim);
  var out = [];
  for (i = 0; i < page.length; i++) {
    var item = page[i];
    var summarySession = ProposalBuildingStore_rowToSession_({
      sessionId: item.sessionId,
      userEmail: em,
      status: item.status,
      builderStep: item.builderStep,
      title: item.title,
      clientName: item.clientName,
      industryKey: item.industryKey,
      proposalName: item.proposalName,
      rfpDeadline: item.rfpDeadline,
      commercialModel: item.commercialModel,
      projectSummary: item.projectSummary,
      deckFileId: item.deckFileId,
      deckFileUrl: item.deckFileUrl,
      deckFileName: item.deckFileName,
      checklistFileId: item.checklistFileId,
      checklistFileUrl: item.checklistFileUrl,
      checklistFileName: item.checklistFileName,
      packageFolderId: item.packageFolderId,
      packageFolderUrl: item.packageFolderUrl,
      packageFolderName: item.packageFolderName,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      materials: [],
      studioRecommendations: [],
    });
    summarySession.materialsCount = item.materialsCount;
    summarySession.studiosCount = item.studiosCount;
    out.push(summarySession);
  }
  return out;
}

/**
 * @param {string} sessionId
 * @param {string} email
 * @return {Object|null}
 */
function ProposalBuildingStore_getByIdForUser(sessionId, email) {
  var sid = String(sessionId || '').trim();
  var em = String(email || '').trim();
  if (!sid || !em) return null;
  var sessionFolder = ProposalBuildingStore_getSessionFolder_(em, sid);
  return ProposalBuildingStore_readSessionJson_(sessionFolder);
}

/**
 * @param {string} email
 * @param {Object=} seed
 * @return {Object}
 */
function ProposalBuildingStore_create(email, seed) {
  var em = String(email || '').trim();
  if (!em) throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_proposal_building_forbidden'));
  seed = seed && typeof seed === 'object' ? seed : {};
  var nowIso = new Date().toISOString();
  var sessionId = Utilities.getUuid();
  var session = ProposalBuildingStore_rowToSession_({
    sessionId: sessionId,
    userEmail: em,
    status: String(seed.status || 'in_progress'),
    builderStep: String(seed.builderStep || 'materials'),
    title: String(seed.title || ''),
    clientName: String(seed.clientName || ''),
    industryKey: String(seed.industryKey || ''),
    proposalName: String(seed.proposalName || ''),
    rfpDeadline: String(seed.rfpDeadline || ''),
    commercialModel: String(seed.commercialModel || ''),
    projectSummary: String(seed.projectSummary || ''),
    draftBrief: seed.draftBrief,
    validatedBrief: seed.validatedBrief,
    materials: seed.materials,
    aiResponses: seed.aiResponses,
    studioRecommendations: seed.studioRecommendations,
    context: seed.context,
    deckFileId: seed.deckFileId,
    deckFileUrl: seed.deckFileUrl,
    deckFileName: seed.deckFileName,
    checklistFileId: seed.checklistFileId,
    checklistFileUrl: seed.checklistFileUrl,
    checklistFileName: seed.checklistFileName,
    packageFolderId: seed.packageFolderId,
    packageFolderUrl: seed.packageFolderUrl,
    packageFolderName: seed.packageFolderName,
    createdAt: nowIso,
    updatedAt: nowIso,
  });
  var sessionFolder = ProposalBuildingStore_getSessionFolder_(em, sessionId);
  ProposalBuildingStore_writeSessionJson_(sessionFolder, session);
  ProposalBuildingStore_upsertIndexRow_(em, session);
  return session;
}

/**
 * @param {string} sessionId
 * @param {string} email
 * @param {Object} patch
 * @return {Object|null}
 */
function ProposalBuildingStore_updateForUser(sessionId, email, patch) {
  var sid = String(sessionId || '').trim();
  var em = String(email || '').trim();
  if (!sid || !em) return null;
  patch = patch && typeof patch === 'object' ? patch : {};
  var session = ProposalBuildingStore_getByIdForUser(sid, em);
  if (!session) return null;

  if (patch.status != null) session.status = String(patch.status || 'in_progress');
  if (patch.builderStep != null) session.builderStep = String(patch.builderStep || 'materials');
  if (patch.title != null) session.title = String(patch.title || '');
  if (patch.clientName != null) session.clientName = String(patch.clientName || '');
  if (patch.industryKey != null) session.industryKey = String(patch.industryKey || '');
  if (patch.proposalName != null) session.proposalName = String(patch.proposalName || '');
  if (patch.rfpDeadline != null) session.rfpDeadline = String(patch.rfpDeadline || '');
  if (patch.commercialModel != null) session.commercialModel = String(patch.commercialModel || '');
  if (patch.projectSummary != null) session.projectSummary = String(patch.projectSummary || '');
  if (patch.draftBrief != null) session.draftBrief = patch.draftBrief;
  if (patch.validatedBrief !== undefined) session.validatedBrief = patch.validatedBrief;
  if (patch.materials != null) session.materials = patch.materials;
  if (patch.aiResponses != null) session.aiResponses = patch.aiResponses;
  if (patch.studioRecommendations != null) session.studioRecommendations = patch.studioRecommendations;
  if (patch.context != null) session.context = patch.context;
  if (patch.deckFileId != null) session.deckFileId = String(patch.deckFileId || '');
  if (patch.deckFileUrl != null) session.deckFileUrl = String(patch.deckFileUrl || '');
  if (patch.deckFileName != null) session.deckFileName = String(patch.deckFileName || '');
  if (patch.checklistFileId != null) session.checklistFileId = String(patch.checklistFileId || '');
  if (patch.checklistFileUrl != null) session.checklistFileUrl = String(patch.checklistFileUrl || '');
  if (patch.checklistFileName != null) session.checklistFileName = String(patch.checklistFileName || '');
  if (patch.packageFolderId != null) session.packageFolderId = String(patch.packageFolderId || '');
  if (patch.packageFolderUrl != null) session.packageFolderUrl = String(patch.packageFolderUrl || '');
  if (patch.packageFolderName != null) session.packageFolderName = String(patch.packageFolderName || '');
  session.updatedAt = new Date().toISOString();

  var sessionFolder = ProposalBuildingStore_getSessionFolder_(em, sid);
  ProposalBuildingStore_writeSessionJson_(sessionFolder, session);
  ProposalBuildingStore_upsertIndexRow_(em, session);
  return session;
}

/**
 * @param {string} sessionId
 * @param {string} email
 * @return {boolean}
 */
function ProposalBuildingStore_deleteForUser(sessionId, email) {
  var sid = String(sessionId || '').trim();
  var em = String(email || '').trim();
  if (!sid || !em) return false;
  try {
    ProposalBuildingStore_removeIndexRow_(em, sid);
    var sessionFolder = ProposalBuildingStore_getSessionFolder_(em, sid);
    sessionFolder.setTrashed(true);
  } catch (ignore) {
    return false;
  }
  return true;
}
