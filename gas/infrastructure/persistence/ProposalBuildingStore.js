/**
 * @fileoverview Persistencia de sesiones de armado de propuestas en Supabase.
 */

/** @type {number} */
var PROPOSAL_BUILDING_STORE_MAX_LIMIT_ = 100;

/** @type {number} */
var PROPOSAL_BUILDING_STORE_DEFAULT_LIMIT_ = 25;

/**
 * @param {Object} row
 * @return {Object}
 */
function ProposalBuildingStore_rowToSession_(row) {
  row = row || {};
  return {
    sessionId: String(row.session_id || ''),
    userEmail: String(row.user_email || ''),
    status: String(row.status || 'in_progress'),
    builderStep: String(row.builder_step || 'materials'),
    title: String(row.title || ''),
    clientName: String(row.client_name || ''),
    industryKey: String(row.industry_key || ''),
    proposalName: String(row.proposal_name || ''),
    rfpDeadline: String(row.rfp_deadline || ''),
    commercialModel: String(row.commercial_model || ''),
    projectSummary: String(row.project_summary || ''),
    draftBrief: row.draft_brief_json && typeof row.draft_brief_json === 'object' ? row.draft_brief_json : {},
    validatedBrief:
      row.validated_brief_json && typeof row.validated_brief_json === 'object'
        ? row.validated_brief_json
        : null,
    materials: Array.isArray(row.materials_json) ? row.materials_json : [],
    aiResponses: Array.isArray(row.ai_responses_json) ? row.ai_responses_json : [],
    studioRecommendations: Array.isArray(row.studio_recommendations_json)
      ? row.studio_recommendations_json
      : [],
    context: row.context_json && typeof row.context_json === 'object' ? row.context_json : {},
    deckFileId: String(row.deck_file_id || ''),
    deckFileUrl: String(row.deck_file_url || ''),
    deckFileName: String(row.deck_file_name || ''),
    checklistFileId: String(row.checklist_file_id || ''),
    checklistFileUrl: String(row.checklist_file_url || ''),
    checklistFileName: String(row.checklist_file_name || ''),
    packageFolderId: String(row.package_folder_id || ''),
    packageFolderUrl: String(row.package_folder_url || ''),
    packageFolderName: String(row.package_folder_name || ''),
    createdAt: String(row.created_at || ''),
    updatedAt: String(row.updated_at || ''),
  };
}

/**
 * Sesiones para métricas admin (sin messages_json pesado).
 * @return {Array<Object>}
 */
function ProposalBuildingStore_listAllForMetrics() {
  return SupabaseRest_select(
    SUPABASE_TABLE.PROPOSAL_BUILDING_SESSIONS,
    SupabaseRest_query_([
      'select=session_id,status,created_at,updated_at,user_email,client_name',
      'order=created_at.desc',
    ]),
  );
}

/**
 * @param {string} email
 * @param {Object|string=} filters
 * @return {number}
 */
function ProposalBuildingStore_countByUser(email, filters) {
  var em = String(email || '').trim();
  if (!em) return 0;
  var q = SupabaseRest_query_(
    ['select=session_id']
      .concat(ProposalBuildingStore_userListFilters_(email, filters))
      .concat(['limit=0']),
  );
  return SupabaseRest_count(SUPABASE_TABLE.PROPOSAL_BUILDING_SESSIONS, q);
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
    } catch (eParse) {
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
    industry = raw.industry === 'Logistica' || raw.industry === 'Aerolineas' ? String(raw.industry) : '';
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
 * @param {string} q
 * @return {string}
 */
function ProposalBuildingStore_searchOrPart_(q) {
  var escaped = SupabaseRest_escapeFilterValue_(String(q || '').trim());
  if (!escaped) return '';
  var pattern = '*' + escaped + '*';
  var fields = ['client_name', 'proposal_name', 'title', 'project_summary'];
  var clauses = [];
  var i;
  for (i = 0; i < fields.length; i++) {
    clauses.push(fields[i] + '.ilike.' + pattern);
  }
  return 'or=(' + clauses.join(',') + ')';
}

/**
 * @param {string} deliverablesKey
 * @return {string}
 */
function ProposalBuildingStore_deliverablesFilterPart_(deliverablesKey) {
  var key = String(deliverablesKey || '').trim().toLowerCase();
  if (key === 'deck') return SupabaseRest_filter_('deck_file_id', 'neq', '');
  if (key === 'package') return SupabaseRest_filter_('package_folder_id', 'neq', '');
  if (key === 'any') return 'or=(deck_file_id.neq.,package_folder_id.neq.)';
  if (key === 'none') return 'and=(deck_file_id.eq.,package_folder_id.eq.)';
  return '';
}

/**
 * @param {string} email
 * @param {Object|string=} filters
 * @return {Array<string>}
 */
function ProposalBuildingStore_userListFilters_(email, filters) {
  var em = String(email || '').trim();
  var normalized =
    typeof filters === 'string'
      ? ProposalBuildingStore_normalizeListFilters_(filters, null)
      : ProposalBuildingStore_normalizeListFilters_(filters && filters.status, filters);
  var parts = [SupabaseRest_filter_('user_email', 'eq', em)];
  var status = ProposalBuildingStore_resolveStatusFilter_(normalized.status);
  if (status) parts.push(SupabaseRest_filter_('status', 'eq', status));
  if (normalized.industry) {
    parts.push(SupabaseRest_filter_('industry_key', 'eq', normalized.industry));
  }
  if (normalized.builderStep) {
    parts.push(SupabaseRest_filter_('builder_step', 'eq', normalized.builderStep));
  }
  if (normalized.query) {
    var searchPart = ProposalBuildingStore_searchOrPart_(normalized.query);
    if (searchPart) parts.push(searchPart);
  }
  var deliverablesPart = ProposalBuildingStore_deliverablesFilterPart_(normalized.deliverables);
  if (deliverablesPart) parts.push(deliverablesPart);
  return parts;
}

/** @const {Object<string, string>} */
var PROPOSAL_BUILDING_STORE_SORT_COLUMNS_ = {
  client: 'client_name',
  proposal: 'proposal_name',
  industry: 'industry_key',
  status: 'status',
  deadline: 'rfp_deadline',
  updated: 'updated_at',
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
  var orderCol = ProposalBuildingStore_resolveSortColumn_(sortBy);
  var orderDir = ProposalBuildingStore_resolveSortDirection_(sortDir);
  var q = SupabaseRest_query_(
    ['select=*']
      .concat(ProposalBuildingStore_userListFilters_(email, filters))
      .concat([
        'order=' + orderCol + '.' + orderDir + ',session_id.asc',
        'offset=' + s,
        'limit=' + lim,
      ]),
  );
  var rows = SupabaseRest_select(SUPABASE_TABLE.PROPOSAL_BUILDING_SESSIONS, q);
  return rows.map(ProposalBuildingStore_rowToSession_);
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
  var q = SupabaseRest_query_([
    'select=*',
    SupabaseRest_filter_('session_id', 'eq', sid),
    SupabaseRest_filter_('user_email', 'eq', em),
    'limit=1',
  ]);
  var rows = SupabaseRest_select(SUPABASE_TABLE.PROPOSAL_BUILDING_SESSIONS, q);
  return rows.length ? ProposalBuildingStore_rowToSession_(rows[0]) : null;
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
  var row = {
    session_id: sessionId,
    user_email: em,
    status: String(seed.status || 'in_progress'),
    builder_step: String(seed.builderStep || 'materials'),
    title: String(seed.title || ''),
    client_name: String(seed.clientName || ''),
    industry_key: String(seed.industryKey || ''),
    proposal_name: String(seed.proposalName || ''),
    rfp_deadline: String(seed.rfpDeadline || ''),
    commercial_model: String(seed.commercialModel || ''),
    project_summary: String(seed.projectSummary || ''),
    draft_brief_json: seed.draftBrief && typeof seed.draftBrief === 'object' ? seed.draftBrief : {},
    validated_brief_json:
      seed.validatedBrief && typeof seed.validatedBrief === 'object' ? seed.validatedBrief : null,
    materials_json: Array.isArray(seed.materials) ? seed.materials : [],
    ai_responses_json: Array.isArray(seed.aiResponses) ? seed.aiResponses : [],
    studio_recommendations_json: Array.isArray(seed.studioRecommendations)
      ? seed.studioRecommendations
      : [],
    context_json: seed.context && typeof seed.context === 'object' ? seed.context : {},
    deck_file_id: String(seed.deckFileId || ''),
    deck_file_url: String(seed.deckFileUrl || ''),
    deck_file_name: String(seed.deckFileName || ''),
    checklist_file_id: String(seed.checklistFileId || ''),
    checklist_file_url: String(seed.checklistFileUrl || ''),
    checklist_file_name: String(seed.checklistFileName || ''),
    package_folder_id: String(seed.packageFolderId || ''),
    package_folder_url: String(seed.packageFolderUrl || ''),
    package_folder_name: String(seed.packageFolderName || ''),
    created_at: nowIso,
    updated_at: nowIso,
  };
  SupabaseRest_insert(SUPABASE_TABLE.PROPOSAL_BUILDING_SESSIONS, row, { prefer: 'return=minimal' });
  return ProposalBuildingStore_rowToSession_(row);
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
  var row = { updated_at: new Date().toISOString() };
  if (patch.status != null) row.status = String(patch.status || 'in_progress');
  if (patch.builderStep != null) row.builder_step = String(patch.builderStep || 'materials');
  if (patch.title != null) row.title = String(patch.title || '');
  if (patch.clientName != null) row.client_name = String(patch.clientName || '');
  if (patch.industryKey != null) row.industry_key = String(patch.industryKey || '');
  if (patch.proposalName != null) row.proposal_name = String(patch.proposalName || '');
  if (patch.rfpDeadline != null) row.rfp_deadline = String(patch.rfpDeadline || '');
  if (patch.commercialModel != null) row.commercial_model = String(patch.commercialModel || '');
  if (patch.projectSummary != null) row.project_summary = String(patch.projectSummary || '');
  if (patch.draftBrief != null) row.draft_brief_json = patch.draftBrief;
  if (patch.validatedBrief !== undefined) row.validated_brief_json = patch.validatedBrief;
  if (patch.materials != null) row.materials_json = patch.materials;
  if (patch.aiResponses != null) row.ai_responses_json = patch.aiResponses;
  if (patch.studioRecommendations != null) row.studio_recommendations_json = patch.studioRecommendations;
  if (patch.context != null) row.context_json = patch.context;
  if (patch.deckFileId != null) row.deck_file_id = String(patch.deckFileId || '');
  if (patch.deckFileUrl != null) row.deck_file_url = String(patch.deckFileUrl || '');
  if (patch.deckFileName != null) row.deck_file_name = String(patch.deckFileName || '');
  if (patch.checklistFileId != null) row.checklist_file_id = String(patch.checklistFileId || '');
  if (patch.checklistFileUrl != null) row.checklist_file_url = String(patch.checklistFileUrl || '');
  if (patch.checklistFileName != null) row.checklist_file_name = String(patch.checklistFileName || '');
  if (patch.packageFolderId != null) row.package_folder_id = String(patch.packageFolderId || '');
  if (patch.packageFolderUrl != null) row.package_folder_url = String(patch.packageFolderUrl || '');
  if (patch.packageFolderName != null) row.package_folder_name = String(patch.packageFolderName || '');

  SupabaseRest_update(
    SUPABASE_TABLE.PROPOSAL_BUILDING_SESSIONS,
    row,
    SupabaseRest_query_([
      SupabaseRest_filter_('session_id', 'eq', sid),
      SupabaseRest_filter_('user_email', 'eq', em),
    ]),
  );
  return ProposalBuildingStore_getByIdForUser(sid, em);
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
  SupabaseRest_delete(
    SUPABASE_TABLE.PROPOSAL_BUILDING_SESSIONS,
    SupabaseRest_query_([
      SupabaseRest_filter_('session_id', 'eq', sid),
      SupabaseRest_filter_('user_email', 'eq', em),
    ]),
  );
  return true;
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
  SupabaseRest_delete(
    SUPABASE_TABLE.PROPOSAL_BUILDING_SESSIONS,
    SupabaseRest_query_([
      SupabaseRest_filter_('session_id', 'eq', sid),
      SupabaseRest_filter_('user_email', 'eq', em),
    ]),
  );
  return true;
}
