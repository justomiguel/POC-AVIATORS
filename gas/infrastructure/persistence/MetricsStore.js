/**
 * @fileoverview Persistencia de métricas en Supabase.
 */

var METRICS_STORE_PAGE_SIZE_ = 500;

var METRICS_STORE_FETCH_MAX_ROWS_ = 20000;

var METRICS_USAGE_DASHBOARD_COLUMNS_ =
  'event_id,question_id,ts_iso,ts_ms,year_month,user_email,user_display_name,role_key,' +
  'mode,agent_id,agent_name,is_unanswered,unanswered_code';

var METRICS_MODULE_VISIT_COLUMNS_ =
  'visit_id,ts_iso,ts_ms,year_month,user_email,user_display_name,role_key,module_key';

var METRICS_FEEDBACK_DASHBOARD_COLUMNS_ =
  'feedback_id,event_id,ts_iso,user_email,role_key,rating,agent_id,agent_name';

/**
 * @param {function(number,number):Array<Object>} fetchPageFn
 * @param {number} maxRows
 * @return {Array<Object>}
 */
function MetricsStore_fetchAllPages_(fetchPageFn, maxRows) {
  var cap = Math.max(METRICS_STORE_PAGE_SIZE_, Number(maxRows) || METRICS_STORE_FETCH_MAX_ROWS_);
  /** @type {Array<Object>} */
  var out = [];
  var skip = 0;
  while (out.length < cap) {
    var page = fetchPageFn(skip, METRICS_STORE_PAGE_SIZE_);
    if (!page || !page.length) break;
    out = out.concat(page);
    if (page.length < METRICS_STORE_PAGE_SIZE_) break;
    skip += METRICS_STORE_PAGE_SIZE_;
  }
  if (out.length > cap) out = out.slice(0, cap);
  return out;
}

/**
 * @param {number} startMs
 * @param {number} endMs
 * @param {number} skip
 * @param {number} limit
 * @return {Array<Object>}
 */
function MetricsStore_listUsageEventsInRange(startMs, endMs, skip, limit) {
  var s = Math.max(0, Number(skip) || 0);
  var lim = Math.min(METRICS_STORE_PAGE_SIZE_, Math.max(1, Number(limit) || METRICS_STORE_PAGE_SIZE_));
  var start = Math.max(0, Number(startMs) || 0);
  var end = Math.max(start, Number(endMs) || 0);
  var q = SupabaseRest_query_([
    'select=' + METRICS_USAGE_DASHBOARD_COLUMNS_,
    SupabaseRest_filter_('ts_ms', 'gte', start),
    SupabaseRest_filter_('ts_ms', 'lte', end),
    'order=ts_ms.desc',
    'offset=' + s,
    'limit=' + lim,
  ]);
  return SupabaseRest_select(SUPABASE_TABLE.USAGE_EVENTS, q);
}

/**
 * @param {number} startMs
 * @param {number} endMs
 * @return {Array<Object>}
 */
function MetricsStore_listUsageEventsInRangeAll_(startMs, endMs) {
  return MetricsStore_fetchAllPages_(function (skip, limit) {
    return MetricsStore_listUsageEventsInRange(startMs, endMs, skip, limit);
  }, METRICS_STORE_FETCH_MAX_ROWS_);
}

/**
 * @return {Array<Object>}
 */
function MetricsStore_listUsageEvents() {
  return MetricsStore_listUsageEventsInRangeAll_(0, Date.now() + 86400000);
}

/**
 * @param {number} startMs
 * @param {number} endMs
 * @param {number} skip
 * @param {number} limit
 * @return {Array<Object>}
 */
function MetricsStore_listModuleVisitsInRange(startMs, endMs, skip, limit) {
  var s = Math.max(0, Number(skip) || 0);
  var lim = Math.min(METRICS_STORE_PAGE_SIZE_, Math.max(1, Number(limit) || METRICS_STORE_PAGE_SIZE_));
  var start = Math.max(0, Number(startMs) || 0);
  var end = Math.max(start, Number(endMs) || 0);
  var q = SupabaseRest_query_([
    'select=' + METRICS_MODULE_VISIT_COLUMNS_,
    SupabaseRest_filter_('ts_ms', 'gte', start),
    SupabaseRest_filter_('ts_ms', 'lte', end),
    'order=ts_ms.desc',
    'offset=' + s,
    'limit=' + lim,
  ]);
  return SupabaseRest_select(SUPABASE_TABLE.MODULE_VISITS, q);
}

/**
 * @param {number} startMs
 * @param {number} endMs
 * @return {Array<Object>}
 */
function MetricsStore_listModuleVisitsInRangeAll_(startMs, endMs) {
  return MetricsStore_fetchAllPages_(function (skip, limit) {
    return MetricsStore_listModuleVisitsInRange(startMs, endMs, skip, limit);
  }, METRICS_STORE_FETCH_MAX_ROWS_);
}

/**
 * @return {Array<Object>}
 */
function MetricsStore_listModuleVisits() {
  return MetricsStore_listModuleVisitsInRangeAll_(0, Date.now() + 86400000);
}

/**
 * @param {string} startIso
 * @param {string} endIso
 * @param {number} skip
 * @param {number} limit
 * @return {Array<Object>}
 */
function MetricsStore_listFeedbackEventsInRange(startIso, endIso, skip, limit) {
  var s = Math.max(0, Number(skip) || 0);
  var lim = Math.min(METRICS_STORE_PAGE_SIZE_, Math.max(1, Number(limit) || METRICS_STORE_PAGE_SIZE_));
  var qParts = [
    'select=' + METRICS_FEEDBACK_DASHBOARD_COLUMNS_,
    SupabaseRest_filter_('ts_iso', 'gte', String(startIso || '')),
    SupabaseRest_filter_('ts_iso', 'lte', String(endIso || '')),
    'order=ts_iso.desc',
    'offset=' + s,
    'limit=' + lim,
  ];
  return SupabaseRest_select(SUPABASE_TABLE.FEEDBACK_EVENTS, SupabaseRest_query_(qParts));
}

/**
 * @param {string} startIso
 * @param {string} endIso
 * @return {Array<Object>}
 */
function MetricsStore_listFeedbackEventsInRangeAll_(startIso, endIso) {
  return MetricsStore_fetchAllPages_(function (skip, limit) {
    return MetricsStore_listFeedbackEventsInRange(startIso, endIso, skip, limit);
  }, METRICS_STORE_FETCH_MAX_ROWS_);
}

/**
 * @return {Array<Object>}
 */
function MetricsStore_listFeedbackEvents() {
  var end = new Date().toISOString();
  var start = new Date(Date.now() - 365 * 86400000).toISOString();
  return MetricsStore_listFeedbackEventsInRangeAll_(start, end);
}

/**
 * @return {number}
 */
function MetricsStore_countChatConversations() {
  return SupabaseRest_count(
    SUPABASE_TABLE.CHAT_CONVERSATIONS,
    SupabaseRest_query_(['select=conv_id', 'limit=0']),
  );
}

/**
 * @return {Array<Object>}
 */
function MetricsStore_listUnansweredQueue(filters) {
  var f = filters || {};
  var qParts = [
    'select=*',
    SupabaseRest_filter_('queue_status', 'in', '(open,missing_content)'),
    'order=ts_ms.desc',
  ];
  if (f.assignedTo) {
    qParts.push(
      SupabaseRest_filter_('assigned_to_email', 'eq', String(f.assignedTo || '').trim()),
    );
  }
  if (f.status === 'open' || f.status === 'missing_content') {
    qParts.splice(1, 1, SupabaseRest_filter_('queue_status', 'eq', f.status));
  }
  return SupabaseRest_select(SUPABASE_TABLE.UNANSWERED_QUERIES, SupabaseRest_query_(qParts));
}

/**
 * @param {string} eventId
 * @return {Object|null}
 */
function MetricsStore_getUnansweredByEventId(eventId) {
  var eid = String(eventId || '').trim();
  if (!eid) return null;
  var rows = SupabaseRest_select(
    SUPABASE_TABLE.UNANSWERED_QUERIES,
    SupabaseRest_query_([
      'select=*',
      SupabaseRest_filter_('event_id', 'eq', eid),
      'limit=1',
    ]),
  );
  return rows.length ? rows[0] : null;
}

/**
 * @param {string} eventId
 * @param {Object} patch
 * @return {{ok:boolean}}
 */
function MetricsStore_updateUnansweredQueue(eventId, patch) {
  var eid = String(eventId || '').trim();
  if (!eid) return { ok: false };
  var existing = MetricsStore_getUnansweredByEventId(eid);
  if (!existing) return { ok: false };
  if (String(existing.queue_status || '') === 'resolved') return { ok: false };

  var body = {};
  var k;
  for (k in patch) {
    if (!Object.prototype.hasOwnProperty.call(patch, k)) continue;
    body[k] = patch[k];
  }
  if (!Object.keys(body).length) return { ok: false };

  SupabaseRest_update(
    SUPABASE_TABLE.UNANSWERED_QUERIES,
    body,
    SupabaseRest_query_([SupabaseRest_filter_('event_id', 'eq', eid)]),
  );
  return { ok: true };
}

/**
 * @param {Object} row
 */
function MetricsStore_insertUsageEvent(row) {
  MetricsStore_insertUsageEvent_(row);
}
/**
 * @param {Object} row
 */
function MetricsStore_insertModuleVisit(row) {
  SupabaseRest_insert(
    SUPABASE_TABLE.MODULE_VISITS,
    {
      visit_id: row.visit_id,
      ts_iso: row.ts_iso,
      ts_ms: Number(row.ts_ms),
      year_month: row.year_month,
      user_email: row.user_email,
      user_display_name: row.user_display_name || '',
      role_key: row.role_key || '',
      module_key: row.module_key,
    },
    { prefer: 'return=minimal' },
  );
}

/**
 * @param {Object} row
 */
function MetricsStore_insertUsageEvent_(row) {
  SupabaseRest_insert(SUPABASE_TABLE.USAGE_EVENTS, {
    event_id: row.event_id,
    question_id: row.question_id,
    ts_iso: row.ts_iso,
    ts_ms: Number(row.ts_ms),
    year_month: row.year_month,
    user_email: row.user_email,
    user_display_name: row.user_display_name || '',
    role_key: row.role_key || '',
    mode: row.mode || 'chat',
    agent_id: row.agent_id || '',
    agent_name: row.agent_name || '',
    question_text: row.question_text || '',
    is_unanswered: !!row.is_unanswered,
    unanswered_code: row.unanswered_code || '',
  }, { prefer: 'return=minimal' });
}

/**
 * @param {Object} row
 */
function MetricsStore_insertUnanswered(row) {
  SupabaseRest_insert(SUPABASE_TABLE.UNANSWERED_QUERIES, {
    event_id: row.event_id,
    question_id: row.question_id,
    ts_iso: row.ts_iso,
    ts_ms: Number(row.ts_ms),
    user_email: row.user_email,
    user_display_name: row.user_display_name || '',
    role_key: row.role_key || '',
    mode: row.mode || 'chat',
    agent_id: row.agent_id || '',
    agent_name: row.agent_name || '',
    question_text: row.question_text || '',
    unanswered_code: row.unanswered_code || 'UNANSWERED',
    queue_status: String(row.queue_status || 'open'),
    assigned_to_email: String(row.assigned_to_email || ''),
    assigned_to_name: String(row.assigned_to_name || ''),
    assigned_by_email: String(row.assigned_by_email || ''),
    resolution_note: String(row.resolution_note || ''),
    suggested_content_type: String(row.suggested_content_type || ''),
  }, { prefer: 'return=minimal' });
}

/**
 * Convierte fila Supabase al shape legacy de hoja.
 * @param {Object} row
 * @return {Object}
 */
function MetricsStore_usageToLegacyRow_(row) {
  return {
    event_id: String(row.event_id || ''),
    question_id: String(row.question_id || ''),
    ts_iso: String(row.ts_iso || ''),
    ts_ms: Number(row.ts_ms || 0),
    year_month: String(row.year_month || ''),
    user_email: String(row.user_email || ''),
    user_display_name: String(row.user_display_name || ''),
    role_key: String(row.role_key || ''),
    mode: String(row.mode || ''),
    agent_id: String(row.agent_id || ''),
    agent_name: String(row.agent_name || ''),
    question_text: String(row.question_text || ''),
    is_unanswered: row.is_unanswered ? '1' : '0',
    unanswered_code: String(row.unanswered_code || ''),
  };
}

/**
 * @param {Object} row
 * @return {Object}
 */
function MetricsStore_unansweredToLegacyRow_(row) {
  return {
    event_id: String(row.event_id || ''),
    question_id: String(row.question_id || ''),
    ts_iso: String(row.ts_iso || ''),
    ts_ms: Number(row.ts_ms || 0),
    user_email: String(row.user_email || ''),
    user_display_name: String(row.user_display_name || ''),
    role_key: String(row.role_key || ''),
    mode: String(row.mode || ''),
    agent_id: String(row.agent_id || ''),
    agent_name: String(row.agent_name || ''),
    question_text: String(row.question_text || ''),
    unanswered_code: String(row.unanswered_code || ''),
    queue_status: String(row.queue_status || 'open'),
    assigned_to_email: String(row.assigned_to_email || ''),
    assigned_to_name: String(row.assigned_to_name || ''),
    assigned_at: String(row.assigned_at || ''),
    assigned_by_email: String(row.assigned_by_email || ''),
    resolved_at: String(row.resolved_at || ''),
    resolved_by_email: String(row.resolved_by_email || ''),
    resolution_note: String(row.resolution_note || ''),
    suggested_content_type: String(row.suggested_content_type || ''),
  };
}

/**
 * @param {Object} payload
 * @return {{ok:boolean}}
 */
function MetricsStore_trackFeedback(payload) {
  var p = payload || {};
  var eventId = String(p.eventId || '').trim();
  if (!eventId) return { ok: false };

  var q = SupabaseRest_query_([
    'select=feedback_id',
    SupabaseRest_filter_('event_id', 'eq', eventId),
    'limit=1',
  ]);
  var existing = SupabaseRest_select(SUPABASE_TABLE.FEEDBACK_EVENTS, q);
  var nowIso = new Date().toISOString();
  if (existing.length) {
    SupabaseRest_update(
      SUPABASE_TABLE.FEEDBACK_EVENTS,
      { rating: p.rating, ts_iso: nowIso },
      SupabaseRest_filter_('event_id', 'eq', eventId),
    );
    return { ok: true };
  }

  SupabaseRest_insert(SUPABASE_TABLE.FEEDBACK_EVENTS, {
    feedback_id: Utilities.getUuid(),
    event_id: eventId,
    ts_iso: nowIso,
    user_email: p.user_email,
    role_key: p.role_key || '',
    rating: p.rating,
    agent_id: p.agentId || '',
    agent_name: p.agentName || '',
    question_text: p.questionText || '',
  }, { prefer: 'return=minimal' });
  return { ok: true };
}

/**
 * @param {string} convId
 * @param {string} email
 * @param {string} title
 * @param {string} messagesJson
 * @param {number} maxPerUser
 * @return {{ok:boolean}}
 */
function MetricsStore_chatHistorySave(convId, email, title, messagesJson, maxPerUser) {
  var cid = String(convId || '').trim();
  var em = String(email || '').trim();
  if (!cid || !em) return { ok: false };

  var q = SupabaseRest_query_([
    'select=conv_id',
    SupabaseRest_filter_('conv_id', 'eq', cid),
    SupabaseRest_filter_('user_email', 'eq', em),
    'limit=1',
  ]);
  var existing = SupabaseRest_select(SUPABASE_TABLE.CHAT_CONVERSATIONS, q);
  var nowIso = new Date().toISOString();
  var messages;
  try {
    messages = JSON.parse(String(messagesJson || '[]'));
  } catch (ignoreParse) {
    messages = [];
  }

  if (existing.length) {
    SupabaseRest_update(
      SUPABASE_TABLE.CHAT_CONVERSATIONS,
      {
        ts_created: nowIso,
        title: title,
        messages_json: messages,
      },
      SupabaseRest_query_([
        SupabaseRest_filter_('conv_id', 'eq', cid),
        SupabaseRest_filter_('user_email', 'eq', em),
      ]),
    );
  } else {
    SupabaseRest_insert(SUPABASE_TABLE.CHAT_CONVERSATIONS, {
      conv_id: cid,
      user_email: em,
      ts_created: nowIso,
      title: title,
      messages_json: messages,
    }, { prefer: 'return=minimal' });
  }

  MetricsStore_enforceChatCap_(em, maxPerUser);
  return { ok: true };
}

/**
 * @param {string} email
 * @param {number} maxPerUser
 */
function MetricsStore_enforceChatCap_(email, maxPerUser) {
  var cap = Math.max(1, Number(maxPerUser) || 10);
  var q = SupabaseRest_query_([
    'select=conv_id,ts_created',
    SupabaseRest_filter_('user_email', 'eq', email),
    'order=ts_created.asc',
  ]);
  var rows = SupabaseRest_select(SUPABASE_TABLE.CHAT_CONVERSATIONS, q);
  if (rows.length <= cap) return;
  var toDelete = rows.length - cap;
  for (var i = 0; i < toDelete; i++) {
    SupabaseRest_delete(
      SUPABASE_TABLE.CHAT_CONVERSATIONS,
      SupabaseRest_query_([
        SupabaseRest_filter_('conv_id', 'eq', String(rows[i].conv_id || '')),
        SupabaseRest_filter_('user_email', 'eq', email),
      ]),
    );
  }
}

/**
 * @param {string} email
 * @param {number} [maxItems]
 * @return {Array<Object>}
 */
function MetricsStore_chatHistoryList(email, maxItems) {
  var em = String(email || '').trim();
  if (!em) return [];
  var cap = Math.max(1, Number(maxItems) || 200);
  var q = SupabaseRest_query_([
    'select=conv_id,ts_created,title',
    SupabaseRest_filter_('user_email', 'eq', em),
    'order=ts_created.desc',
    'limit=' + cap,
  ]);
  var rows = SupabaseRest_select(SUPABASE_TABLE.CHAT_CONVERSATIONS, q);
  return rows.map(function (r) {
    return {
      convId: String(r.conv_id || ''),
      tsCreated: String(r.ts_created || ''),
      title: String(r.title || ''),
    };
  });
}

/**
 * @param {string} convId
 * @param {string} email
 * @return {string}
 */
function MetricsStore_chatHistoryLoad(convId, email) {
  var q = SupabaseRest_query_([
    'select=messages_json',
    SupabaseRest_filter_('conv_id', 'eq', String(convId || '')),
    SupabaseRest_filter_('user_email', 'eq', String(email || '')),
    'limit=1',
  ]);
  var rows = SupabaseRest_select(SUPABASE_TABLE.CHAT_CONVERSATIONS, q);
  if (!rows.length) return '[]';
  var mj = rows[0].messages_json;
  if (typeof mj === 'string') return mj;
  try {
    return JSON.stringify(mj || []);
  } catch (ignore) {
    return '[]';
  }
}

/**
 * @param {string} convId
 * @param {string} email
 * @return {boolean}
 */
function MetricsStore_chatHistoryDelete(convId, email) {
  SupabaseRest_delete(
    SUPABASE_TABLE.CHAT_CONVERSATIONS,
    SupabaseRest_query_([
      SupabaseRest_filter_('conv_id', 'eq', String(convId || '')),
      SupabaseRest_filter_('user_email', 'eq', String(email || '')),
    ]),
  );
  return true;
}

/**
 * @param {string=} scope — «home» u «onboarding»
 * @return {Array<Object>}
 */
function MetricsStore_quickPromptsList(scope) {
  var sc = String(scope || 'home').trim() || 'home';
  return SupabaseRest_select(
    SUPABASE_TABLE.QUICK_PROMPTS,
    SupabaseRest_query_([
      'select=id,es,en,sort_order,scope',
      'order=sort_order.asc',
      SupabaseRest_filter_('scope', 'eq', sc),
    ]),
  );
}

/**
 * @param {Array<Object>} prompts
 * @param {string=} scope
 */
function MetricsStore_quickPromptsReplaceAll(prompts, scope) {
  var sc = String(scope || 'home').trim() || 'home';
  SupabaseRest_delete(
    SUPABASE_TABLE.QUICK_PROMPTS,
    SupabaseRest_query_([SupabaseRest_filter_('scope', 'eq', sc)]),
  );
  if (!prompts || !prompts.length) return;
  var rows = [];
  for (var i = 0; i < prompts.length; i++) {
    var p = prompts[i] || {};
    rows.push({
      id: String(p.id || '').trim() || Utilities.getUuid().slice(0, 8),
      es: String(p.es || '').trim(),
      en: String(p.en || '').trim(),
      sort_order: Number(p.order || 0) || (i + 1),
      scope: sc,
    });
  }
  SupabaseRest_insert(SUPABASE_TABLE.QUICK_PROMPTS, rows, { prefer: 'return=minimal' });
}

/**
 * @return {Object<string,number>}
 */
function MetricsStore_clearAll() {
  var usage = MetricsStore_listUsageEvents().length;
  var unanswered = SupabaseRest_select(
    SUPABASE_TABLE.UNANSWERED_QUERIES,
    'select=event_id',
  ).length;
  var feedback = SupabaseRest_select(SUPABASE_TABLE.FEEDBACK_EVENTS, 'select=feedback_id').length;
  var chat = SupabaseRest_select(SUPABASE_TABLE.CHAT_CONVERSATIONS, 'select=conv_id').length;
  var prompts = MetricsStore_quickPromptsList().length;
  var moduleVisits = MetricsStore_listModuleVisits().length;

  SupabaseRest_delete(SUPABASE_TABLE.USAGE_EVENTS, 'event_id=not.is.null');
  SupabaseRest_delete(SUPABASE_TABLE.UNANSWERED_QUERIES, 'event_id=not.is.null');
  SupabaseRest_delete(SUPABASE_TABLE.FEEDBACK_EVENTS, 'feedback_id=not.is.null');
  SupabaseRest_delete(SUPABASE_TABLE.CHAT_CONVERSATIONS, 'conv_id=not.is.null');
  SupabaseRest_delete(SUPABASE_TABLE.QUICK_PROMPTS, 'id=not.is.null');
  SupabaseRest_delete(SUPABASE_TABLE.MODULE_VISITS, 'visit_id=not.is.null');

  return {
    usage: usage,
    unanswered: unanswered,
    monthly: 0,
    feedback: feedback,
    chatHistory: chat,
    quickPrompts: prompts,
    moduleVisits: moduleVisits,
  };
}
