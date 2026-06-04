/**
 * @fileoverview Migración one-shot desde planillas Google → Supabase.
 */

/**
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {string[]} headers
 * @return {Array<Object>}
 */
function AdminSupabaseMigration_readSheetRows_(sheet, headers) {
  if (!sheet) return [];
  var last = sheet.getLastRow();
  if (last < 2) return [];
  var vals = sheet.getRange(2, 1, last - 1, headers.length).getValues();
  var out = [];
  for (var r = 0; r < vals.length; r++) {
    var obj = {};
    for (var c = 0; c < headers.length; c++) {
      obj[headers[c]] = vals[r][c];
    }
    out.push(obj);
  }
  return out;
}

/**
 * @param {GoogleAppsScript.Properties.Properties} props
 * @return {GoogleAppsScript.Spreadsheet.Spreadsheet|null}
 */
function AdminSupabaseMigration_openSheetByProp_(props, propKey) {
  var ssId = String(props.getProperty(propKey) || '').trim();
  if (!ssId) return null;
  try {
    return SpreadsheetApp.openById(ssId);
  } catch (ignore) {
    return null;
  }
}

/**
 * Migra roles desde planilla legacy (propiedad ROLES_SPREADSHEET_ID, solo migración) → Supabase.
 * @return {number}
 */
function AdminSupabaseMigration_migrateRoles_(props) {
  var ssId = String(props.getProperty('ROLES_SPREADSHEET_ID') || '').trim();
  if (!ssId) return 0;
  var ss;
  try {
    ss = SpreadsheetApp.openById(ssId);
  } catch (eOpen) {
    return 0;
  }
  var sheet = ss.getSheetByName('data');
  if (!sheet) return 0;
  var rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return 0;

  var header = rows[0];
  var colRole = -1;
  var colEmail = -1;
  for (var h = 0; h < header.length; h++) {
    var hn = String(header[h] || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
    if (hn === 'rol' || hn === 'role') colRole = h;
    if (hn === 'e-mail' || hn === 'email' || hn === 'correo' || hn === 'mail') colEmail = h;
  }
  if (colRole < 0 || colEmail < 0) return 0;

  var payload = [];
  for (var r = 1; r < rows.length; r++) {
    var row = rows[r];
    var email = String(row[colEmail] || '')
      .trim()
      .toLowerCase();
    if (!email) continue;
    var label = String(row[colRole] || '').trim() || 'Miembro';
    var key = label
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_áéíóúñ]/gi, '');
    if (!key) key = 'miembro';
    payload.push({
      email: email,
      role_label: label,
      role_key: key,
      updated_at: new Date().toISOString(),
    });
  }
  RoleDirectoryStore_replaceAll(payload);
  return payload.length;
}

/**
 * @return {number}
 */
function AdminSupabaseMigration_migrateClients_(props) {
  var ss = AdminSupabaseMigration_openSheetByProp_(props, CLIENTS_PROP_SPREADSHEET_ID);
  if (!ss) return 0;
  var sheet = ss.getSheetByName(CLIENTS_TAB_NAME);
  if (!sheet) return 0;
  var headers = ClientsMaster_headers_();
  var rows = AdminSupabaseMigration_readSheetRows_(sheet, headers);
  var count = 0;
  for (var i = 0; i < rows.length; i++) {
    var id = String(rows[i].client_id || '').trim();
    if (!id) continue;
    ClientsMasterStore_upsert({
      client_id: id,
      client_name: String(rows[i].client_name || ''),
      normalized_name: String(rows[i].normalized_name || ''),
      industry: String(rows[i].industry || ''),
      country: String(rows[i].country || ''),
      main_contact_name: String(rows[i].main_contact_name || ''),
      main_contact_email: String(rows[i].main_contact_email || ''),
      logo_url: String(rows[i].logo_url || ''),
      notes: String(rows[i].notes || ''),
      created_at: String(rows[i].created_at || new Date().toISOString()),
      created_by: String(rows[i].created_by || ''),
      updated_at: String(rows[i].updated_at || new Date().toISOString()),
    });
    count++;
  }
  return count;
}

/**
 * @return {number}
 */
function AdminSupabaseMigration_migrateContents_(props) {
  var ss = AdminSupabaseMigration_openSheetByProp_(props, CATALOG_PROP_SSID);
  if (!ss) return 0;
  var tabs = ContentCatalog_resolveTabNames_(props);
  var commonHeaders = ContentCatalog_headersCommon_();
  var commonSheet = ss.getSheetByName(tabs.common);
  if (!commonSheet) return 0;
  var commonRows = AdminSupabaseMigration_readSheetRows_(commonSheet, commonHeaders);

  var byType = {
    proposal: AdminSupabaseMigration_readSheetRows_(
      ss.getSheetByName(tabs.proposals),
      ContentCatalog_headersByType_('proposal'),
    ),
    success_case: AdminSupabaseMigration_readSheetRows_(
      ss.getSheetByName(tabs.successCases),
      ContentCatalog_headersByType_('success_case'),
    ),
    client: AdminSupabaseMigration_readSheetRows_(
      ss.getSheetByName(tabs.clients),
      ContentCatalog_headersByType_('client'),
    ),
    onboarding: AdminSupabaseMigration_readSheetRows_(
      ss.getSheetByName(tabs.onboarding),
      ContentCatalog_headersByType_('onboarding'),
    ),
  };

  var specificById = {};
  var t;
  for (t in byType) {
    if (!Object.prototype.hasOwnProperty.call(byType, t)) continue;
    var arr = byType[t];
    for (var j = 0; j < arr.length; j++) {
      specificById[String(arr[j].content_id || '').trim()] = arr[j];
    }
  }

  var count = 0;
  for (var i = 0; i < commonRows.length; i++) {
    var cid = String(commonRows[i].content_id || '').trim();
    if (!cid) continue;
    var ctype = String(commonRows[i].content_type || '').trim();
    var specific = specificById[cid] || { content_id: cid };
    ContentCatalogStore_upsert(
      {
        content_id: cid,
        content_type: ctype,
        title: String(commonRows[i].title || ''),
        summary: String(commonRows[i].summary || ''),
        client_name: String(commonRows[i].client_name || ''),
        industry: String(commonRows[i].industry || ''),
        tags_csv: String(commonRows[i].tags_csv || ''),
        file_name: String(commonRows[i].file_name || ''),
        mime_type: String(commonRows[i].mime_type || ''),
        drive_file_id: String(commonRows[i].drive_file_id || ''),
        drive_file_url: String(commonRows[i].drive_file_url || ''),
        globant_profile_name: String(commonRows[i].globant_profile_name || ''),
        globant_document_id: String(commonRows[i].globant_document_id || ''),
        uploaded_by: String(commonRows[i].uploaded_by || ''),
        created_at: String(commonRows[i].created_at || new Date().toISOString()),
        updated_at: String(commonRows[i].updated_at || new Date().toISOString()),
      },
      specific,
    );
    count++;
  }

  var tagsRaw = String(props.getProperty(CATALOG_PROP_TAGS_JSON) || '').trim();
  if (tagsRaw) {
    try {
      var tagsArr = JSON.parse(tagsRaw);
      if (Array.isArray(tagsArr)) ContentCatalogStore_setControlledTags(tagsArr);
    } catch (ignoreTags) {}
  }

  return count;
}

/**
 * @return {Object<string,number>}
 */
function AdminSupabaseMigration_migrateMetrics_(props) {
  var ss = AdminSupabaseMigration_openSheetByProp_(props, METRICS_PROP_SPREADSHEET_ID);
  if (!ss) {
    return {
      usage: 0,
      unanswered: 0,
      feedback: 0,
      chatHistory: 0,
      quickPrompts: 0,
    };
  }

  var usageSheet = ss.getSheetByName(METRICS_TAB_USAGE_EVENTS);
  var unansweredSheet = ss.getSheetByName(METRICS_TAB_UNANSWERED);
  var feedbackSheet = ss.getSheetByName(METRICS_TAB_FEEDBACK);
  var chatSheet = ss.getSheetByName(METRICS_TAB_CHAT_HISTORY);
  var qpSheet = ss.getSheetByName(METRICS_TAB_QUICK_PROMPTS);

  var usageRows = usageSheet
    ? AdminSupabaseMigration_readSheetRows_(usageSheet, MetricsService_usageHeaders_())
    : [];
  var unansweredRows = unansweredSheet
    ? AdminSupabaseMigration_readSheetRows_(unansweredSheet, MetricsService_unansweredHeaders_())
    : [];
  var feedbackRows = feedbackSheet
    ? AdminSupabaseMigration_readSheetRows_(feedbackSheet, MetricsService_feedbackHeaders_())
    : [];
  var chatRows = chatSheet
    ? AdminSupabaseMigration_readSheetRows_(chatSheet, MetricsService_chatHistoryHeaders_())
    : [];
  var qpRows = qpSheet
    ? AdminSupabaseMigration_readSheetRows_(qpSheet, MetricsService_quickPromptsHeaders_())
    : [];

  var ui;
  for (ui = 0; ui < usageRows.length; ui++) {
    var ur = usageRows[ui];
    MetricsStore_insertUsageEvent_({
      event_id: String(ur.event_id || Utilities.getUuid()),
      question_id: String(ur.question_id || Utilities.getUuid()),
      ts_iso: String(ur.ts_iso || new Date().toISOString()),
      ts_ms: Number(ur.ts_ms || Date.now()),
      year_month: String(ur.year_month || ''),
      user_email: String(ur.user_email || ''),
      user_display_name: String(ur.user_display_name || ''),
      role_key: String(ur.role_key || ''),
      mode: String(ur.mode || 'chat'),
      agent_id: String(ur.agent_id || ''),
      agent_name: String(ur.agent_name || ''),
      question_text: String(ur.question_text || ''),
      is_unanswered: String(ur.is_unanswered || '') === '1',
      unanswered_code: String(ur.unanswered_code || ''),
    });
  }

  var uq;
  for (uq = 0; uq < unansweredRows.length; uq++) {
    var uqr = unansweredRows[uq];
    MetricsStore_insertUnanswered({
      event_id: String(uqr.event_id || Utilities.getUuid()),
      question_id: String(uqr.question_id || Utilities.getUuid()),
      ts_iso: String(uqr.ts_iso || new Date().toISOString()),
      ts_ms: Number(uqr.ts_ms || Date.now()),
      user_email: String(uqr.user_email || ''),
      user_display_name: String(uqr.user_display_name || ''),
      role_key: String(uqr.role_key || ''),
      mode: String(uqr.mode || 'chat'),
      agent_id: String(uqr.agent_id || ''),
      agent_name: String(uqr.agent_name || ''),
      question_text: String(uqr.question_text || ''),
      unanswered_code: String(uqr.unanswered_code || 'UNANSWERED'),
    });
  }

  var fb;
  for (fb = 0; fb < feedbackRows.length; fb++) {
    var fbr = feedbackRows[fb];
    SupabaseRest_insert(SUPABASE_TABLE.FEEDBACK_EVENTS, {
      feedback_id: String(fbr.feedback_id || Utilities.getUuid()),
      event_id: String(fbr.event_id || ''),
      ts_iso: String(fbr.ts_iso || new Date().toISOString()),
      user_email: String(fbr.user_email || ''),
      role_key: String(fbr.role_key || ''),
      rating: String(fbr.rating || 'up'),
      agent_id: String(fbr.agent_id || ''),
      agent_name: String(fbr.agent_name || ''),
      question_text: String(fbr.question_text || ''),
    }, { prefer: 'return=minimal' });
  }

  var ch;
  for (ch = 0; ch < chatRows.length; ch++) {
    var chr = chatRows[ch];
    var messages;
    try {
      messages = JSON.parse(String(chr.messages_json || '[]'));
    } catch (ignoreMj) {
      messages = [];
    }
    SupabaseRest_insert(SUPABASE_TABLE.CHAT_CONVERSATIONS, {
      conv_id: String(chr.conv_id || Utilities.getUuid()),
      user_email: String(chr.user_email || ''),
      ts_created: String(chr.ts_created || new Date().toISOString()),
      title: String(chr.title || ''),
      messages_json: messages,
    }, { prefer: 'return=minimal' });
  }

  if (qpRows.length) {
    var qpPayload = [];
    for (var qi = 0; qi < qpRows.length; qi++) {
      qpPayload.push({
        id: String(qpRows[qi].id || Utilities.getUuid().slice(0, 8)),
        es: String(qpRows[qi].es || ''),
        en: String(qpRows[qi].en || ''),
        sort_order: Number(qpRows[qi].order || 0) || (qi + 1),
      });
    }
    MetricsStore_quickPromptsReplaceAll(qpPayload);
  }

  return {
    usage: usageRows.length,
    unanswered: unansweredRows.length,
    feedback: feedbackRows.length,
    chatHistory: chatRows.length,
    quickPrompts: qpRows.length,
  };
}

/**
 * @return {number}
 */
function AdminSupabaseMigration_migrateAgentApiCatalog_(props) {
  var ss = AdminSupabaseMigration_openSheetByProp_(
    props,
    _ADMIN_AGENTS_API_CATALOG_SSID_PROP,
  );
  if (!ss) return 0;
  var sheet = ss.getSheetByName(_ADMIN_AGENTS_API_CATALOG_TAB);
  if (!sheet) return 0;
  var last = sheet.getLastRow();
  if (last < 2) return 0;
  var vals = sheet.getRange(2, 1, last - 1, 2).getDisplayValues();
  var rows = [];
  for (var i = 0; i < vals.length; i++) {
    rows.push({ model: String(vals[i][0] || ''), strategy: String(vals[i][1] || '') });
  }
  AgentApiCatalogStore_replaceAll(rows);
  return rows.length;
}

/**
 * Migra datos operativos desde planillas existentes hacia Supabase.
 * Requiere SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY y esquema aplicado.
 * @return {{ok:boolean,migrated:Object}}
 */
function AdminSupabaseMigration_migrateFromSheets() {
  AdminAuth_requireAdmin();
  AviatorsDataBackend_requireSupabase_();

  var lock = LockService.getScriptLock();
  lock.waitLock(120000);
  try {
    var props = PropertiesService.getScriptProperties();

    ContentCatalogStore_clearAll();
    ClientsMasterStore_clearAll();
    MetricsStore_clearAll();
    AgentApiCatalogStore_clearAll();

    var migrated = {
      roles: AdminSupabaseMigration_migrateRoles_(props),
      clients: AdminSupabaseMigration_migrateClients_(props),
      contents: AdminSupabaseMigration_migrateContents_(props),
      metrics: AdminSupabaseMigration_migrateMetrics_(props),
      agentApiCatalog: AdminSupabaseMigration_migrateAgentApiCatalog_(props),
    };
    props.setProperty(AVIATORS_PROP.DATA_BACKEND, AVIATORS_DATA_BACKEND_SUPABASE);
    return { ok: true, migrated: migrated, backend: AVIATORS_DATA_BACKEND_SUPABASE };
  } finally {
    lock.releaseLock();
  }
}
