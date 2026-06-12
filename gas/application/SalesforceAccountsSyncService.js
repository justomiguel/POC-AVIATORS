/**
 * @fileoverview Sync semanal del roster Salesforce (Google Sheets → Supabase + catálogo + clientes).
 */

var SALESFORCE_ACCOUNTS_SHEET_DATA = 'Sheet1';
var SALESFORCE_ACCOUNTS_SHEET_EVENTS = 'Automatic Operations Events Log';
var SALESFORCE_ACCOUNTS_SYNC_ACTOR = 'salesforce-sync';
var SALESFORCE_ACCOUNTS_CONTENT_PROFILE = 'aviators-clients';

/** Cuentas por lote al indexar embeddings (manual con progreso en UI). */
var SALESFORCE_ACCOUNTS_EMBEDDING_BATCH_SIZE = 8;

/** Presupuesto de tiempo por ejecución de trigger (ms); margen bajo el límite ~6 min de GAS. */
var SALESFORCE_ACCOUNTS_EMBEDDING_AUTO_MAX_MS_ = 270000;

/** Presupuesto para alinear grafo de conocimiento tras SF sync / embeddings. */
var SALESFORCE_ACCOUNTS_KG_CATCHUP_MAX_MS_ = 120000;

/** Minutos entre ejecuciones encadenadas si la cola de embeddings no terminó. */
var SALESFORCE_ACCOUNTS_EMBEDDING_CONTINUATION_MINUTES_ = 2;

var SALESFORCE_ACCOUNTS_EMB_QUEUE_CACHE_KEY_ = 'sf_sync_emb_queue_v1';

var SALESFORCE_ACCOUNTS_EMB_OFFSET_CACHE_KEY_ = 'sf_sync_emb_offset_v1';

var SALESFORCE_ACCOUNTS_EMB_QUEUE_CACHE_SEC_ = 21600;

var SALESFORCE_ACCOUNTS_EMB_CONT_HANDLER_ = 'SalesforceAccounts_embeddingsContinuationJob_';

/** @type {Object<string, number>} */
var SALESFORCE_ACCOUNTS_COL_ = {
  ACCOUNT_OWNER: 0,
  ACCOUNT_NAME: 1,
  PORTFOLIO: 2,
  TYPE: 3,
  ACCOUNT_TYPE: 4,
  ACCOUNT_LABELS: 5,
  DATE_LAST_OPTY: 6,
  LAST_OPP_WON: 7,
  FIRST_OPP_WON: 8,
  LAST_WORKED_OPP: 9,
  INDUSTRY: 10,
  SUB_INDUSTRY: 11,
};

/**
 * Prompt por defecto del agente clients (registry + migración suave).
 * @return {string}
 */
function SalesforceAccounts_defaultClientsAgentPrompt_() {
  return PromptCatalog_getTemplate('agents.clients.system');
}

/**
 * @param {string} urlOrId
 * @return {string}
 */
function SalesforceAccounts_parseSpreadsheetId_(urlOrId) {
  var raw = String(urlOrId || '').trim();
  if (!raw) return '';
  var m = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/.exec(raw);
  if (m && m[1]) return m[1];
  if (/^[a-zA-Z0-9-_]{20,}$/.test(raw)) return raw;
  return '';
}

/**
 * @return {string}
 */
function SalesforceAccounts_requireSpreadsheetId_() {
  var id = SalesforceAccounts_parseSpreadsheetId_(
    AviatorsConfig_scriptProp_(AVIATORS_PROP.SALESFORCE_ACCOUNTS_SPREADSHEET_ID),
  );
  if (!id) {
    AviatorsError_throw_(
      'ERR_SALESFORCE_SHEET_NOT_CONFIGURED',
      'SalesforceAccounts_requireSpreadsheetId_',
    );
  }
  return id;
}

/**
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss
 * @param {string} name
 * @return {GoogleAppsScript.Spreadsheet.Sheet}
 */
function SalesforceAccounts_getSheetByName_(ss, name) {
  var sh = ss.getSheetByName(name);
  if (!sh) {
    throw new Error('Pestaña no encontrada: ' + name);
  }
  return sh;
}

/**
 * @param {*} value
 * @return {string}
 */
function SalesforceAccounts_cellToString_(value) {
  if (value == null || value === '') return '';
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return value.toISOString();
  }
  return String(value).trim();
}

/**
 * @param {*} value
 * @return {string}
 */
function SalesforceAccounts_cellToIsoDate_(value) {
  if (value == null || value === '') return '';
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return value.toISOString();
  }
  var n = Number(value);
  if (!isNaN(n) && n > 20000 && n < 60000) {
    var ms = Math.round((n - 25569) * 86400 * 1000);
    return new Date(ms).toISOString();
  }
  var parsed = Date.parse(String(value));
  if (!isNaN(parsed)) return new Date(parsed).toISOString();
  return '';
}

/**
 * @param {string} name
 * @return {string}
 */
function SalesforceAccounts_accountKey_(name) {
  return ClientsMaster_normalizeName_(name);
}

/**
 * @param {Object} account
 * @return {string}
 */
function SalesforceAccounts_rowHash_(account) {
  var body = JSON.stringify(account);
  var digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.MD5,
    body,
    Utilities.Charset.UTF_8,
  );
  var hex = [];
  var i;
  for (i = 0; i < digest.length; i++) {
    hex.push(('0' + (digest[i] & 0xff).toString(16)).slice(-2));
  }
  return hex.join('');
}

/**
 * @param {Array<*>} row
 * @return {Object|null}
 */
function SalesforceAccounts_parseDataRow_(row) {
  var accountName = SalesforceAccounts_cellToString_(row[SALESFORCE_ACCOUNTS_COL_.ACCOUNT_NAME]);
  if (!accountName) return null;
  return {
    account_name: accountName,
    account_owner: SalesforceAccounts_cellToString_(row[SALESFORCE_ACCOUNTS_COL_.ACCOUNT_OWNER]),
    portfolio: SalesforceAccounts_cellToString_(row[SALESFORCE_ACCOUNTS_COL_.PORTFOLIO]),
    account_status: SalesforceAccounts_cellToString_(row[SALESFORCE_ACCOUNTS_COL_.TYPE]),
    account_type: SalesforceAccounts_cellToString_(row[SALESFORCE_ACCOUNTS_COL_.ACCOUNT_TYPE]),
    account_labels: SalesforceAccounts_cellToString_(row[SALESFORCE_ACCOUNTS_COL_.ACCOUNT_LABELS]),
    date_last_opty_created: SalesforceAccounts_cellToIsoDate_(
      row[SALESFORCE_ACCOUNTS_COL_.DATE_LAST_OPTY],
    ),
    last_opportunity_won: SalesforceAccounts_cellToIsoDate_(
      row[SALESFORCE_ACCOUNTS_COL_.LAST_OPP_WON],
    ),
    first_opportunity_won: SalesforceAccounts_cellToIsoDate_(
      row[SALESFORCE_ACCOUNTS_COL_.FIRST_OPP_WON],
    ),
    last_worked_opportunity_date: SalesforceAccounts_cellToIsoDate_(
      row[SALESFORCE_ACCOUNTS_COL_.LAST_WORKED_OPP],
    ),
    industry: SalesforceAccounts_cellToString_(row[SALESFORCE_ACCOUNTS_COL_.INDUSTRY]),
    sub_industry: SalesforceAccounts_cellToString_(row[SALESFORCE_ACCOUNTS_COL_.SUB_INDUSTRY]),
  };
}

/**
 * @param {string} iso
 * @param {string} locale
 * @return {string}
 */
function SalesforceAccounts_formatDateForSummary_(iso, locale) {
  if (!iso) return '';
  try {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'es', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(d);
  } catch (ignore) {
    return iso.slice(0, 10);
  }
}

/**
 * @param {Object} account
 * @param {boolean} isActive
 * @return {string}
 */
function SalesforceAccounts_buildSummary_(account, isActive) {
  var loc = 'es';
  var lines = [];
  lines.push('Salesforce Airlines Accounts roster.');
  if (!isActive) {
    lines.push(
      'Status: historical — account no longer appears in the latest Salesforce export.',
    );
  }
  lines.push('Account: ' + account.account_name);
  if (account.account_owner) {
    lines.push('Account Owner / Client Partner / Vendedor: ' + account.account_owner);
  }
  if (account.portfolio) lines.push('Portfolio: ' + account.portfolio);
  if (account.account_status) lines.push('Client status: ' + account.account_status);
  if (account.account_type) lines.push('Account type: ' + account.account_type);
  if (account.account_labels) lines.push('Labels: ' + account.account_labels);
  if (account.industry) lines.push('Industry: ' + account.industry);
  if (account.sub_industry && account.sub_industry !== account.industry) {
    lines.push('Sub-industry: ' + account.sub_industry);
  }
  var d1 = SalesforceAccounts_formatDateForSummary_(account.date_last_opty_created, loc);
  if (d1) lines.push('Date of last opportunity created: ' + d1);
  var d2 = SalesforceAccounts_formatDateForSummary_(account.last_opportunity_won, loc);
  if (d2) lines.push('Last opportunity won: ' + d2);
  var d3 = SalesforceAccounts_formatDateForSummary_(account.first_opportunity_won, loc);
  if (d3) lines.push('First opportunity won: ' + d3);
  var d4 = SalesforceAccounts_formatDateForSummary_(
    account.last_worked_opportunity_date,
    loc,
  );
  if (d4) lines.push('Last worked opportunity date: ' + d4);
  return lines.join('\n');
}

/**
 * @param {Object} account
 * @return {string}
 */
function SalesforceAccounts_buildTags_(account) {
  var tags = ['#Salesforce', '#AirlinesAccounts'];
  var st = String(account.account_status || '').trim();
  if (st) tags.push('#' + st.replace(/\s+/g, ''));
  return ContentCatalog_tagsToCsv_(tags);
}

/**
 * @param {Object} account
 * @param {string} contentId
 * @param {boolean} isActive
 */
function SalesforceAccounts_upsertCatalogRow_(account, contentId, isActive) {
  var id = String(contentId || '').trim() || Utilities.getUuid();
  var now = new Date().toISOString();
  var prev = ContentCatalogStore_getById(id);
  var prevCreated = prev ? String(prev.created_at || '') : '';
  var summary = SalesforceAccounts_buildSummary_(account, isActive);
  var specificRow = {
    content_id: id,
    account_status: String(account.account_status || '').trim(),
    active_projects: String(account.portfolio || '').trim(),
    health_score: String(account.account_type || '').trim(),
    renewal_date: '',
    notes:
      'Source: Salesforce roster. Owner: ' +
      String(account.account_owner || '').trim() +
      '. Labels: ' +
      String(account.account_labels || '').trim(),
  };
  var commonRow = {
    content_id: id,
    content_type: 'client',
    title: account.account_name,
    summary: summary,
    client_name: account.account_name,
    tags_csv: SalesforceAccounts_buildTags_(account),
    file_name: 'salesforce:' + SalesforceAccounts_accountKey_(account.account_name),
    mime_type: 'application/vnd.aviators.salesforce-roster',
    drive_file_id: '',
    drive_file_url: '',
    globant_profile_name: SALESFORCE_ACCOUNTS_CONTENT_PROFILE,
    globant_document_id: prev ? String(prev.globant_document_id || '').trim() : '',
    uploaded_by: SALESFORCE_ACCOUNTS_SYNC_ACTOR,
    created_at: prevCreated || now,
    updated_at: now,
    search_text: '',
  };
  commonRow.search_text = ContentCatalog_buildSearchText_({
    title: commonRow.title,
    summary: commonRow.summary,
    client_name: commonRow.client_name,
    tags_csv: commonRow.tags_csv,
    content_type: commonRow.content_type,
    file_name: commonRow.file_name,
    specific: specificRow,
  });
  ContentCatalogStore_upsert(commonRow, specificRow);
  return id;
}

/**
 * @param {Object} account
 * @return {{client_id:string, created:boolean}}
 */
function SalesforceAccounts_upsertClientMaster_(account) {
  var notes =
    'Synced from Salesforce Airlines Accounts. Portfolio: ' +
    String(account.portfolio || '').trim() +
    '. Owner: ' +
    String(account.account_owner || '').trim();
  return ClientsMaster_upsertFromSync_({
    client_name: account.account_name,
    industry: String(account.industry || '').trim(),
    sub_industry: String(account.sub_industry || '').trim(),
    main_contact_name: String(account.account_owner || '').trim(),
    notes: notes,
  });
}

/**
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss
 * @return {{lastRow:number, sheetHash:string, accounts:Array<Object>}}
 */
function SalesforceAccounts_readSheet1_(ss) {
  var sheet = SalesforceAccounts_getSheetByName_(ss, SALESFORCE_ACCOUNTS_SHEET_DATA);
  var values = sheet.getDataRange().getValues();
  if (!values || values.length < 2) {
    return { lastRow: 0, sheetHash: '', accounts: [] };
  }
  var accounts = [];
  var r;
  for (r = 1; r < values.length; r++) {
    var parsed = SalesforceAccounts_parseDataRow_(values[r]);
    if (!parsed) continue;
    parsed.account_key = SalesforceAccounts_accountKey_(parsed.account_name);
    accounts.push(parsed);
  }
  var hash = SalesforceAccounts_rowHash_({ accounts: accounts });
  return {
    lastRow: values.length,
    sheetHash: hash,
    accounts: accounts,
  };
}

/**
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss
 * @return {number} última fila (1-based) con Pull data + Completed Successfully en Sheet1
 */
function SalesforceAccounts_latestCompletedEventRow_(ss) {
  var sheet = SalesforceAccounts_getSheetByName_(ss, SALESFORCE_ACCOUNTS_SHEET_EVENTS);
  var values = sheet.getDataRange().getValues();
  if (!values || values.length < 2) return 0;
  var last = 0;
  var r;
  for (r = 1; r < values.length; r++) {
    var eventType = SalesforceAccounts_cellToString_(values[r][1]).toLowerCase();
    var sheetName = SalesforceAccounts_cellToString_(values[r][2]);
    var result = SalesforceAccounts_cellToString_(values[r][3]);
    if (
      eventType === 'pull data' &&
      sheetName === SALESFORCE_ACCOUNTS_SHEET_DATA &&
      result === 'Completed Successfully'
    ) {
      last = r + 1;
    }
  }
  return last;
}

/**
 * @return {Object<string, Object>}
 */
function SalesforceAccounts_buildExistingIndex_() {
  var rows = SalesforceAccountsStore_listAll();
  var map = {};
  var i;
  for (i = 0; i < rows.length; i++) {
    var key = String(rows[i].account_key || '').trim();
    if (key) map[key] = rows[i];
  }
  return map;
}

/**
 * @param {Array<string>} ids
 */
function SalesforceAccounts_storeEmbeddingQueue_(ids) {
  var list = ids || [];
  try {
    CacheService.getScriptCache().put(
      SALESFORCE_ACCOUNTS_EMB_QUEUE_CACHE_KEY_,
      JSON.stringify(list),
      SALESFORCE_ACCOUNTS_EMB_QUEUE_CACHE_SEC_,
    );
    SalesforceAccounts_storeEmbeddingOffset_(0);
  } catch (ignoreCache) {}
}

/**
 * @param {number} offset
 */
function SalesforceAccounts_storeEmbeddingOffset_(offset) {
  try {
    CacheService.getScriptCache().put(
      SALESFORCE_ACCOUNTS_EMB_OFFSET_CACHE_KEY_,
      String(Math.max(0, Number(offset) || 0)),
      SALESFORCE_ACCOUNTS_EMB_QUEUE_CACHE_SEC_,
    );
  } catch (ignoreOff) {}
}

/**
 * @return {number}
 */
function SalesforceAccounts_loadEmbeddingOffset_() {
  try {
    var raw = CacheService.getScriptCache().get(SALESFORCE_ACCOUNTS_EMB_OFFSET_CACHE_KEY_);
    return Math.max(0, Number(raw) || 0);
  } catch (ignoreLoad) {
    return 0;
  }
}

function SalesforceAccounts_clearEmbeddingOffset_() {
  try {
    CacheService.getScriptCache().remove(SALESFORCE_ACCOUNTS_EMB_OFFSET_CACHE_KEY_);
  } catch (ignoreClr) {}
}

/**
 * @return {Array<string>}
 */
function SalesforceAccounts_loadEmbeddingQueue_() {
  try {
    var raw = CacheService.getScriptCache().get(SALESFORCE_ACCOUNTS_EMB_QUEUE_CACHE_KEY_);
    if (!raw) return [];
    var parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (ignoreParse) {
    return [];
  }
}

/**
 * @param {boolean} force
 * @return {{
 *   ok: boolean,
 *   skipped: boolean,
 *   reason: string,
 *   accounts: number,
 *   inactivated: number,
 *   total: number,
 *   embeddingTotal: number
 * }}
 */
function SalesforceAccounts_runSyncData_(force) {
  if (!AviatorsDataBackend_supabaseConfigured_()) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_supabase_not_configured'));
  }
  var ssId = SalesforceAccounts_requireSpreadsheetId_();
  var ss = SpreadsheetApp.openById(ssId);
  var state = SalesforceAccountsSyncStateStore_load_();
  var eventRow = SalesforceAccounts_latestCompletedEventRow_(ss);
  var sheetPayload = SalesforceAccounts_readSheet1_(ss);
  var sheetHash = sheetPayload.sheetHash;

  var shouldSync = !!force;
  if (!shouldSync && eventRow > state.last_event_row) shouldSync = true;
  if (!shouldSync && sheetHash && sheetHash !== state.last_sheet_hash) shouldSync = true;

  if (!shouldSync) {
    SalesforceAccounts_storeEmbeddingQueue_([]);
    return {
      ok: true,
      skipped: true,
      reason: 'no_changes',
      accounts: 0,
      inactivated: 0,
      total: 0,
      embeddingTotal: 0,
    };
  }

  var accounts = sheetPayload.accounts;
  var existingIndex = SalesforceAccounts_buildExistingIndex_();
  var activeKeys = [];
  var upserted = 0;
  var embeddingContentIds = [];
  var i;

  for (i = 0; i < accounts.length; i++) {
    var acc = accounts[i];
    var key = acc.account_key;
    activeKeys.push(key);

    var existing = existingIndex[key] || null;
    var contentId = existing && existing.content_id
      ? String(existing.content_id)
      : Utilities.getUuid();
    var rowPayload = {
      account_key: key,
      account_name: acc.account_name,
      account_owner: acc.account_owner,
      portfolio: acc.portfolio,
      account_status: acc.account_status,
      account_type: acc.account_type,
      account_labels: acc.account_labels,
      date_last_opty_created: acc.date_last_opty_created || null,
      last_opportunity_won: acc.last_opportunity_won || null,
      first_opportunity_won: acc.first_opportunity_won || null,
      last_worked_opportunity_date: acc.last_worked_opportunity_date || null,
      industry: acc.industry,
      sub_industry: acc.sub_industry,
      is_active: true,
    };
    rowPayload.row_hash = SalesforceAccounts_rowHash_(rowPayload);

    var clientRes = SalesforceAccounts_upsertClientMaster_(acc);
    rowPayload.client_id = clientRes.client_id;

    var hashChanged = !existing || String(existing.row_hash || '') !== rowPayload.row_hash;
    if (hashChanged || !existing || !existing.content_id) {
      contentId = SalesforceAccounts_upsertCatalogRow_(acc, contentId, true);
      rowPayload.content_id = contentId;
      if (hashChanged) embeddingContentIds.push(contentId);
    } else {
      rowPayload.content_id = contentId;
    }

    SalesforceAccountsStore_upsert(rowPayload);
    existingIndex[key] = rowPayload;
    upserted++;
  }

  var inactivated = 0;
  var inactiveRows = SalesforceAccountsStore_listAll();
  for (i = 0; i < inactiveRows.length; i++) {
    var inRow = inactiveRows[i];
    var iKey = String(inRow.account_key || '').trim();
    if (!iKey || activeKeys.indexOf(iKey) >= 0) continue;
    if (inRow.is_active === false) continue;
    var inactiveAcc = {
      account_name: String(inRow.account_name || ''),
      account_owner: String(inRow.account_owner || ''),
      portfolio: String(inRow.portfolio || ''),
      account_status: String(inRow.account_status || ''),
      account_type: String(inRow.account_type || ''),
      account_labels: String(inRow.account_labels || ''),
      industry: String(inRow.industry || ''),
      sub_industry: String(inRow.sub_industry || ''),
      date_last_opty_created: inRow.date_last_opty_created || '',
      last_opportunity_won: inRow.last_opportunity_won || '',
      first_opportunity_won: inRow.first_opportunity_won || '',
      last_worked_opportunity_date: inRow.last_worked_opportunity_date || '',
    };
    var cid = String(inRow.content_id || '').trim() || Utilities.getUuid();
    SalesforceAccounts_upsertCatalogRow_(inactiveAcc, cid, false);
    SalesforceAccountsStore_upsert({
      account_key: iKey,
      account_name: inactiveAcc.account_name,
      account_owner: String(inRow.account_owner || ''),
      portfolio: inactiveAcc.portfolio,
      account_status: inactiveAcc.account_status,
      account_type: inactiveAcc.account_type,
      account_labels: inactiveAcc.account_labels,
      date_last_opty_created: inRow.date_last_opty_created || null,
      last_opportunity_won: inRow.last_opportunity_won || null,
      first_opportunity_won: inRow.first_opportunity_won || null,
      last_worked_opportunity_date: inRow.last_worked_opportunity_date || null,
      industry: inactiveAcc.industry,
      sub_industry: inactiveAcc.sub_industry,
      client_id: inRow.client_id || null,
      content_id: cid,
      row_hash: String(inRow.row_hash || ''),
      is_active: false,
      synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    inactivated++;
  }

  SalesforceAccounts_storeEmbeddingQueue_(embeddingContentIds);

  var dedupeStats = null;
  try {
    dedupeStats = ClientsMaster_reconcileDuplicates().stats;
  } catch (eDedupe) {
    console.log('[SF-SYNC] client dedupe: ' + (eDedupe && eDedupe.message ? eDedupe.message : eDedupe));
  }

  var syncMsg =
    'accounts=' +
    upserted +
    ',emb_pending=' +
    embeddingContentIds.length;
  if (dedupeStats && dedupeStats.mergedGroups > 0) {
    syncMsg +=
      ',clients_merged=' +
      dedupeStats.mergedGroups +
      ',clients_removed=' +
      dedupeStats.clientsRemoved;
  }

  SalesforceAccountsSyncStateStore_save_({
    last_event_row: eventRow,
    last_sheet_hash: sheetHash,
    last_sync_at: new Date().toISOString(),
    last_sync_status: 'ok',
    last_sync_message: syncMsg,
    accounts_upserted: upserted,
    accounts_inactivated: inactivated,
  });

  SalesforceAccountsStore_invalidateOwnersCache_();

  try {
    var eki;
    for (eki = 0; eki < embeddingContentIds.length; eki++) {
      try {
        KnowledgeGraph_syncContent_(String(embeddingContentIds[eki] || ''));
      } catch (eKgOne) {
        console.log(
          '[KG] after SF content: ' + String(eKgOne.message || eKgOne).slice(0, 80),
        );
      }
    }
    KnowledgeGraph_pruneOrphanBatch_(0, 15);
  } catch (eKgSf) {
    console.log(
      '[KG] after SF sync: ' + String(eKgSf.message || eKgSf).slice(0, 120),
    );
  }

  return {
    ok: true,
    skipped: false,
    reason: 'synced',
    accounts: upserted,
    inactivated: inactivated,
    total: accounts.length,
    embeddingTotal: embeddingContentIds.length,
    clientDedupe: dedupeStats,
  };
}

/**
 * @param {number} start
 * @param {number} limit
 * @return {{
 *   ok: boolean,
 *   processed: number,
 *   failed: number,
 *   done: number,
 *   total: number,
 *   hasMore: boolean,
 *   errors: Array<string>
 * }}
 */
function SalesforceAccounts_runSyncEmbeddingsBatch_(start, limit) {
  var ids = SalesforceAccounts_loadEmbeddingQueue_();
  var total = ids.length;
  var skip = Math.max(0, Number(start) || 0);
  var size = Math.max(1, Math.min(20, Number(limit) || SALESFORCE_ACCOUNTS_EMBEDDING_BATCH_SIZE));
  var end = Math.min(total, skip + size);
  var processed = 0;
  var failed = 0;
  var errors = [];
  var i;

  for (i = skip; i < end; i++) {
    var cid = String(ids[i] || '').trim();
    if (!cid) continue;
    try {
      ContentEmbedding_refreshForContentId_(cid);
      processed++;
    } catch (eEmb) {
      failed++;
      if (errors.length < 5) {
        errors.push(String(eEmb.message || eEmb).slice(0, 120));
      }
    }
  }

  return {
    ok: true,
    processed: processed,
    failed: failed,
    done: end,
    total: total,
    hasMore: end < total,
    errors: errors,
  };
}

/**
 * @param {number} startOffset
 * @param {number} maxMs
 * @return {{processed:number, failed:number, offset:number, hasMore:boolean, total:number}}
 */
function SalesforceAccounts_drainEmbeddingsWithTimeBudget_(startOffset, maxMs) {
  var budget = Math.max(60000, Number(maxMs) || SALESFORCE_ACCOUNTS_EMBEDDING_AUTO_MAX_MS_);
  var startMs = Date.now();
  var skip = Math.max(0, Number(startOffset) || 0);
  var totalProcessed = 0;
  var totalFailed = 0;
  var hasMore = false;
  var total = 0;

  while (Date.now() - startMs < budget) {
    var batch = SalesforceAccounts_runSyncEmbeddingsBatch_(
      skip,
      SALESFORCE_ACCOUNTS_EMBEDDING_BATCH_SIZE,
    );
    totalProcessed += batch.processed;
    totalFailed += batch.failed;
    skip = batch.done;
    total = batch.total;
    hasMore = batch.hasMore;
    if (!hasMore) break;
  }

  return {
    processed: totalProcessed,
    failed: totalFailed,
    offset: skip,
    hasMore: hasMore,
    total: total,
  };
}

/**
 * @return {boolean}
 */
function SalesforceAccounts_embeddingsContinuationTriggerInstalled_() {
  var listed = SalesforceAccounts_listTriggersSafe_();
  if (!listed.ok) return false;
  var i;
  for (i = 0; i < listed.triggers.length; i++) {
    if (listed.triggers[i].getHandlerFunction() === SALESFORCE_ACCOUNTS_EMB_CONT_HANDLER_) {
      return true;
    }
  }
  return false;
}

function SalesforceAccounts_deleteEmbeddingsContinuationTriggers_() {
  var listed = SalesforceAccounts_listTriggersSafe_();
  if (!listed.ok) return;
  var i;
  for (i = 0; i < listed.triggers.length; i++) {
    if (listed.triggers[i].getHandlerFunction() === SALESFORCE_ACCOUNTS_EMB_CONT_HANDLER_) {
      ScriptApp.deleteTrigger(listed.triggers[i]);
    }
  }
}

function SalesforceAccounts_scheduleEmbeddingsContinuation_() {
  var listed = SalesforceAccounts_listTriggersSafe_();
  if (!listed.ok) {
    console.log('[SF-SYNC] cannot schedule embedding continuation: ScriptApp scope');
    return;
  }
  SalesforceAccounts_deleteEmbeddingsContinuationTriggers_();
  ScriptAppSchedule_afterMinutes_(
    SALESFORCE_ACCOUNTS_EMB_CONT_HANDLER_,
    SALESFORCE_ACCOUNTS_EMBEDDING_CONTINUATION_MINUTES_,
  );
}

/**
 * @param {Object} dataRes resultado de runSyncData_
 * @param {{processed:number, failed:number, offset:number, hasMore:boolean, total:number}} embStats
 */
/**
 * @param {Object|null} kgStats
 * @return {string}
 */
function SalesforceAccounts_formatKgCatchupMessage_(kgStats) {
  if (!kgStats) return '';
  if (kgStats.skipped && kgStats.reason === 'aligned') return ',kg=aligned';
  if (kgStats.skipped && kgStats.reason === 'no_supabase') return ',kg=skip_no_db';
  var msg =
    ',kg=' +
    (kgStats.processed || 0) +
    ',kg_fail=' +
    (kgStats.failed || 0);
  if (kgStats.removed) msg += ',kg_removed=' + kgStats.removed;
  if (kgStats.phase) msg += ',kg_phase=' + String(kgStats.phase);
  if (kgStats.hasMore) msg += ',kg_pending=1,continuation=scheduled';
  return msg;
}

/**
 * @param {number} maxMs
 * @return {Object}
 */
function SalesforceAccounts_runKnowledgeGraphCatchUp_(maxMs) {
  try {
    return KnowledgeGraph_runAutomaticCatchUpWithBudget_(maxMs);
  } catch (eKg) {
    console.log(
      '[KG] SF auto catch-up failed: ' + String(eKg.message || eKg).slice(0, 160),
    );
    return {
      ok: false,
      hasMore: false,
      skipped: true,
      reason: 'error',
      processed: 0,
      failed: 0,
      error: String(eKg.message || eKg).slice(0, 200),
    };
  }
}

function SalesforceAccounts_recordEmbeddingDrainState_(dataRes, embStats, kgStats) {
  var state = SalesforceAccountsSyncStateStore_load_();
  var pending = embStats.hasMore
    ? Math.max(0, (embStats.total || 0) - (embStats.offset || 0))
    : 0;
  var msg =
    'accounts=' +
    (dataRes && dataRes.accounts != null ? dataRes.accounts : 0) +
    ',emb=' +
    (embStats.processed || 0) +
    ',emb_fail=' +
    (embStats.failed || 0);
  if (embStats.hasMore) {
    msg += ',emb_pending=' + pending + ',continuation=scheduled';
  }
  msg += SalesforceAccounts_formatKgCatchupMessage_(kgStats);
  var partial = embStats.hasMore || (kgStats && kgStats.hasMore);
  state.last_sync_at = new Date().toISOString();
  state.last_sync_status = partial ? 'ok_partial' : 'ok';
  state.last_sync_message = msg;
  if (dataRes && !dataRes.skipped) {
    state.accounts_upserted = dataRes.accounts;
    state.accounts_inactivated = dataRes.inactivated;
  }
  SalesforceAccountsSyncStateStore_save_(state);
}

/**
 * @param {boolean} force
 * @return {{ok:boolean, skipped:boolean, reason:string, accounts:number, inactivated:number, embeddings:number, embeddingsPending:number, continuationScheduled:boolean}}
 */
function SalesforceAccounts_runFullSync(force) {
  return SalesforceAccounts_runAutomaticSync_(!!force);
}

/**
 * Sync automático: datos + drenaje de embeddings por presupuesto de tiempo; si queda cola, trigger encadenado.
 * @param {boolean} force
 */
function SalesforceAccounts_runAutomaticSync_(force) {
  var data = SalesforceAccounts_runSyncData_(force);
  if (data.skipped) {
    var qLen = SalesforceAccounts_loadEmbeddingQueue_().length;
    if (qLen === 0) {
      var kgOnly = SalesforceAccounts_runKnowledgeGraphCatchUp_(
        SALESFORCE_ACCOUNTS_KG_CATCHUP_MAX_MS_,
      );
      var kgCont = !!(kgOnly && kgOnly.hasMore);
      if (kgCont) {
        SalesforceAccounts_scheduleEmbeddingsContinuation_();
      }
      var idleData = {
        ok: true,
        skipped: true,
        reason: 'no_changes',
        accounts: 0,
        inactivated: 0,
      };
      SalesforceAccounts_recordEmbeddingDrainState_(
        idleData,
        {
          processed: 0,
          failed: 0,
          offset: 0,
          hasMore: false,
          total: 0,
        },
        kgOnly,
      );
      return {
        ok: true,
        skipped: true,
        reason: 'no_changes',
        accounts: 0,
        inactivated: 0,
        embeddings: 0,
        embeddingsPending: 0,
        knowledgeGraphProcessed: kgOnly ? kgOnly.processed || 0 : 0,
        knowledgeGraphPending: kgCont,
        continuationScheduled: kgCont,
      };
    }
    data = {
      ok: true,
      skipped: true,
      reason: 'embeddings_resume',
      accounts: 0,
      inactivated: 0,
      total: qLen,
      embeddingTotal: qLen,
    };
  }

  var skip = data.skipped ? SalesforceAccounts_loadEmbeddingOffset_() : 0;
  var embStats = SalesforceAccounts_drainEmbeddingsWithTimeBudget_(
    skip,
    SALESFORCE_ACCOUNTS_EMBEDDING_AUTO_MAX_MS_,
  );
  var cont = false;
  var kgStats = null;
  if (embStats.hasMore) {
    SalesforceAccounts_storeEmbeddingOffset_(embStats.offset);
    SalesforceAccounts_scheduleEmbeddingsContinuation_();
    cont = true;
  } else {
    SalesforceAccounts_clearEmbeddingOffset_();
    SalesforceAccounts_storeEmbeddingQueue_([]);
    kgStats = SalesforceAccounts_runKnowledgeGraphCatchUp_(
      SALESFORCE_ACCOUNTS_KG_CATCHUP_MAX_MS_,
    );
    if (kgStats && kgStats.hasMore) {
      SalesforceAccounts_scheduleEmbeddingsContinuation_();
      cont = true;
    }
  }
  SalesforceAccounts_recordEmbeddingDrainState_(data, embStats, kgStats);
  var pending = embStats.hasMore
    ? Math.max(0, (embStats.total || 0) - embStats.offset)
    : 0;
  return {
    ok: true,
    skipped: data.reason === 'no_changes',
    reason: data.reason || 'synced',
    accounts: data.accounts || 0,
    inactivated: data.inactivated || 0,
    embeddings: embStats.processed,
    embeddingsPending: pending,
    knowledgeGraphProcessed: kgStats ? kgStats.processed || 0 : 0,
    knowledgeGraphPending: !!(kgStats && kgStats.hasMore),
    continuationScheduled: cont,
  };
}

/**
 * Entrada del trigger semanal (time-driven).
 */
function SalesforceAccounts_weeklySyncJob_() {
  try {
    SalesforceAccounts_runAutomaticSync_(false);
  } catch (e) {
    console.error('[SF-SYNC] weekly job failed: ' + (e.message || e));
    var state = SalesforceAccountsSyncStateStore_load_();
    state.last_sync_at = new Date().toISOString();
    state.last_sync_status = 'error';
    state.last_sync_message = String(e.message || e).slice(0, 500);
    SalesforceAccountsSyncStateStore_save_(state);
    throw e;
  }
}

/** @deprecated Triggers diarios legacy; reinstalar con SalesforceAccounts_installWeeklyTrigger(). */
function SalesforceAccounts_dailySyncJob_() {
  SalesforceAccounts_weeklySyncJob_();
}

/**
 * Continúa indexando embeddings pendientes (trigger one-shot encadenado).
 */
function SalesforceAccounts_embeddingsContinuationJob_() {
  SalesforceAccounts_deleteEmbeddingsContinuationTriggers_();
  try {
    var skip = SalesforceAccounts_loadEmbeddingOffset_();
    var q = SalesforceAccounts_loadEmbeddingQueue_();
    if (!q.length || skip >= q.length) {
      SalesforceAccounts_clearEmbeddingOffset_();
      SalesforceAccounts_storeEmbeddingQueue_([]);
      var kgResumeOnly = SalesforceAccounts_runKnowledgeGraphCatchUp_(
        SALESFORCE_ACCOUNTS_KG_CATCHUP_MAX_MS_,
      );
      if (kgResumeOnly && kgResumeOnly.hasMore) {
        SalesforceAccounts_scheduleEmbeddingsContinuation_();
      }
      SalesforceAccounts_recordEmbeddingDrainState_(
        {
          skipped: true,
          reason: 'embeddings_resume',
          accounts: 0,
          inactivated: 0,
        },
        {
          processed: 0,
          failed: 0,
          offset: 0,
          hasMore: false,
          total: 0,
        },
        kgResumeOnly,
      );
      return;
    }
    var embStats = SalesforceAccounts_drainEmbeddingsWithTimeBudget_(
      skip,
      SALESFORCE_ACCOUNTS_EMBEDDING_AUTO_MAX_MS_,
    );
    var resumeData = {
      skipped: true,
      reason: 'embeddings_resume',
      accounts: 0,
      inactivated: 0,
    };
    var kgStats = null;
    if (embStats.hasMore) {
      SalesforceAccounts_storeEmbeddingOffset_(embStats.offset);
      SalesforceAccounts_scheduleEmbeddingsContinuation_();
    } else {
      SalesforceAccounts_clearEmbeddingOffset_();
      SalesforceAccounts_storeEmbeddingQueue_([]);
      kgStats = SalesforceAccounts_runKnowledgeGraphCatchUp_(
        SALESFORCE_ACCOUNTS_KG_CATCHUP_MAX_MS_,
      );
      if (kgStats && kgStats.hasMore) {
        SalesforceAccounts_scheduleEmbeddingsContinuation_();
      }
    }
    SalesforceAccounts_recordEmbeddingDrainState_(resumeData, embStats, kgStats);
  } catch (e) {
    console.error('[SF-SYNC] embedding continuation failed: ' + (e.message || e));
    var errState = SalesforceAccountsSyncStateStore_load_();
    errState.last_sync_at = new Date().toISOString();
    errState.last_sync_status = 'error';
    errState.last_sync_message = String(e.message || e).slice(0, 500);
    SalesforceAccountsSyncStateStore_save_(errState);
    throw e;
  }
}

/** Hora local del proyecto Apps Script para el trigger semanal (0–23). */
var SALESFORCE_ACCOUNTS_WEEKLY_TRIGGER_HOUR = 6;

/** Día de la semana del trigger semanal (zona horaria del proyecto Apps Script). */
var SALESFORCE_ACCOUNTS_WEEKLY_TRIGGER_WEEKDAY = ScriptApp.WeekDay.MONDAY;

var SALESFORCE_ACCOUNTS_WEEKLY_HANDLER_ = 'SalesforceAccounts_weeklySyncJob_';

/** @deprecated Solo triggers diarios no reinstalados. */
var SALESFORCE_ACCOUNTS_DAILY_HANDLER_ = 'SalesforceAccounts_dailySyncJob_';

/**
 * @return {string[]}
 */
function SalesforceAccounts_scheduledSyncHandlerNames_() {
  return [SALESFORCE_ACCOUNTS_WEEKLY_HANDLER_, SALESFORCE_ACCOUNTS_DAILY_HANDLER_];
}

/**
 * @return {string}
 */
function SalesforceAccounts_scheduleWeekDayToken_() {
  if (SALESFORCE_ACCOUNTS_WEEKLY_TRIGGER_WEEKDAY === ScriptApp.WeekDay.TUESDAY) {
    return 'tuesday';
  }
  if (SALESFORCE_ACCOUNTS_WEEKLY_TRIGGER_WEEKDAY === ScriptApp.WeekDay.WEDNESDAY) {
    return 'wednesday';
  }
  if (SALESFORCE_ACCOUNTS_WEEKLY_TRIGGER_WEEKDAY === ScriptApp.WeekDay.THURSDAY) {
    return 'thursday';
  }
  if (SALESFORCE_ACCOUNTS_WEEKLY_TRIGGER_WEEKDAY === ScriptApp.WeekDay.FRIDAY) {
    return 'friday';
  }
  if (SALESFORCE_ACCOUNTS_WEEKLY_TRIGGER_WEEKDAY === ScriptApp.WeekDay.SATURDAY) {
    return 'saturday';
  }
  if (SALESFORCE_ACCOUNTS_WEEKLY_TRIGGER_WEEKDAY === ScriptApp.WeekDay.SUNDAY) {
    return 'sunday';
  }
  return 'monday';
}

/**
 * @return {boolean}
 */
function SalesforceAccounts_triggerUsesHandler_(trigger, handlerName) {
  try {
    return trigger.getHandlerFunction() === handlerName;
  } catch (ignore) {
    return false;
  }
}

/**
 * @return {{ok:boolean, triggers:Array, error:string}}
 */
function SalesforceAccounts_listTriggersSafe_() {
  try {
    return { ok: true, triggers: ScriptApp.getProjectTriggers(), error: '' };
  } catch (e) {
    var msg = e && e.message ? String(e.message) : String(e);
    console.log('[SF-SYNC] ScriptApp.getProjectTriggers failed: ' + msg);
    return { ok: false, triggers: [], error: msg };
  }
}

/**
 * @return {boolean}
 */
function SalesforceAccounts_weeklyTriggerInstalled_() {
  var listed = SalesforceAccounts_listTriggersSafe_();
  if (!listed.ok) return false;
  var handlers = SalesforceAccounts_scheduledSyncHandlerNames_();
  var i;
  var hi;
  for (i = 0; i < listed.triggers.length; i++) {
    for (hi = 0; hi < handlers.length; hi++) {
      if (SalesforceAccounts_triggerUsesHandler_(listed.triggers[i], handlers[hi])) {
        return true;
      }
    }
  }
  return false;
}

/** @deprecated usar SalesforceAccounts_weeklyTriggerInstalled_ */
function SalesforceAccounts_dailyTriggerInstalled_() {
  return SalesforceAccounts_weeklyTriggerInstalled_();
}

/**
 * Estado del sync automático (trigger + última corrida en app_settings).
 * @return {{
 *   ok: boolean,
 *   triggerInstalled: boolean,
 *   triggerPermissionsOk: boolean,
 *   scheduleHour: number,
 *   scheduleEveryWeeks: number,
 *   scheduleWeekDay: string,
 *   spreadsheetConfigured: boolean,
 *   state: Object
 * }}
 */
function SalesforceAccounts_getSyncStatus() {
  var listed = SalesforceAccounts_listTriggersSafe_();
  var installed = SalesforceAccounts_weeklyTriggerInstalled_();
  var q = SalesforceAccounts_loadEmbeddingQueue_();
  var off = SalesforceAccounts_loadEmbeddingOffset_();
  var embPending = Math.max(0, q.length - off);
  return {
    ok: true,
    triggerInstalled: installed,
    triggerPermissionsOk: listed.ok,
    scheduleHour: SALESFORCE_ACCOUNTS_WEEKLY_TRIGGER_HOUR,
    scheduleEveryWeeks: 1,
    scheduleWeekDay: SalesforceAccounts_scheduleWeekDayToken_(),
    spreadsheetConfigured: !!AviatorsConfig_salesforceAccountsSpreadsheetId_(),
    embeddingsPending: embPending,
    embeddingsContinuationScheduled: SalesforceAccounts_embeddingsContinuationTriggerInstalled_(),
    state: SalesforceAccountsSyncStateStore_load_(),
  };
}

/**
 * @return {{ok:boolean, triggerCount:number}}
 */
function SalesforceAccounts_installWeeklyTrigger() {
  var listed = SalesforceAccounts_listTriggersSafe_();
  if (!listed.ok) {
    AviatorsError_throw_('ERR_SCRIPTAPP_SCOPE', 'SalesforceAccounts_installWeeklyTrigger');
  }
  var scheduledHandlers = SalesforceAccounts_scheduledSyncHandlerNames_();
  var i;
  var hi;
  for (i = 0; i < listed.triggers.length; i++) {
    var handler = listed.triggers[i].getHandlerFunction();
    var isScheduled = false;
    for (hi = 0; hi < scheduledHandlers.length; hi++) {
      if (handler === scheduledHandlers[hi]) {
        isScheduled = true;
        break;
      }
    }
    if (isScheduled || handler === SALESFORCE_ACCOUNTS_EMB_CONT_HANDLER_) {
      ScriptApp.deleteTrigger(listed.triggers[i]);
    }
  }
  ScriptApp.newTrigger(SALESFORCE_ACCOUNTS_WEEKLY_HANDLER_)
    .timeBased()
    .everyWeeks(1)
    .onWeekDay(SALESFORCE_ACCOUNTS_WEEKLY_TRIGGER_WEEKDAY)
    .atHour(SALESFORCE_ACCOUNTS_WEEKLY_TRIGGER_HOUR)
    .create();
  var after = SalesforceAccounts_listTriggersSafe_();
  return {
    ok: true,
    triggerCount: after.ok ? after.triggers.length : 0,
  };
}

/** @deprecated alias · instala trigger semanal */
function SalesforceAccounts_installDailyTrigger() {
  return SalesforceAccounts_installWeeklyTrigger();
}

/**
 * Actualiza el prompt del agente clients en el registry persistido.
 * @return {{ok:boolean, updated:boolean}}
 */
function SalesforceAccounts_refreshClientsAgentPrompt() {
  var props = PropertiesService.getScriptProperties();
  var reg = AdminAgents_loadRegistry_(props);
  var prompt = SalesforceAccounts_defaultClientsAgentPrompt_();
  var updated = false;
  var i;
  for (i = 0; i < reg.agents.length; i++) {
    if (String(reg.agents[i].id || '').trim() === _ADMIN_AGENT_ID_CLIENTS) {
      reg.agents[i].systemPrompt = prompt;
      updated = true;
      break;
    }
  }
  if (updated) AdminAgents_saveRegistry_(props, reg);
  return { ok: true, updated: updated };
}
