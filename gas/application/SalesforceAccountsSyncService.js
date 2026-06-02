/**
 * @fileoverview Sync diario del roster Salesforce (Google Sheets → Supabase + catálogo + clientes).
 */

var SALESFORCE_ACCOUNTS_SHEET_DATA = 'Sheet1';
var SALESFORCE_ACCOUNTS_SHEET_EVENTS = 'Automatic Operations Events Log';
var SALESFORCE_ACCOUNTS_SYNC_ACTOR = 'salesforce-sync';
var SALESFORCE_ACCOUNTS_CONTENT_PROFILE = 'aviators-clients';

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
  return (
    'You are the Aviators Clients Agent.\n' +
    'Your sources of truth are:\n' +
    '1) The Salesforce Airlines Accounts roster synced into Aviators (account owner, portfolio, status, opportunities dates, industry).\n' +
    '2) Indexed client PDFs and curated client documents in the aviators-clients corpus when present.\n' +
    'Do NOT use external knowledge.\n\n' +
    'Goal: answer about clients, account ownership, portfolio, farming/hunting status, opportunity timelines, and continuity. ' +
    'When both roster data and uploaded PDFs exist, combine them without contradiction; prefer the most specific dated fact.\n\n' +
    'Rules:\n' +
    '1) Do not mix clients or accounts without evidence in the index.\n' +
    '2) If names are ambiguous, ask which account before asserting facts.\n' +
    '3) Do not invent contracts, revenue, scope, or dates.\n' +
    '4) Account Owner names from Salesforce may be used when present in the roster.\n' +
    '5) When applicable, structure by: Account, Owner, Portfolio, Status, Opportunities, Industry.\n\n' +
    'CRITICAL RULE - no content:\n' +
    'If your indexed corpus has NO information about the requested client or account, reply EXACTLY with this text and nothing else:\n' +
    '[[NO_RELEVANT_CONTENT]]\n' +
    'Do not invent or suggest content when there is no real match in the index.'
  );
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
  if (account.account_owner) lines.push('Account Owner: ' + account.account_owner);
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
 * @param {boolean} force
 * @return {{ok:boolean, skipped:boolean, reason:string, accounts:number, inactivated:number, embeddings:number}}
 */
function SalesforceAccounts_runFullSync(force) {
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
    return {
      ok: true,
      skipped: true,
      reason: 'no_changes',
      accounts: 0,
      inactivated: 0,
      embeddings: 0,
    };
  }

  var accounts = sheetPayload.accounts;
  var activeKeys = [];
  var upserted = 0;
  var embeddings = 0;
  var i;

  for (i = 0; i < accounts.length; i++) {
    var acc = accounts[i];
    var key = acc.account_key;
    activeKeys.push(key);

    var existing = SalesforceAccountsStore_getByKey(key);
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
      if (hashChanged) {
        try {
          ContentEmbedding_refreshForContentId_(contentId);
          embeddings++;
        } catch (eEmb) {
          console.log(
            '[SF-SYNC] embedding deferred ' +
              contentId +
              ': ' +
              String(eEmb.message || eEmb).slice(0, 120),
          );
        }
      }
    } else {
      rowPayload.content_id = contentId;
    }

    SalesforceAccountsStore_upsert(rowPayload);
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
    try {
      ContentEmbedding_refreshForContentId_(cid);
      embeddings++;
    } catch (ignoreEmb) {}
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

  SalesforceAccountsSyncStateStore_save_({
    last_event_row: eventRow,
    last_sheet_hash: sheetHash,
    last_sync_at: new Date().toISOString(),
    last_sync_status: 'ok',
    last_sync_message: 'accounts=' + upserted,
    accounts_upserted: upserted,
    accounts_inactivated: inactivated,
  });

  return {
    ok: true,
    skipped: false,
    reason: 'synced',
    accounts: upserted,
    inactivated: inactivated,
    embeddings: embeddings,
  };
}

/**
 * Entrada del trigger diario (time-driven).
 */
function SalesforceAccounts_dailySyncJob_() {
  try {
    SalesforceAccounts_runFullSync(false);
  } catch (e) {
    console.error('[SF-SYNC] daily job failed: ' + (e.message || e));
    var state = SalesforceAccountsSyncStateStore_load_();
    state.last_sync_at = new Date().toISOString();
    state.last_sync_status = 'error';
    state.last_sync_message = String(e.message || e).slice(0, 500);
    SalesforceAccountsSyncStateStore_save_(state);
    throw e;
  }
}

/** Hora local del proyecto Apps Script para el trigger diario (0–23). */
var SALESFORCE_ACCOUNTS_DAILY_TRIGGER_HOUR = 6;

/**
 * Estado del sync automático (trigger + última corrida en app_settings).
 * @return {{
 *   ok: boolean,
 *   triggerInstalled: boolean,
 *   scheduleHour: number,
 *   scheduleEveryDays: number,
 *   spreadsheetConfigured: boolean,
 *   state: Object
 * }}
 */
function SalesforceAccounts_getSyncStatus() {
  var handler = 'SalesforceAccounts_dailySyncJob_';
  var triggers = ScriptApp.getProjectTriggers();
  var installed = false;
  var i;
  for (i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === handler) {
      installed = true;
      break;
    }
  }
  return {
    ok: true,
    triggerInstalled: installed,
    scheduleHour: SALESFORCE_ACCOUNTS_DAILY_TRIGGER_HOUR,
    scheduleEveryDays: 1,
    spreadsheetConfigured: !!AviatorsConfig_salesforceAccountsSpreadsheetId_(),
    state: SalesforceAccountsSyncStateStore_load_(),
  };
}

/**
 * @return {{ok:boolean, triggerCount:number}}
 */
function SalesforceAccounts_installDailyTrigger() {
  var handler = 'SalesforceAccounts_dailySyncJob_';
  var existing = ScriptApp.getProjectTriggers();
  var i;
  for (i = 0; i < existing.length; i++) {
    if (existing[i].getHandlerFunction() === handler) {
      ScriptApp.deleteTrigger(existing[i]);
    }
  }
  ScriptApp.newTrigger(handler)
    .timeBased()
    .everyDays(1)
    .atHour(SALESFORCE_ACCOUNTS_DAILY_TRIGGER_HOUR)
    .create();
  return { ok: true, triggerCount: ScriptApp.getProjectTriggers().length };
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
