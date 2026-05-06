/**
 * @fileoverview Métricas operativas (uso de chat, no respondidas y leaderboards).
 */

var METRICS_PROP_SPREADSHEET_ID = 'METRICS_SPREADSHEET_ID';
var METRICS_TAB_USAGE_EVENTS = 'usage_events';
var METRICS_TAB_UNANSWERED = 'unanswered_queries';
var METRICS_TAB_MONTHLY = 'monthly_agg';
var METRICS_ROOT_FOLDER_ID = '1gkNVvIEN3UfPMnphZKLJ3600s5bkmTwG';

/** @return {string[]} */
function MetricsService_usageHeaders_() {
  return [
    'event_id',
    'question_id',
    'ts_iso',
    'ts_ms',
    'year_month',
    'user_email',
    'user_display_name',
    'role_key',
    'mode',
    'agent_id',
    'agent_name',
    'question_text',
    'is_unanswered',
    'unanswered_code',
  ];
}

/** @return {string[]} */
function MetricsService_unansweredHeaders_() {
  return [
    'event_id',
    'question_id',
    'ts_iso',
    'ts_ms',
    'user_email',
    'user_display_name',
    'role_key',
    'mode',
    'agent_id',
    'agent_name',
    'question_text',
    'unanswered_code',
  ];
}

/** @return {string[]} */
function MetricsService_monthlyHeaders_() {
  return ['year_month', 'questions_total', 'unanswered_total', 'updated_at'];
}

/**
 * @param {string} email
 * @return {boolean}
 */
function MetricsAuth_canView(email) {
  var em = String(email || '').trim();
  if (!em) return false;
  if (AdminAuth_emailIsAdmin(em)) return true;
  if (RoleDirectory_emailIsPresale(em)) return true;
  var rec = RoleDirectory_lookupRole(em);
  var key = rec && rec.key ? String(rec.key).trim().toLowerCase() : '';
  var label = rec && rec.label ? String(rec.label).trim().toLowerCase() : '';
  return key === 'manager' || label === 'manager';
}

function MetricsAuth_requireView() {
  var email = ('' + Session.getActiveUser().getEmail()).trim();
  if (!MetricsAuth_canView(email)) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_metrics_only'));
  }
}

/**
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {string[]} headers
 */
function MetricsService_ensureHeaders_(sheet, headers) {
  if (sheet.getLastRow() < 1) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    return;
  }
  var row = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  var same = true;
  for (var i = 0; i < headers.length; i++) {
    if (String(row[i] || '') !== headers[i]) {
      same = false;
      break;
    }
  }
  if (!same) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
}

/**
 * @return {{spreadsheet:GoogleAppsScript.Spreadsheet.Spreadsheet,usageSheet:GoogleAppsScript.Spreadsheet.Sheet,unansweredSheet:GoogleAppsScript.Spreadsheet.Sheet,monthlySheet:GoogleAppsScript.Spreadsheet.Sheet}}
 */
function MetricsService_getOrCreateSpreadsheet_() {
  var props = PropertiesService.getScriptProperties();
  var ssId = String(props.getProperty(METRICS_PROP_SPREADSHEET_ID) || '').trim();
  var ss = null;
  if (ssId) {
    try {
      ss = SpreadsheetApp.openById(ssId);
    } catch (eOpen) {
      ss = null;
    }
  }
  if (!ss) {
    ss = SpreadsheetApp.create('Aviators - Metrics');
    props.setProperty(METRICS_PROP_SPREADSHEET_ID, ss.getId());
    try {
      var file = DriveApp.getFileById(ss.getId());
      var folder = DriveApp.getFolderById(METRICS_ROOT_FOLDER_ID);
      folder.addFile(file);
      DriveApp.getRootFolder().removeFile(file);
    } catch (ignoreMove) {}
  }

  var usageSheet = ss.getSheetByName(METRICS_TAB_USAGE_EVENTS);
  if (!usageSheet) usageSheet = ss.insertSheet(METRICS_TAB_USAGE_EVENTS);
  var unansweredSheet = ss.getSheetByName(METRICS_TAB_UNANSWERED);
  if (!unansweredSheet) unansweredSheet = ss.insertSheet(METRICS_TAB_UNANSWERED);
  var monthlySheet = ss.getSheetByName(METRICS_TAB_MONTHLY);
  if (!monthlySheet) monthlySheet = ss.insertSheet(METRICS_TAB_MONTHLY);

  MetricsService_ensureHeaders_(usageSheet, MetricsService_usageHeaders_());
  MetricsService_ensureHeaders_(unansweredSheet, MetricsService_unansweredHeaders_());
  MetricsService_ensureHeaders_(monthlySheet, MetricsService_monthlyHeaders_());

  return {
    spreadsheet: ss,
    usageSheet: usageSheet,
    unansweredSheet: unansweredSheet,
    monthlySheet: monthlySheet,
  };
}

/**
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {string[]} headers
 * @return {Array<Object>}
 */
function MetricsService_readRows_(sheet, headers) {
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
 * @param {string|number|Date} value
 * @return {number}
 */
function MetricsService_toMs_(value) {
  if (typeof value === 'number') return value;
  if (value instanceof Date) return value.getTime();
  var n = Date.parse(String(value || ''));
  return isNaN(n) ? 0 : n;
}

/**
 * @param {number} ms
 * @return {string}
 */
function MetricsService_toYearMonth_(ms) {
  var d = new Date(ms);
  var m = d.getMonth() + 1;
  return String(d.getFullYear()) + '-' + (m < 10 ? '0' + m : m);
}

/**
 * @param {string} range
 * @return {{startMs:number,endMs:number}}
 */
function MetricsService_resolveRange_(range) {
  var now = Date.now();
  var oneDay = 24 * 60 * 60 * 1000;
  var r = String(range || '30d').trim().toLowerCase();
  var days = 30;
  if (r === '12m') days = 365;
  else if (r === '90d') days = 90;
  else if (r === '7d') days = 7;
  return { startMs: now - days * oneDay, endMs: now };
}

/**
 * @param {string} question
 * @return {string}
 */
function MetricsService_normalizeQuestion_(question) {
  var q = String(question || '').trim();
  if (!q) return '';
  if (q.length > 2000) q = q.slice(0, 2000);
  return q;
}

/**
 * @param {Object} payload
 * @return {{ok:boolean,eventId:string,questionId:string}}
 */
function MetricsService_trackQuestionEvent(payload) {
  var p = payload || {};
  var question = MetricsService_normalizeQuestion_(p.questionText);
  if (!question) return { ok: false, eventId: '', questionId: '' };

  var email = ('' + Session.getActiveUser().getEmail()).trim();
  if (!email) return { ok: false, eventId: '', questionId: '' };

  var nowMs = Date.now();
  var nowIso = new Date(nowMs).toISOString();
  var eventId = Utilities.getUuid();
  var questionId = String(p.questionId || '').trim() || Utilities.getUuid();
  var roleRec = null;
  try {
    roleRec = RoleDirectory_lookupRole(email);
  } catch (ignoreRole) {}
  var roleKey = roleRec && roleRec.key ? String(roleRec.key) : 'visitante';
  var displayName = String(p.userDisplayName || '').trim();
  if (!displayName) {
    var localPart = email.split('@')[0] || email;
    displayName = localPart;
  }
  var mode = String(p.mode || 'chat').trim() || 'chat';
  var agentId = String(p.agentId || '').trim();
  var agentName = String(p.agentName || '').trim();
  var isUnanswered = !!p.isUnanswered;
  var unansweredCode = String(p.unansweredCode || '').trim();

  var db = MetricsService_getOrCreateSpreadsheet_();
  db.usageSheet.appendRow([
    eventId,
    questionId,
    nowIso,
    nowMs,
    MetricsService_toYearMonth_(nowMs),
    email,
    displayName,
    roleKey,
    mode,
    agentId,
    agentName,
    question,
    isUnanswered ? '1' : '0',
    unansweredCode,
  ]);

  if (isUnanswered) {
    db.unansweredSheet.appendRow([
      eventId,
      questionId,
      nowIso,
      nowMs,
      email,
      displayName,
      roleKey,
      mode,
      agentId,
      agentName,
      question,
      unansweredCode || 'UNANSWERED',
    ]);
  }

  return { ok: true, eventId: eventId, questionId: questionId };
}

/**
 * @param {Array<Object>} rows
 * @param {{startMs:number,endMs:number}} bounds
 * @return {Array<Object>}
 */
function MetricsService_filterRowsByRange_(rows, bounds) {
  var out = [];
  for (var i = 0; i < rows.length; i++) {
    var ms = Number(rows[i].ts_ms || 0) || MetricsService_toMs_(rows[i].ts_iso);
    if (!ms) continue;
    if (ms < bounds.startMs || ms > bounds.endMs) continue;
    out.push(rows[i]);
  }
  return out;
}

/**
 * @param {Object<string,number>} map
 * @param {number} topN
 * @return {Array<{name:string,count:number}>}
 */
function MetricsService_mapToRank_(map, topN) {
  var arr = [];
  for (var k in map) {
    if (!Object.prototype.hasOwnProperty.call(map, k)) continue;
    arr.push({ name: k, count: map[k] });
  }
  arr.sort(function (a, b) {
    if (b.count !== a.count) return b.count - a.count;
    return a.name.localeCompare(b.name);
  });
  var lim = Math.max(1, Number(topN) || 10);
  if (arr.length > lim) arr = arr.slice(0, lim);
  return arr;
}

/**
 * @param {string} agentId
 * @return {Array<string>}
 */
function MetricsService_expandAgentIds_(agentId) {
  var raw = String(agentId || '').trim();
  if (!raw) return ['unassigned'];
  if (raw.indexOf('multi:') !== 0) return [raw];
  var rest = raw.slice(6);
  var bits = rest.split(',');
  var out = [];
  for (var i = 0; i < bits.length; i++) {
    var t = String(bits[i] || '').trim();
    if (t) out.push(t);
  }
  return out.length ? out : ['multi'];
}

/**
 * @param {Array<Object>} usageRows
 * @param {number} topN
 * @return {{byUser:Array<{name:string,count:number}>,byAgent:Array<{name:string,count:number}>,trend:Array<{date:string,questions:number,unanswered:number}>}}
 */
function MetricsService_buildUsageAggregates_(usageRows, topN) {
  var byUser = {};
  var byAgent = {};
  var trendMap = {}; // yyyy-mm-dd -> {questions, unanswered}
  var seenQuestions = {};
  for (var i = 0; i < usageRows.length; i++) {
    var row = usageRows[i];
    var qid = String(row.question_id || '').trim();
    var userLabel = String(row.user_display_name || '').trim() || String(row.user_email || '').trim() || 'Unknown';
    if (qid && !seenQuestions[qid]) {
      byUser[userLabel] = (byUser[userLabel] || 0) + 1;
      seenQuestions[qid] = true;
    }

    var agentIds = MetricsService_expandAgentIds_(row.agent_id);
    for (var a = 0; a < agentIds.length; a++) {
      var aid = agentIds[a];
      byAgent[aid] = (byAgent[aid] || 0) + 1;
    }

    var ms = Number(row.ts_ms || 0) || MetricsService_toMs_(row.ts_iso);
    if (!ms) continue;
    var d = new Date(ms);
    var dd = d.toISOString().slice(0, 10);
    if (!trendMap[dd]) trendMap[dd] = { questions: 0, unanswered: 0 };
    trendMap[dd].questions += 1;
    if (String(row.is_unanswered || '') === '1') trendMap[dd].unanswered += 1;
  }

  var trend = [];
  for (var day in trendMap) {
    if (!Object.prototype.hasOwnProperty.call(trendMap, day)) continue;
    trend.push({
      date: day,
      questions: trendMap[day].questions,
      unanswered: trendMap[day].unanswered,
    });
  }
  trend.sort(function (a, b) {
    return String(a.date).localeCompare(String(b.date));
  });

  return {
    byUser: MetricsService_mapToRank_(byUser, topN),
    byAgent: MetricsService_mapToRank_(byAgent, topN),
    trend: trend,
  };
}

/**
 * @param {number} topN
 * @return {{successByClient:Array<{name:string,count:number}>,successByIndustry:Array<{name:string,count:number}>,proposalByClient:Array<{name:string,count:number}>,proposalByIndustry:Array<{name:string,count:number}>}}
 */
function MetricsService_buildContentLeaderboards_(topN) {
  var res = ContentCatalog_list({ skip: 0, limit: 0, skipReconcile: true });
  var items = (res && res.items) || [];
  var clients = ClientsMaster_list({});
  var clientRows = (clients && clients.items) || [];
  var industryByClient = {};
  for (var c = 0; c < clientRows.length; c++) {
    var cr = clientRows[c];
    var key = String(cr.client_name || '').trim().toLowerCase();
    if (!key) continue;
    industryByClient[key] = String(cr.industry || '').trim();
  }

  var pClient = {};
  var pIndustry = {};
  var sClient = {};
  var sIndustry = {};

  for (var i = 0; i < items.length; i++) {
    var cm = items[i] && items[i].common ? items[i].common : {};
    var type = String(cm.content_type || '').trim();
    if (type !== 'proposal' && type !== 'success_case') continue;
    var clientName = String(cm.client_name || '').trim() || 'Sin cliente';
    var kClient = clientName;
    var lookup = clientName.toLowerCase();
    var industry = industryByClient[lookup] || 'Sin industria';
    if (type === 'proposal') {
      pClient[kClient] = (pClient[kClient] || 0) + 1;
      pIndustry[industry] = (pIndustry[industry] || 0) + 1;
    } else {
      sClient[kClient] = (sClient[kClient] || 0) + 1;
      sIndustry[industry] = (sIndustry[industry] || 0) + 1;
    }
  }

  return {
    successByClient: MetricsService_mapToRank_(sClient, topN),
    successByIndustry: MetricsService_mapToRank_(sIndustry, topN),
    proposalByClient: MetricsService_mapToRank_(pClient, topN),
    proposalByIndustry: MetricsService_mapToRank_(pIndustry, topN),
  };
}

/**
 * @param {Array<Object>} items
 * @param {number} skip
 * @param {number} limit
 * @return {{ok:boolean,items:Array<Object>,total:number,skip:number,limit:number,hasMore:boolean}}
 */
function MetricsService_page_(items, skip, limit) {
  var s = Math.max(0, Number(skip) || 0);
  var l = Math.max(1, Math.min(100, Number(limit) || 25));
  var total = items.length;
  var out = items.slice(s, s + l);
  return {
    ok: true,
    items: out,
    total: total,
    skip: s,
    limit: l,
    hasMore: s + out.length < total,
  };
}

/**
 * @param {string} range
 * @param {number} topN
 * @return {Object}
 */
function MetricsService_dashboard(range, topN) {
  MetricsAuth_requireView();
  var bounds = MetricsService_resolveRange_(range);
  var db = MetricsService_getOrCreateSpreadsheet_();
  var usageRows = MetricsService_readRows_(db.usageSheet, MetricsService_usageHeaders_());
  var filteredUsage = MetricsService_filterRowsByRange_(usageRows, bounds);
  var usageAgg = MetricsService_buildUsageAggregates_(filteredUsage, topN || 10);
  var contentAgg = MetricsService_buildContentLeaderboards_(topN || 10);

  return {
    ok: true,
    range: String(range || '30d'),
    generatedAt: new Date().toISOString(),
    summary: {
      questions: filteredUsage.length,
      unanswered: filteredUsage.filter(function (r) {
        return String(r.is_unanswered || '') === '1';
      }).length,
    },
    leaderboard: {
      users: usageAgg.byUser,
      agents: usageAgg.byAgent,
      successByClient: contentAgg.successByClient,
      successByIndustry: contentAgg.successByIndustry,
      proposalByClient: contentAgg.proposalByClient,
      proposalByIndustry: contentAgg.proposalByIndustry,
    },
    trend: usageAgg.trend,
  };
}

/**
 * @param {Object=} filters
 * @return {{ok:boolean,items:Array<Object>,total:number,skip:number,limit:number,hasMore:boolean}}
 */
function MetricsService_unansweredList(filters) {
  MetricsAuth_requireView();
  var f = filters || {};
  var bounds = MetricsService_resolveRange_(f.range || '30d');
  var db = MetricsService_getOrCreateSpreadsheet_();
  var rows = MetricsService_readRows_(db.unansweredSheet, MetricsService_unansweredHeaders_());
  var filtered = MetricsService_filterRowsByRange_(rows, bounds);
  filtered.sort(function (a, b) {
    return Number(b.ts_ms || 0) - Number(a.ts_ms || 0);
  });
  return MetricsService_page_(filtered, f.skip, f.limit);
}

/**
 * @param {string} kind
 * @param {Object=} filters
 * @return {{ok:boolean,items:Array<Object>,total:number,skip:number,limit:number,hasMore:boolean}}
 */
function MetricsService_leaderboardList(kind, filters) {
  MetricsAuth_requireView();
  var f = filters || {};
  var k = String(kind || '').trim();
  var data = [];

  if (k === 'users' || k === 'agents') {
    var bounds = MetricsService_resolveRange_(f.range || '30d');
    var db = MetricsService_getOrCreateSpreadsheet_();
    var usageRows = MetricsService_readRows_(db.usageSheet, MetricsService_usageHeaders_());
    var filteredUsage = MetricsService_filterRowsByRange_(usageRows, bounds);
    var agg = MetricsService_buildUsageAggregates_(filteredUsage, 9999);
    data = k === 'users' ? agg.byUser : agg.byAgent;
  } else {
    var content = MetricsService_buildContentLeaderboards_(9999);
    if (k === 'success_client') data = content.successByClient;
    else if (k === 'success_industry') data = content.successByIndustry;
    else if (k === 'proposal_client') data = content.proposalByClient;
    else if (k === 'proposal_industry') data = content.proposalByIndustry;
  }

  return MetricsService_page_(data, f.skip, f.limit);
}
