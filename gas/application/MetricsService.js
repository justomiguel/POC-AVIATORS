/**
 * @fileoverview Métricas operativas (uso de chat, no respondidas y leaderboards).
 */

/** @deprecated Solo migración legacy desde planilla; runtime usa Supabase. */
var METRICS_PROP_SPREADSHEET_ID = 'METRICS_SPREADSHEET_ID';
var METRICS_TAB_USAGE_EVENTS = 'usage_events';
var METRICS_TAB_UNANSWERED = 'unanswered_queries';
var METRICS_TAB_MONTHLY = 'monthly_agg';
var METRICS_TAB_FEEDBACK = 'feedback_events';
var METRICS_TAB_CHAT_HISTORY = 'chat_history';
var METRICS_TAB_QUICK_PROMPTS = 'quick_prompts';
/** Visitante (sin fila en `roles`): máximo de conversaciones persistidas. */
var METRICS_CHAT_HISTORY_MAX_VISITOR = 10;
/** Usuario con `role_key` asignado. */
var METRICS_CHAT_HISTORY_MAX_WITH_ROLE = 200;

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

/** @return {string[]} */
function MetricsService_feedbackHeaders_() {
  return [
    'feedback_id',
    'event_id',
    'ts_iso',
    'user_email',
    'role_key',
    'rating',
    'agent_id',
    'agent_name',
    'question_text',
  ];
}

/** @return {string[]} */
function MetricsService_chatHistoryHeaders_() {
  return ['conv_id', 'user_email', 'ts_created', 'title', 'messages_json'];
}

/** @return {string[]} */
function MetricsService_quickPromptsHeaders_() {
  return ['id', 'es', 'en', 'order'];
}

/**
 * @param {string} email
 * @return {boolean}
 */
function MetricsAuth_canView(email) {
  var em = String(email || '').trim();
  if (!em) return false;
  return AdminAuth_emailCanViewMetrics(em);
}

function MetricsAuth_requireView() {
  var email = ('' + Session.getActiveUser().getEmail()).trim();
  if (!MetricsAuth_canView(email)) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_metrics_only'));
  }
}

function MetricsAuth_requireReset() {
  var email = ('' + Session.getActiveUser().getEmail()).trim();
  if (!AdminAuth_emailCanResetMetrics(email)) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_metrics_reset_only'));
  }
}

/**
 * Cola operativa: admin y presales.
 * @param {string} email
 * @return {boolean}
 */
function MetricsAuth_canManageQueue(email) {
  return AdminAuth_emailCanManageUnansweredQueue(email);
}

function MetricsAuth_requireManageQueue() {
  var email = ('' + Session.getActiveUser().getEmail()).trim();
  if (!MetricsAuth_canManageQueue(email)) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_metrics_queue_only'));
  }
}

/**
 * @param {string} agentId
 * @return {string}
 */
function MetricsService_suggestContentTypeFromAgent_(agentId) {
  try {
    return AgentOrchestrator_mapAgentIdToContentType_(agentId) || '';
  } catch (ignore) {
    return '';
  }
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

  MetricsStore_insertUsageEvent_({
    event_id: eventId,
    question_id: questionId,
    ts_iso: nowIso,
    ts_ms: nowMs,
    year_month: MetricsService_toYearMonth_(nowMs),
    user_email: email,
    user_display_name: displayName,
    role_key: roleKey,
    mode: mode,
    agent_id: agentId,
    agent_name: agentName,
    question_text: question,
    is_unanswered: isUnanswered,
    unanswered_code: unansweredCode,
  });
  if (isUnanswered) {
    MetricsStore_insertUnanswered({
      event_id: eventId,
      question_id: questionId,
      ts_iso: nowIso,
      ts_ms: nowMs,
      user_email: email,
      user_display_name: displayName,
      role_key: roleKey,
      mode: mode,
      agent_id: agentId,
      agent_name: agentName,
      question_text: question,
      unanswered_code: unansweredCode || 'UNANSWERED',
      suggested_content_type: MetricsService_suggestContentTypeFromAgent_(agentId),
      queue_status: 'open',
    });
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
    var industry =
      String(cm.industry || '').trim() || industryByClient[lookup] || 'Sin industria';
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
  var usageRows = MetricsStore_listUsageEvents().map(MetricsStore_usageToLegacyRow_);
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
 * @return {{ok:boolean,items:Array<Object>,total:number,skip:number,limit:number,hasMore:boolean,canManage:boolean}}
 */
function MetricsService_unansweredList(filters) {
  MetricsAuth_requireView();
  var f = filters || {};
  var email = ('' + Session.getActiveUser().getEmail()).trim();
  var rows = MetricsStore_listUnansweredQueue(f).map(MetricsStore_unansweredToLegacyRow_);
  rows.sort(function (a, b) {
    return Number(b.ts_ms || 0) - Number(a.ts_ms || 0);
  });
  var page = MetricsService_page_(rows, f.skip, f.limit);
  page.canManage = MetricsAuth_canManageQueue(email);
  return page;
}

/**
 * @return {{ok:boolean,items:Array<{email:string,displayName:string,roleKey:string}>}}
 */
function MetricsService_unansweredAssignees_() {
  MetricsAuth_requireManageQueue();
  var rows = RoleDirectoryStore_listAll();
  var out = [];
  var seen = {};
  var i;
  for (i = 0; i < rows.length; i++) {
    var row = rows[i] || {};
    var em = String(row.email || '').trim();
    if (!em || seen[em.toLowerCase()]) continue;
    if (!AdminAuth_emailCanManageUnansweredQueue(em)) continue;
    var roleKey = String(row.role_key || '').trim();
    seen[em.toLowerCase()] = true;
    var localPart = em.split('@')[0] || em;
    out.push({
      email: em,
      displayName: String(row.role_label || '').trim() || localPart,
      roleKey: roleKey,
    });
  }
  out.sort(function (a, b) {
    return String(a.displayName || a.email).localeCompare(String(b.displayName || b.email));
  });
  return { ok: true, items: out };
}

/**
 * @param {string} eventId
 * @param {string} assigneeEmail
 * @return {{ok:boolean}}
 */
function MetricsService_unansweredAssign_(eventId, assigneeEmail) {
  MetricsAuth_requireManageQueue();
  var eid = String(eventId || '').trim();
  var assignee = String(assigneeEmail || '').trim().toLowerCase();
  if (!eid || !assignee) return { ok: false };

  var allowed = MetricsService_unansweredAssignees_().items || [];
  var match = null;
  for (var i = 0; i < allowed.length; i++) {
    if (String(allowed[i].email || '').trim().toLowerCase() === assignee) {
      match = allowed[i];
      break;
    }
  }
  if (!match) return { ok: false };

  var actor = ('' + Session.getActiveUser().getEmail()).trim();
  var nowIso = new Date().toISOString();
  return MetricsStore_updateUnansweredQueue(eid, {
    assigned_to_email: match.email,
    assigned_to_name: match.displayName || match.email,
    assigned_at: nowIso,
    assigned_by_email: actor,
    queue_status: 'open',
  });
}

/**
 * @param {string} eventId
 * @param {string} status open|missing_content|resolved
 * @param {string=} note
 * @return {{ok:boolean}}
 */
function MetricsService_unansweredSetStatus_(eventId, status, note) {
  MetricsAuth_requireManageQueue();
  var eid = String(eventId || '').trim();
  var st = String(status || '').trim();
  if (!eid) return { ok: false };
  if (st !== 'open' && st !== 'missing_content' && st !== 'resolved') {
    return { ok: false };
  }

  var actor = ('' + Session.getActiveUser().getEmail()).trim();
  var patch = {
    queue_status: st,
    resolution_note: String(note || '').trim().slice(0, 500),
  };
  if (st === 'resolved') {
    patch.resolved_at = new Date().toISOString();
    patch.resolved_by_email = actor;
  }
  return MetricsStore_updateUnansweredQueue(eid, patch);
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
    var usageRowsLb = MetricsStore_listUsageEvents().map(MetricsStore_usageToLegacyRow_);
    var filteredUsage = MetricsService_filterRowsByRange_(usageRowsLb, bounds);
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

/**
 * Reset total de métricas manteniendo headers.
 * @return {{ok:boolean,cleared:{usage:number,unanswered:number,monthly:number}}}
 */
function MetricsService_resetAll() {
  MetricsAuth_requireReset();
  var clearedSb = MetricsStore_clearAll();
  return { ok: true, cleared: clearedSb };
}

// ─── Feedback ────────────────────────────────────────────────────────────────

/**
 * Guarda feedback (👍/👎) para un event_id de usage_events.
 * Si ya existe una fila con el mismo event_id, actualiza el rating.
 * @param {{eventId:string,rating:string,agentId:string,agentName:string,questionText:string}} payload
 * @return {{ok:boolean}}
 */
function MetricsService_trackFeedback_(payload) {
  var p = payload || {};
  var eventId = String(p.eventId || '').trim();
  if (!eventId) return { ok: false };
  var rating = String(p.rating || '').trim();
  if (rating !== 'up' && rating !== 'down') return { ok: false };

  var email = ('' + Session.getActiveUser().getEmail()).trim();
  if (!email) return { ok: false };

  var roleRec = null;
  try { roleRec = RoleDirectory_lookupRole(email); } catch (ignoreRole) {}
  var roleKey = roleRec && roleRec.key ? String(roleRec.key) : 'visitante';

  var nowIso = new Date().toISOString();
  var agentId = String(p.agentId || '').trim();
  var agentName = String(p.agentName || '').trim();
  var questionText = String(p.questionText || '').trim().slice(0, 500);

  return MetricsStore_trackFeedback({
    eventId: eventId,
    rating: rating,
    user_email: email,
    role_key: roleKey,
    agentId: agentId,
    agentName: agentName,
    questionText: questionText,
  });
}

// ─── Chat History ─────────────────────────────────────────────────────────────

/**
 * @param {string} convId
 * @return {boolean}
 */
function MetricsService_isUuidConvId_(convId) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(convId || '').trim(),
  );
}

/**
 * @param {string} email
 * @return {number}
 */
function MetricsService_chatHistoryMaxForEmail_(email) {
  try {
    var rec = RoleDirectory_lookupRole(email);
    if (rec && rec.key) return METRICS_CHAT_HISTORY_MAX_WITH_ROLE;
  } catch (ignoreRole) {}
  return METRICS_CHAT_HISTORY_MAX_VISITOR;
}

/**
 * Guarda o actualiza una conversación para el usuario activo.
 * Topa por rol (visitante 10 · con rol 200) y elimina las más antiguas al exceder.
 * @param {string} convId
 * @param {string} title
 * @param {string} messagesJson
 * @return {{ok:boolean,convId?:string,maxAllowed?:number}}
 */
function MetricsService_chatHistorySave_(convId, title, messagesJson) {
  try {
    AviatorsDataBackend_requireSupabase_();
    var cid = String(convId || '').trim();
    if (!MetricsService_isUuidConvId_(cid)) cid = Utilities.getUuid();
    var email = ('' + Session.getActiveUser().getEmail()).trim();
    if (!email) return { ok: false };

    var safeTitle = String(title || '').trim().slice(0, 80) || '(sin título)';
    var safeJson = String(messagesJson || '[]').trim();
    var maxPerUser = MetricsService_chatHistoryMaxForEmail_(email);

    var saved = MetricsStore_chatHistorySave(
      cid,
      email,
      safeTitle,
      safeJson,
      maxPerUser,
    );
    if (!saved || !saved.ok) return { ok: false };
    return { ok: true, convId: cid, maxAllowed: maxPerUser };
  } catch (e) {
    Logger.log(
      '[MetricsService] chatHistorySave: ' + (e && e.message ? e.message : e),
    );
    return { ok: false };
  }
}

/**
 * Lista las conversaciones del usuario activo (sin messages_json), ordenadas más reciente primero.
 * @return {{ok:boolean,items:Array<{convId:string,title:string,tsCreated:string}>,maxAllowed:number}}
 */
function MetricsService_chatHistoryList_() {
  try {
    AviatorsDataBackend_requireSupabase_();
    var email = ('' + Session.getActiveUser().getEmail()).trim();
    if (!email) return { ok: false, items: [], maxAllowed: METRICS_CHAT_HISTORY_MAX_VISITOR };

    var maxPerUser = MetricsService_chatHistoryMaxForEmail_(email);
    return {
      ok: true,
      items: MetricsStore_chatHistoryList(email, maxPerUser),
      maxAllowed: maxPerUser,
    };
  } catch (e) {
    Logger.log(
      '[MetricsService] chatHistoryList: ' + (e && e.message ? e.message : e),
    );
    return { ok: false, items: [], maxAllowed: METRICS_CHAT_HISTORY_MAX_VISITOR };
  }
}

/**
 * Carga los mensajes de una conversación (solo si pertenece al usuario activo).
 * @param {string} convId
 * @return {{ok:boolean,messagesJson:string}}
 */
function MetricsService_chatHistoryLoad_(convId) {
  try {
    AviatorsDataBackend_requireSupabase_();
    var cid = String(convId || '').trim();
    if (!cid || !MetricsService_isUuidConvId_(cid)) {
      return { ok: false, messagesJson: '[]' };
    }
    var email = ('' + Session.getActiveUser().getEmail()).trim();
    if (!email) return { ok: false, messagesJson: '[]' };

    var mj = MetricsStore_chatHistoryLoad(cid, email);
    if (mj === '[]') {
      var qCheck = SupabaseRest_select(
        SUPABASE_TABLE.CHAT_CONVERSATIONS,
        SupabaseRest_query_([
          'select=conv_id',
          SupabaseRest_filter_('conv_id', 'eq', cid),
          SupabaseRest_filter_('user_email', 'eq', email),
          'limit=1',
        ]),
      );
      if (!qCheck.length) return { ok: false, messagesJson: '[]' };
    }
    return { ok: true, messagesJson: mj };
  } catch (e) {
    Logger.log(
      '[MetricsService] chatHistoryLoad: ' + (e && e.message ? e.message : e),
    );
    return { ok: false, messagesJson: '[]' };
  }
}

/**
 * Elimina una conversación (solo si pertenece al usuario activo).
 * @param {string} convId
 * @return {{ok:boolean}}
 */
function MetricsService_chatHistoryDelete_(convId) {
  try {
    AviatorsDataBackend_requireSupabase_();
    var cid = String(convId || '').trim();
    if (!cid || !MetricsService_isUuidConvId_(cid)) return { ok: false };
    var email = ('' + Session.getActiveUser().getEmail()).trim();
    if (!email) return { ok: false };

    MetricsStore_chatHistoryDelete(cid, email);
    return { ok: true };
  } catch (e) {
    Logger.log(
      '[MetricsService] chatHistoryDelete: ' + (e && e.message ? e.message : e),
    );
    return { ok: false };
  }
}

// ─── Quick Prompts ─────────────────────────────────────────────────────────────

var METRICS_QUICK_PROMPTS_DEFAULTS_ = [
  { id: 'qp1', es: '¿Casos de éxito con NDC?', en: 'Success cases with NDC', order: 1 },
  { id: 'qp2', es: '¿Que hicimos con Iberia?', en: 'What did we do with Iberia?', order: 2 },
  { id: 'qp3', es: '¿Qué clientes tiene Globant en aviación?', en: 'Which clients does Globant have in aviation?', order: 3 },
];

var METRICS_ONBOARDING_QUICK_PROMPTS_DEFAULTS_ = [
  { id: 'ob1', es: '¿Qué es PSS y para qué sirve?', en: 'What is PSS and what is it for?', order: 1 },
  { id: 'ob2', es: '¿Qué es NDC?', en: 'What is NDC?', order: 2 },
  { id: 'ob3', es: '¿Cómo funciona un programa de loyalty?', en: 'How does a loyalty program work?', order: 3 },
  { id: 'ob4', es: 'Metodología del Aviation Studio', en: 'Aviation Studio methodology', order: 4 },
  { id: 'ob5', es: '¿Qué es un GDS?', en: 'What is a GDS?', order: 5 },
];

var METRICS_GLOBANT_OFFERING_QUICK_PROMPTS_DEFAULTS_ = [
  {
    id: 'go1',
    es: '¿Qué Studios de Globant encajan en aviación?',
    en: 'Which Globant Studios fit aviation?',
    order: 1,
  },
  {
    id: 'go2',
    es: '¿Qué es AI Pods y cuándo conviene usarlo?',
    en: 'What are AI Pods and when should we use them?',
    order: 2,
  },
  {
    id: 'go3',
    es: '¿Qué offerings comerciales tenemos documentados?',
    en: 'What commercial offerings do we have documented?',
    order: 3,
  },
  {
    id: 'go4',
    es: 'Casos de éxito para una RFP de transformación digital',
    en: 'Success cases for a digital transformation RFP',
    order: 4,
  },
];

/**
 * @param {string} scope — «home» u «onboarding»
 * @param {Array<{id:string,es:string,en:string,order:number}>} defaults
 * @return {Array<{id:string,es:string,en:string,order:number}>}
 */
function MetricsService_quickPromptsGetForScope_(scope, defaults) {
  var sc = String(scope || 'home').trim() || 'home';
  var sbRows = MetricsStore_quickPromptsList(sc);
  if (!sbRows.length) return defaults;
  var outSb = [];
  for (var si = 0; si < sbRows.length; si++) {
    outSb.push({
      id: String(sbRows[si].id || ''),
      es: String(sbRows[si].es || ''),
      en: String(sbRows[si].en || ''),
      order: Number(sbRows[si].sort_order || 0) || (si + 1),
    });
  }
  if (!outSb.length) return defaults;
  outSb.sort(function (a, b) { return a.order - b.order; });
  return outSb;
}

/**
 * Lee prompts del chat home (orquestador).
 * @return {Array<{id:string,es:string,en:string,order:number}>}
 */
function MetricsService_quickPromptsGet_() {
  return MetricsService_quickPromptsGetForScope_('home', METRICS_QUICK_PROMPTS_DEFAULTS_);
}

/**
 * Lee prompts del chat onboarding.
 * @return {Array<{id:string,es:string,en:string,order:number}>}
 */
function MetricsService_onboardingQuickPromptsGet_() {
  return MetricsService_quickPromptsGetForScope_(
    'onboarding',
    METRICS_ONBOARDING_QUICK_PROMPTS_DEFAULTS_,
  );
}

/**
 * Lee prompts del chat Globant Offering (agente proposals).
 * @return {Array<{id:string,es:string,en:string,order:number}>}
 */
function MetricsService_globantOfferingQuickPromptsGet_() {
  return MetricsService_quickPromptsGetForScope_(
    'globant-offering',
    METRICS_GLOBANT_OFFERING_QUICK_PROMPTS_DEFAULTS_,
  );
}

/**
 * Reemplaza prompts de un alcance (clear + re-append).
 * @param {Array<{id:string,es:string,en:string,order:number}>} prompts
 * @param {string=} scope
 * @return {{ok:boolean}}
 */
function MetricsService_quickPromptsSaveForScope_(prompts, scope) {
  if (!Array.isArray(prompts)) return { ok: false };
  var sc = String(scope || 'home').trim() || 'home';
  MetricsStore_quickPromptsReplaceAll(prompts, sc);
  return { ok: true };
}

/**
 * @param {Array<{id:string,es:string,en:string,order:number}>} prompts
 * @return {{ok:boolean}}
 */
function MetricsService_quickPromptsSave_(prompts) {
  return MetricsService_quickPromptsSaveForScope_(prompts, 'home');
}

/**
 * @param {Array<{id:string,es:string,en:string,order:number}>} prompts
 * @return {{ok:boolean}}
 */
function MetricsService_onboardingQuickPromptsSave_(prompts) {
  return MetricsService_quickPromptsSaveForScope_(prompts, 'onboarding');
}

/**
 * @param {Array<{id:string,es:string,en:string,order:number}>} prompts
 * @return {{ok:boolean}}
 */
function MetricsService_globantOfferingQuickPromptsSave_(prompts) {
  return MetricsService_quickPromptsSaveForScope_(prompts, 'globant-offering');
}
