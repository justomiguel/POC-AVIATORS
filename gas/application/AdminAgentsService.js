/**
 * @fileoverview Registro de agentes RAG (nombre de perfil Globant, plantilla de búsqueda, fuentes Drive).
 * Persistencia: archivo JSON interno (Drive) cuyo ID vive en Script Property.
 */

var _ADMIN_AGENTS_PROP = 'ADMIN_AGENTS_REGISTRY';
var _ADMIN_AGENTS_FILE_ID_PROP = 'ADMIN_AGENTS_REGISTRY_FILE_ID';
var _ADMIN_AGENTS_FILE_NAME = 'aviators-admin-agents-registry.json';
var _ADMIN_AGENT_ID_ORCHESTRATOR = 'orchestrator';
var _ADMIN_AGENT_ID_SUCCESS_CASES = 'success_cases';
var _ADMIN_AGENT_ID_PROPOSALS = 'proposals';
var _ADMIN_AGENT_ID_CLIENTS = 'clients';
var _ADMIN_AGENT_ID_ONBOARDING = 'onboarding';
var _ADMIN_AGENTS_API_CATALOG_SSID_PROP = 'ADMIN_AGENTS_API_CATALOG_SPREADSHEET_ID';
var _ADMIN_AGENTS_API_CATALOG_TAB = 'agent_api_catalog';
var ADMIN_AGENT_DEFAULT_MODEL = 'openai/gpt-5.5';

/** Perfil RAG del orquestador (misma API /v1/search/profile que especialistas). */
var ADMIN_AGENT_ORCHESTRATOR_PROFILE = 'aviators-orquestador';

/** Alias históricos de modelo → id canónico en Globant API. */
var ADMIN_AGENT_MODEL_ALIASES_ = {
  'gpt-5.5': 'openai/gpt-5.5',
  'gpt-5': 'openai/gpt-5.5',
  gpt5: 'openai/gpt-5.5',
  'openai/gpt-5': 'openai/gpt-5.5',
  'gpt-4o': 'openai/gpt-4.1',
};

/**
 * @return {Array<{id:string,profileName:string,systemPrompt:string,sources:{folders:Array<{id:string,name:string}>,files:Array<{id:string,name:string}>},lastSync:string}>}
 */
function AdminAgents_defaultRegistryEntries_() {
  return [
    {
      id: _ADMIN_AGENT_ID_ORCHESTRATOR,
      profileName: 'aviators-orquestador',
      systemPrompt:
        'You are the Aviators Orchestrator Agent. Your ONLY goal is to classify the user request and decide which agent(s) should answer.\n\n' +
        'Available agents:\n' +
        '- success_cases: implementation stories, delivered outcomes, studio references, work by industry/technology.\n' +
        '- proposals: commercial proposals, scope, deliverables, timeline, effort, pricing, RFP, quoted engagements.\n' +
        '- clients: client roster, active accounts, maintenance projects, relationship status by client.\n' +
        '- onboarding: aviation concepts, airline business fundamentals, domain terminology (PSS, DCS, NDC, GDS, loyalty, ancillary, etc.), Aviation Studio methodology, team processes, newcomer guides.\n' +
        '- orchestrator: greetings, short small talk, and general Aviators questions that do NOT fit the other specialized agents.\n\n' +
        'KEY RULE - parallel routing:\n' +
        'When a user request can be answered by MORE THAN ONE agent (for example: "what did we do with X", "experience in Y", "projects in Z"), you MUST include ALL relevant agents in the "agents" array. Examples:\n' +
        '- "what did we do with client Acme" -> agents: ["success_cases","proposals"] (there may be both success cases and proposals).\n' +
        '- "show me success cases in banking" -> agents: ["success_cases"] (explicit single-agent request).\n' +
        '- "any data engineering proposal?" -> agents: ["proposals"] (explicit request).\n' +
        '- "experience in cloud" -> agents: ["success_cases","proposals"] (experience may exist in both).\n' +
        '- "what is PSS / explain NDC / how does loyalty work" -> agents: ["onboarding"] (aviation domain concepts).\n' +
        '- "how does Aviation Studio work / team structure / methodology" -> agents: ["onboarding"] (studio methodology).\n' +
        '- "hello" -> agents: ["orchestrator"].\n\n' +
        'You must ALWAYS return strict JSON with no extra text:\n' +
        '{"agents":["success_cases","proposals"],"confidence":"high|medium|low","reason":"short phrase"}\n' +
        'The "agents" array can contain one or more elements. Do not invent agents outside this list.',
      sources: { folders: [], files: [] },
      lastSync: '',
    },
    {
      id: _ADMIN_AGENT_ID_SUCCESS_CASES,
      profileName: 'aviators-success-cases',
      systemPrompt:
        'You are the Aviators Success Cases Agent.\n' +
        'Your ONLY source of truth is the indexed success-cases repository. DO NOT use external knowledge.\n\n' +
        'Goal: answer with relevant cases, context, problem, implemented solution, outcomes, and learnings.\n' +
        'Style: clear, executive, and actionable.\n\n' +
        'Rules:\n' +
        '1) Prioritize concrete examples comparable to the user request.\n' +
        '2) Do not invent logos, clients, metrics, outcomes, or project names.\n' +
        '3) When applicable, use this structure: Case, Context, Solution, Impact, Risks.\n' +
        '4) If multiple cases apply, list them briefly and ask whether to deep dive into one.\n\n' +
        'CRITICAL RULE - no content:\n' +
        'If your indexed corpus has NO relevant success case for the request, reply EXACTLY with this text and nothing else:\n' +
        '[[NO_RELEVANT_CONTENT]]\n' +
        'Do not invent or suggest content when there is no real match in the index.',
      sources: { folders: [], files: [] },
      lastSync: '',
    },
    {
      id: _ADMIN_AGENT_ID_PROPOSALS,
      profileName: 'aviators-proposals',
      systemPrompt:
        'You are the Aviators Proposals Agent.\n' +
        'Your ONLY source of truth is the indexed commercial-proposals repository. DO NOT use external knowledge.\n\n' +
        'Goal: answer with sales/delivery-oriented data: scope, assumptions, deliverables, phases, risks, and next steps.\n' +
        'Style: brief, structured, and aligned with documented content.\n\n' +
        'Rules:\n' +
        '1) Prioritize commercial and technical consistency with the indexed repository.\n' +
        '2) Clearly separate documented facts from assumptions.\n' +
        '3) If key information is missing, ask only for the minimum necessary data.\n' +
        '4) Do not invent prices, dates, commitments, or undocumented clients.\n' +
        '5) If multiple proposals apply, list them briefly and ask whether to deep dive.\n\n' +
        'CRITICAL RULE - no content:\n' +
        'If your indexed corpus has NO relevant proposal for the request, reply EXACTLY with this text and nothing else:\n' +
        '[[NO_RELEVANT_CONTENT]]\n' +
        'Do not invent or suggest content when there is no real match in the index.',
      sources: { folders: [], files: [] },
      lastSync: '',
    },
    {
      id: _ADMIN_AGENT_ID_CLIENTS,
      profileName: 'aviators-clients',
      systemPrompt: SalesforceAccounts_defaultClientsAgentPrompt_(),
      sources: { folders: [], files: [] },
      lastSync: '',
    },
    {
      id: _ADMIN_AGENT_ID_ONBOARDING,
      profileName: 'aviators-onboarding',
      systemPrompt:
        'You are the Aviators Onboarding Agent.\n' +
        'Your ONLY source of truth is the indexed onboarding repository covering aviation concepts, airline business, domain knowledge, and Globant Aviation Studio methodology. DO NOT use external knowledge.\n\n' +
        'Goal: help team members and newcomers understand aviation industry concepts, airline business models, domain terminology, and how the Aviation Studio operates.\n\n' +
        'Topics you cover:\n' +
        '- Aviation industry fundamentals (airline types, business models, revenue streams)\n' +
        '- Domain concepts (PSS, DCS, loyalty, ancillary, NDC, GDS, etc.)\n' +
        '- Airline operations (flight ops, ground handling, crew management)\n' +
        '- Aviation Studio methodology, processes, and best practices\n' +
        '- Team structure, roles, and ways of working\n\n' +
        'Rules:\n' +
        '1) Explain concepts clearly and didactically, suitable for newcomers.\n' +
        '2) Use examples from the indexed material when available.\n' +
        '3) If a concept has multiple interpretations, clarify context.\n' +
        '4) Do not invent definitions, acronyms, or processes not in the index.\n' +
        '5) When applicable, structure by: Concept, Definition, Context, Examples, Related topics.\n\n' +
        'CRITICAL RULE - no content:\n' +
        'If your indexed corpus has NO information about the requested concept or topic, reply EXACTLY with this text and nothing else:\n' +
        '[[NO_RELEVANT_CONTENT]]\n' +
        'Do not invent or suggest content when there is no real match in the index.',
      sources: { folders: [], files: [] },
      lastSync: '',
    },
  ];
}

/**
 * @param {{ agents: Array<Object> }} reg
 * @return {boolean}
 */
function AdminAgents_ensureDefaultAgentsInRegistry_(reg) {
  var changed = false;
  var defaults = AdminAgents_defaultRegistryEntries_();
  var byId = {};
  var i;
  for (i = 0; i < reg.agents.length; i++) {
    var ag = reg.agents[i];
    if (!ag || typeof ag !== 'object') continue;
    var id = String(ag.id || '').trim();
    if (!id) continue;
    byId[id] = true;
  }

  for (i = 0; i < defaults.length; i++) {
    var df = defaults[i];
    if (byId[df.id]) continue;
    reg.agents.push({
      id: df.id,
      profileName: df.profileName,
      systemPrompt: df.systemPrompt,
      sources: AdminAgents_normalizeSources_(df.sources),
      globantAgent: AdminAgents_defaultGlobantAgentConfig_(df),
      lastSync: '',
    });
    changed = true;
  }
  return changed;
}

/**
 * @param {string} name
 * @return {boolean}
 */
function AdminAgents_isValidProfileName_(name) {
  var s = ('' + (name || '')).trim();
  if (s.length < 2 || s.length > 80) return false;
  return /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(s);
}

/**
 * @param {string} agentId
 * @return {boolean}
 */
function AdminAgents_isOrchestratorAgentId_(agentId) {
  return String(agentId || '').trim() === _ADMIN_AGENT_ID_ORCHESTRATOR;
}

/**
 * @param {string} profileName
 * @return {boolean}
 */
function AdminAgents_isOrchestratorProfileName_(profileName) {
  return (
    String(profileName || '').trim().toLowerCase() ===
    ADMIN_AGENT_ORCHESTRATOR_PROFILE
  );
}

/**
 * Agents Hub (v4 upsert). Desactivado: todos los agentes Aviators usan RAG.
 * @param {string} agentId
 * @param {string=} profileName
 * @return {boolean}
 */
function AdminAgents_usesHubAgent_(agentId, profileName) {
  return false;
}

/**
 * Asistente RAG (/v1/search/profile), incluido el orquestador.
 * @param {string} agentId
 * @param {string=} profileName
 * @return {boolean}
 */
function AdminAgents_usesRagAssistant_(agentId, profileName) {
  return true;
}

/**
 * @param {unknown} v
 * @param {number} min
 * @param {number} max
 * @param {number} fallback
 * @return {number}
 */
function AdminAgents_numberOrDefault_(v, min, max, fallback) {
  var n = Number(v);
  if (isNaN(n)) return fallback;
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

/**
 * @param {Object} agentLike
 * @return {{
 *   idOrName: string,
 *   automaticPublish: boolean,
 *   accessScope: string,
 *   sharingScope: string,
 *   status: string,
 *   name: string,
 *   jobDescription: string,
 *   avatarImage: string,
 *   description: string,
 *   strategyName: string,
 *   promptContext: string,
 *   promptInstructions: string,
 *   modelName: string,
 *   maxTokens: number,
 *   timeout: number,
 *   temperature: number
 * }}
 */
function AdminAgents_defaultGlobantAgentConfig_(agentLike) {
  var profile = String((agentLike && agentLike.profileName) || '').trim();
  var prompt = String((agentLike && agentLike.systemPrompt) || '');
  return {
    idOrName: profile,
    automaticPublish: false,
    accessScope: 'private',
    sharingScope: 'organization',
    status: 'active',
    name: profile,
    jobDescription: '',
    avatarImage: '',
    description: '',
    strategyName: 'Chain of Thought',
    promptContext: '',
    promptInstructions: prompt,
    modelName: ADMIN_AGENT_DEFAULT_MODEL,
    maxTokens: 4000,
    timeout: 120,
    temperature: 0.2,
  };
}

/**
 * @return {Array<string>}
 */
function AdminAgents_listKnownModels_() {
  var cat = AdminAgents_apiCatalog();
  return cat.models || [];
}

/**
 * @return {Array<string>}
 */
function AdminAgents_listKnownStrategies_() {
  var cat = AdminAgents_apiCatalog();
  return cat.strategies || [];
}

/**
 * @param {string} raw
 * @param {Array<string>} list
 * @return {string}
 */
function AdminAgents_resolveFromCatalogList_(raw, list) {
  var trimmed = String(raw || '').trim();
  if (!trimmed) return '';
  var token = trimmed.toLowerCase();
  if (ADMIN_AGENT_MODEL_ALIASES_[token]) {
    trimmed = ADMIN_AGENT_MODEL_ALIASES_[token];
    token = trimmed.toLowerCase();
  }
  var items = list || [];
  if (!items.length) {
    return ADMIN_AGENT_MODEL_ALIASES_[token] || trimmed;
  }
  var i;
  for (i = 0; i < items.length; i++) {
    var item = String(items[i] || '').trim();
    if (!item) continue;
    if (item.toLowerCase() === token) return item;
  }
  for (i = 0; i < items.length; i++) {
    var item2 = String(items[i] || '').trim();
    if (!item2) continue;
    var tok2 = item2.toLowerCase();
    if (token.indexOf(tok2) >= 0 || tok2.indexOf(token) >= 0) return item2;
  }
  return ADMIN_AGENT_MODEL_ALIASES_[String(raw || '').trim().toLowerCase()] || '';
}

/**
 * @param {string} raw
 * @return {string}
 */
function AdminAgents_resolveModelName_(raw) {
  return AdminAgents_resolveFromCatalogList_(raw, AdminAgents_listKnownModels_());
}

/**
 * @param {string} raw
 * @return {string}
 */
function AdminAgents_resolveStrategyName_(raw) {
  return AdminAgents_resolveFromCatalogList_(raw, AdminAgents_listKnownStrategies_());
}

/**
 * @param {Array<string>} arr
 * @return {Array<string>}
 */
function AdminAgents_uniqueNonEmpty_(arr) {
  var out = [];
  var seen = {};
  var i;
  for (i = 0; i < arr.length; i++) {
    var v = String(arr[i] || '').trim();
    if (!v || seen[v]) continue;
    seen[v] = true;
    out.push(v);
  }
  return out;
}

/**
 * Catálogo de modelos/estrategias (Supabase agent_api_catalog).
 * @return {{ ok: boolean, models: Array<string>, strategies: Array<string>, source: string, spreadsheetId: string, sheetName: string }}
 */
function AdminAgents_apiCatalog() {
  AdminAuth_requireAgentsView();
  var defaultModels = [
    'vertex_ai/gemini-2.5-pro',
    'vertex_ai/gemini-2.5-flash',
    'vertex_ai/gemini-2.5-flash-lite',
    'vertex_ai/gemini-2.0-flash',
    'openai/gpt-5.5',
    'openai/gpt-5',
    'openai/gpt-5-mini',
    'openai/gpt-4.1',
    'anthropic/claude-sonnet-4-20250514',
  ];
  var defaultStrategies = [
    'Chain of Thought',
    'Direct Answer',
    'Tree of Thoughts',
    'Self-Consistency',
    'ReAct',
  ];

  var sbCat = AgentApiCatalogStore_listAll();
  var sbModels = [];
  var sbStrategies = [];
  for (var si = 0; si < sbCat.length; si++) {
    sbModels.push(sbCat[si].model);
    sbStrategies.push(sbCat[si].strategy);
  }
  sbModels = AdminAgents_uniqueNonEmpty_(sbModels);
  sbStrategies = AdminAgents_uniqueNonEmpty_(sbStrategies);
  return {
    ok: true,
    models: sbModels.length ? sbModels : defaultModels,
    strategies: sbStrategies.length ? sbStrategies : defaultStrategies,
    source: sbModels.length || sbStrategies.length ? 'supabase' : 'defaults',
    spreadsheetId: '',
    sheetName: SUPABASE_TABLE.AGENT_API_CATALOG,
  };
}

/**
 * @param {unknown} raw
 * @param {Object=} agentLike
 * @return {Object}
 */
function AdminAgents_normalizeGlobantAgentConfig_(raw, agentLike) {
  var base = AdminAgents_defaultGlobantAgentConfig_(agentLike || {});
  if (!raw || typeof raw !== 'object') return base;
  var inCfg = /** @type {Object<string, unknown>} */ (raw);

  var accessScope = String(inCfg.accessScope || '').trim().toLowerCase();
  if (accessScope !== 'public' && accessScope !== 'private') {
    accessScope = base.accessScope;
  }
  var sharingScope = String(inCfg.sharingScope || '').trim().toLowerCase();
  if (
    sharingScope !== 'none' &&
    sharingScope !== 'organization' &&
    sharingScope !== 'everybody'
  ) {
    sharingScope = base.sharingScope;
  }
  var status = String(inCfg.status || '').trim().toLowerCase();
  if (status !== 'active' && status !== 'inactive') {
    status = base.status;
  }

  return {
    idOrName: String(inCfg.idOrName || base.idOrName).trim(),
    automaticPublish:
      String(inCfg.automaticPublish).toLowerCase() === 'true' ||
      inCfg.automaticPublish === true,
    accessScope: accessScope,
    sharingScope: sharingScope,
    status: status,
    name: String(inCfg.name || base.name).trim(),
    jobDescription: String(inCfg.jobDescription || '').trim(),
    avatarImage: String(inCfg.avatarImage || '').trim(),
    description: String(inCfg.description || '').trim(),
    strategyName:
      AdminAgents_resolveStrategyName_(
        String(inCfg.strategyName || base.strategyName).trim(),
      ) || String(inCfg.strategyName || base.strategyName).trim(),
    promptContext: String(inCfg.promptContext || '').trim(),
    promptInstructions: AdminAgents_resolvePromptInstructions_(
      inCfg,
      agentLike,
      base,
    ),
    modelName: AdminAgents_resolveModelName_(
      String(inCfg.modelName || base.modelName || '').trim(),
    ),
    maxTokens: AdminAgents_numberOrDefault_(
      inCfg.maxTokens,
      1,
      65536,
      base.maxTokens,
    ),
    timeout: AdminAgents_numberOrDefault_(inCfg.timeout, 0, 600, base.timeout),
    temperature: AdminAgents_numberOrDefault_(
      inCfg.temperature,
      0,
      2,
      base.temperature,
    ),
  };
}

/**
 * @param {unknown} blob
 * @return {{ folders: Array<{id:string,name:string}>, files: Array<{id:string,name:string,source?:string}> }}
 */
function AdminAgents_normalizeSources_(blob) {
  var folders = [];
  var files = [];
  if (!blob || typeof blob !== 'object') {
    return { folders: folders, files: files };
  }
  var b = /** @type {{folders:?Array<unknown>, files:?Array<unknown>}} */ (blob);
  if (Array.isArray(b.folders)) {
    for (var i = 0; i < b.folders.length; i++) {
      var fe = b.folders[i];
      if (fe && typeof fe === 'object' && typeof /** @type {{id:?}} */ (fe).id === 'string') {
        var id = ('' + /** @type {{id:string}} */ (fe).id).trim();
        if (!id) continue;
        folders.push({
          id: id,
          name: ('' + (/** @type {{name:?}} */ (fe).name || id)).trim() || id,
        });
      }
    }
  }
  if (Array.isArray(b.files)) {
    for (var j = 0; j < b.files.length; j++) {
      var ge = b.files[j];
      if (ge && typeof ge === 'object' && typeof /** @type {{id:?}} */ (ge).id === 'string') {
        var idf = ('' + /** @type {{id:string}} */ (ge).id).trim();
        if (!idf) continue;
        var src =
          /** @type {{source:?}} */ (ge).source === 'rag' ? 'rag' : 'drive';
        var row = {
          id: idf,
          name: ('' + (/** @type {{name:?}} */ (ge).name || idf)).trim() || idf,
        };
        if (src === 'rag') row.source = 'rag';
        files.push(row);
      }
    }
  }
  return { folders: folders, files: files };
}

/**
 * @param {GoogleAppsScript.Properties.Properties} props
 * @return {{ agents: Array<Object> }}
 */
function AdminAgents_loadRegistry_(props) {
  var fromFile = AdminAgents_loadRegistryFromFile_(props);
  if (fromFile) {
    return fromFile;
  }

  var legacy = AdminAgents_loadLegacyRegistryFromProperties_(props);
  if (legacy) {
    AdminAgents_saveRegistry_(props, legacy);
    return legacy;
  }

  /** Migración suave: un agente desde el corpus global legacy si existía. */
  var legacySources = AdminKnowledge_loadSources(props);
  var hasLegacy =
    (legacySources.folders && legacySources.folders.length > 0) ||
    (legacySources.files && legacySources.files.length > 0);
  var prof =
    (props.getProperty(_AK_PROP_PROFILE) || '').trim() || ADMIN_KNOWLEDGE_DEFAULT_PROFILE;
  if (!hasLegacy) {
    var seeded = { agents: [] };
    AdminAgents_ensureDefaultAgentsInRegistry_(seeded);
    AdminAgents_saveRegistry_(props, seeded);
    return seeded;
  }
  var migrated = [
    {
      id: Utilities.getUuid(),
      profileName: prof,
      systemPrompt: '',
      sources: legacySources,
      globantAgent: AdminAgents_defaultGlobantAgentConfig_({
        profileName: prof,
        systemPrompt: '',
      }),
      lastSync: (props.getProperty(_AK_PROP_LAST_SYNC) || '').trim(),
    },
  ];
  var migratedReg = { agents: migrated };
  AdminAgents_ensureDefaultAgentsInRegistry_(migratedReg);
  AdminAgents_saveRegistry_(props, migratedReg);
  return migratedReg;
}

/**
 * @param {GoogleAppsScript.Properties.Properties} props
 * @param {{ agents: Array<Object> }} reg
 */
function AdminAgents_saveRegistry_(props, reg) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var file = AdminAgents_getOrCreateRegistryFile_(props);
    file.setContent(JSON.stringify(reg));
  } finally {
    lock.releaseLock();
  }
}

/**
 * @param {GoogleAppsScript.Properties.Properties} props
 * @return {{ agents: Array<Object> }|null}
 */
function AdminAgents_loadRegistryFromFile_(props) {
  var file = AdminAgents_getRegistryFile_(props);
  if (!file) return null;
  var raw = '';
  try {
    raw = (file.getBlob().getDataAsString() || '').trim();
  } catch (eRead) {
    return null;
  }
  if (!raw) return null;
  try {
    var o = JSON.parse(raw);
    if (o && Array.isArray(o.agents)) return { agents: o.agents };
  } catch (eParse) {
    return null;
  }
  return null;
}

/**
 * @param {GoogleAppsScript.Properties.Properties} props
 * @return {{ agents: Array<Object> }|null}
 */
function AdminAgents_loadLegacyRegistryFromProperties_(props) {
  var raw = (props.getProperty(_ADMIN_AGENTS_PROP) || '').trim();
  if (!raw) return null;
  try {
    var o = JSON.parse(raw);
    if (o && Array.isArray(o.agents)) return { agents: o.agents };
  } catch (ignore) {}
  return null;
}

/**
 * @param {GoogleAppsScript.Properties.Properties} props
 * @return {GoogleAppsScript.Drive.File|null}
 */
function AdminAgents_getRegistryFile_(props) {
  var id = (props.getProperty(_ADMIN_AGENTS_FILE_ID_PROP) || '').trim();
  if (!id) return null;
  try {
    return DriveApp.getFileById(id);
  } catch (e) {
    return null;
  }
}

/**
 * @param {GoogleAppsScript.Properties.Properties} props
 * @return {GoogleAppsScript.Drive.File}
 */
function AdminAgents_getOrCreateRegistryFile_(props) {
  var existing = AdminAgents_getRegistryFile_(props);
  if (existing) return existing;

  var file = DriveApp.createFile(
    _ADMIN_AGENTS_FILE_NAME,
    JSON.stringify({ agents: [] }),
    MimeType.PLAIN_TEXT,
  );
  props.setProperty(_ADMIN_AGENTS_FILE_ID_PROP, file.getId());
  return file;
}

/**
 * @param {GoogleAppsScript.Properties.Properties} props
 * @return {Object|null}
 */
function AdminAgents_maybeCreateRagClient_(props) {
  if (LlmOrchestrator_resolveProviderKind() !== 'globant') return null;
  if (LlmProviderGlobant_isAssistantMode(props)) return null;
  var apiKey = (props.getProperty(LLM_PROP.GLOBANT_API_KEY) || '').trim();
  if (!apiKey) {
    throw new Error(
      UiStrings_t(UiStrings_activeLocale_(), 'err_falta_globant_key'),
    );
  }
  var baseUrl = (props.getProperty(LLM_PROP.GLOBANT_BASE_URL) || '').trim();
  return GlobantRagApiClient_create({
    apiKey: apiKey,
    baseUrl: baseUrl || undefined,
  });
}

/**
 * Crea o actualiza el asistente RAG en Globant (`searchOptions.search.prompt`).
 * Asistente RAG (/v1/search/profile): prompt en searchOptions.search.prompt vía GlobantRagDefaults.
 * No usar Agents API v4 ni AdminAgents_buildGlobantAgentDefinition_ aquí.
 *
 * @param {Object} client — GlobantRagApiClient_create
 * @param {string} profileName
 * @param {string} systemPrompt · instrucciones / plantilla de búsqueda Aviators
 * @return {'created'|'updated'|'unchanged'}
 */
function AdminAgents_syncRagProfilePrompt_(client, profileName, systemPrompt) {
  var name = String(profileName || '').trim();
  if (!name) return 'unchanged';

  var defaultDesc = UiStrings_t(
    UiStrings_activeLocale_(),
    'admin_rag_default_profile_description',
  );
  var exists = AdminAgents_listRemoteProfilesSet_(client);
  var searchPrompt = GlobantRagDefaults_coerceSearchPromptTemplate(systemPrompt);

  if (exists[name]) {
    client.updateProfile(
      name,
      GlobantRagDefaults_buildUpdateSearchPromptBody(defaultDesc, systemPrompt),
    );
    console.log(
      '[AdminAgents] RAG profile prompt updated name=' +
        name +
        ' promptLen=' +
        searchPrompt.length,
    );
    return 'updated';
  }

  client.createProfile(
    GlobantRagDefaults_buildCreateProfileWithSearchPrompt(
      name,
      defaultDesc,
      systemPrompt,
    ),
  );
  console.log(
    '[AdminAgents] RAG profile created name=' +
      name +
      ' promptLen=' +
      searchPrompt.length,
  );
  return 'created';
}

/**
 * @param {Object} client
 * @param {string} profileName
 * @param {string} systemPrompt
 */
function AdminAgents_ensureRagProfileExists_(client, profileName, systemPrompt) {
  AdminAgents_syncRagProfilePrompt_(client, profileName, systemPrompt);
}

/**
 * Sincroniza prompt RAG si el proveedor es Globant y no es modo assistant-only.
 *
 * @param {GoogleAppsScript.Properties.Properties} props
 * @param {string} profileName
 * @param {string} systemPrompt
 */
function AdminAgents_maybeSyncRagProfilePrompt_(
  props,
  profileName,
  systemPrompt,
  agentId,
) {
  if (AdminAgents_usesHubAgent_(agentId, profileName)) return;
  if (LlmOrchestrator_resolveProviderKind() !== 'globant') return;
  if (LlmProviderGlobant_isAssistantMode(props)) return;
  var client = AdminAgents_maybeCreateRagClient_(props);
  if (!client) return;
  AdminAgents_syncRagProfilePrompt_(client, profileName, systemPrompt);
}

/**
 * @param {GoogleAppsScript.Properties.Properties} props
 * @return {{upsertAgent:function(string,Object,boolean):Object}}
 */
function AdminAgents_createGlobantAgentsApiClient_(props) {
  var apiKey = (props.getProperty(LLM_PROP.GLOBANT_API_KEY) || '').trim();
  if (!apiKey) {
    throw new Error(
      UiStrings_t(UiStrings_activeLocale_(), 'err_falta_globant_key'),
    );
  }
  var baseUrl = (props.getProperty(LLM_PROP.GLOBANT_BASE_URL) || '').trim();
  var projectId = (props.getProperty(AVIATORS_PROP.GLOBANT_PROJECT_ID) || '').trim();
  return GlobantAgentsApiClient_create({
    apiKey: apiKey,
    baseUrl: baseUrl || undefined,
    projectId: projectId || undefined,
  });
}

/**
 * Instrucciones del agente en Globant API: prioriza promptInstructions no vacío,
 * luego systemPrompt del registro Aviators.
 *
 * @param {Object} cfg
 * @param {string} systemPrompt
 * @return {{context:string, instructions:string}}
 */
function AdminAgents_buildGlobantPrompt_(cfg, systemPrompt) {
  var instructions = String(
    cfg.promptInstructions != null ? cfg.promptInstructions : systemPrompt,
  ).trim();
  if (!instructions) {
    instructions = String(systemPrompt || '').trim();
  }
  return {
    context: String(cfg.promptContext || '').trim(),
    instructions: instructions,
  };
}

/**
 * @param {Object<string, unknown>} inCfg
 * @param {Object=} agentLike
 * @param {Object} base
 * @return {string}
 */
function AdminAgents_resolvePromptInstructions_(inCfg, agentLike, base) {
  var raw =
    inCfg.promptInstructions != null
      ? inCfg.promptInstructions
      : base.promptInstructions;
  var s = String(raw || '').trim();
  if (s) return s;
  return String(
    (agentLike && agentLike.systemPrompt) || base.promptInstructions || '',
  ).trim();
}

/**
 * Solo Agents Hub (v4 upsert). Los asistentes RAG no usan permissions ni este mapper.
 * @param {string} sharingScope
 * @return {{chatSharing:string, externalExecution:string}}
 */
function AdminAgents_mapSharingScopeToPermissions_(sharingScope) {
  var scope = String(sharingScope || 'organization').trim().toLowerCase();
  if (scope === 'none') {
    return { chatSharing: 'none', externalExecution: 'none' };
  }
  if (scope === 'everybody') {
    return { chatSharing: 'public', externalExecution: 'public' };
  }
  return { chatSharing: 'organization', externalExecution: 'organization' };
}

/**
 * Cuerpo agentDefinition para Agents Hub API v4 (PUT …/upsert) — solo orquestador (Hub).
 * Especialistas usan AdminAgents_syncRagProfilePrompt_ + GlobantRagDefaults (perfil RAG).
 * @param {Object} cfg — salida de AdminAgents_normalizeGlobantAgentConfig_
 * @param {string} profileName
 * @param {string} systemPrompt
 * @return {Object}
 */
function AdminAgents_buildGlobantAgentDefinition_(cfg, profileName, systemPrompt) {
  var name = String(cfg.name || profileName || cfg.idOrName).trim();
  var prompt = AdminAgents_buildGlobantPrompt_(cfg, systemPrompt);
  var strategyName = String(cfg.strategyName || 'Chain of Thought').trim();
  var modelName = String(cfg.modelName || '').trim();
  var llmConfig = {
    maxTokens: cfg.maxTokens,
    sampling: {
      temperature: cfg.temperature,
    },
    timeout: Number(cfg.timeout) > 0 ? cfg.timeout : 0,
  };
  var modelEntry = { name: modelName, llmConfig: llmConfig };
  var agentDefinition = {
    name: name,
    accessScope: String(cfg.accessScope || 'private'),
    permissions: AdminAgents_mapSharingScopeToPermissions_(cfg.sharingScope),
    agentData: {
      strategyName: strategyName,
      prompt: {
        context: prompt.context,
        instructions: prompt.instructions,
      },
      llmConfig: llmConfig,
      models: [modelEntry],
    },
  };
  var job = String(cfg.jobDescription || '').trim();
  if (job) agentDefinition.jobDescription = job;
  var desc = String(cfg.description || '').trim();
  if (desc) agentDefinition.description = desc;
  var avatar = String(cfg.avatarImage || '').trim();
  if (avatar) agentDefinition.avatarImage = avatar;
  return agentDefinition;
}

/**
 * Persiste en Globant Agents Hub (v4). No crea ni actualiza perfiles RAG.
 * @param {GoogleAppsScript.Properties.Properties} props
 * @param {string} profileName
 * @param {string} systemPrompt
 * @param {Object} globantAgent
 * @return {{config:Object, remote:Object}}
 */
function AdminAgents_upsertRemoteGlobantAgent_(
  props,
  profileName,
  systemPrompt,
  globantAgent,
) {
  var cfg = AdminAgents_normalizeGlobantAgentConfig_(globantAgent, {
    profileName: profileName,
    systemPrompt: systemPrompt,
  });
  if (!String(cfg.modelName || '').trim()) {
    throw new Error(
      UiStrings_t(UiStrings_activeLocale_(), 'err_admin_agent_api_model_required'),
    );
  }
  var knownModels = AdminAgents_listKnownModels_();
  if (knownModels.length && knownModels.indexOf(cfg.modelName) < 0) {
    AviatorsError_throw_(
      'ERR_ADMIN_AGENT_API_MODEL_INVALID',
      'AdminAgents_upsertRemoteGlobantAgent_',
      UiStrings_fmt_('err_admin_agent_api_model_invalid', {
        model: String(cfg.modelName),
        samples: knownModels.slice(0, 4).join(', '),
      }),
    );
  }
  var knownStrategies = AdminAgents_listKnownStrategies_();
  if (
    knownStrategies.length &&
    cfg.strategyName &&
    knownStrategies.indexOf(cfg.strategyName) < 0
  ) {
    AviatorsError_throw_(
      'ERR_ADMIN_AGENT_API_STRATEGY_INVALID',
      'AdminAgents_upsertRemoteGlobantAgent_',
      UiStrings_fmt_('err_admin_agent_api_strategy_invalid', {
        strategy: String(cfg.strategyName),
        samples: knownStrategies.slice(0, 4).join(', '),
      }),
    );
  }
  var projectId = (props.getProperty(AVIATORS_PROP.GLOBANT_PROJECT_ID) || '').trim();
  if (!projectId) {
    throw new Error(
      UiStrings_t(UiStrings_activeLocale_(), 'err_falta_globant_project_id'),
    );
  }
  var idOrName = String(cfg.idOrName || cfg.name || profileName).trim();
  if (!idOrName) {
    throw new Error(
      UiStrings_t(UiStrings_activeLocale_(), 'err_admin_agent_api_id'),
    );
  }
  var name = String(cfg.name || profileName || idOrName).trim();
  var prompt = AdminAgents_buildGlobantPrompt_(cfg, systemPrompt);
  var agentDefinition = AdminAgents_buildGlobantAgentDefinition_(
    cfg,
    profileName,
    systemPrompt,
  );
  var client = AdminAgents_createGlobantAgentsApiClient_(props);
  var remote = client.upsertAgent(
    idOrName,
    agentDefinition,
    !!cfg.automaticPublish,
    {
      modelName: String(cfg.modelName || ''),
      idOrName: idOrName,
      strategyName: String(cfg.strategyName || ''),
    },
  );

  cfg.idOrName = idOrName;
  cfg.name = name;
  cfg.promptContext = prompt.context;
  cfg.promptInstructions = prompt.instructions;
  return { config: cfg, remote: remote };
}

/**
 * @param {Object} ragClient
 * @return {Object<string, boolean>}
 */
function AdminAgents_listRemoteProfilesSet_(ragClient) {
  var set = {};
  var meta = ragClient.listSearchProfiles();
  var list = (meta && meta.profiles) || [];
  var i;
  for (i = 0; i < list.length; i++) {
    var p = list[i];
    var name = String((p && p.name) || '').trim();
    if (!name) continue;
    set[name] = true;
  }
  return set;
}

/**
 * Cliente RAG opcional para listados (no falla si falta API key o la red).
 * @param {GoogleAppsScript.Properties.Properties} props
 * @return {Object|null}
 */
function AdminAgents_tryMaybeCreateRagClient_(props) {
  try {
    return AdminAgents_maybeCreateRagClient_(props);
  } catch (e) {
    return null;
  }
}

/**
 * @param {Object} ragClient
 * @return {Object<string, boolean>|null} null si no se pudo consultar Globant
 */
function AdminAgents_tryListRemoteProfilesSet_(ragClient) {
  try {
    return AdminAgents_listRemoteProfilesSet_(ragClient);
  } catch (e) {
    return null;
  }
}

/**
 * Marca si el perfil RAG existe en Globant (informativo; no oculta agentes).
 * @param {Array<Object>} agents
 * @param {Object<string, boolean>|null} remoteSet
 */
function AdminAgents_annotateRagProfileOnRemote_(agents, remoteSet) {
  if (!agents || !agents.length) return;
  var i;
  for (i = 0; i < agents.length; i++) {
    var ag = agents[i];
    if (!ag) continue;
    ag.ragProfileOnRemote = remoteSet
      ? !!remoteSet[String(ag.profileName || '').trim()]
      : false;
  }
}

/**
 * Estado del orquestador: registro local + perfil RAG en Globant.
 * @param {GoogleAppsScript.Properties.Properties} props
 * @return {{ ok: boolean, inRegistry: boolean, onRemote: boolean, remoteChecked: boolean, profileName: string, hubAgentIdOrName: string }}
 */
function AdminAgents_orchestratorHealth_(props) {
  var reg = AdminAgents_loadRegistry_(props);
  var orch = null;
  var i;
  for (i = 0; i < reg.agents.length; i++) {
    var ag = reg.agents[i];
    if (ag && String(ag.id || '').trim() === _ADMIN_AGENT_ID_ORCHESTRATOR) {
      orch = ag;
      break;
    }
  }
  if (!orch) {
    return {
      ok: false,
      inRegistry: false,
      onRemote: false,
      remoteChecked: false,
      profileName: '',
      hubAgentIdOrName: '',
    };
  }
  var pn = String(orch.profileName || '').trim();
  var onRemote = false;
  var remoteChecked = false;
  if (LlmOrchestrator_resolveProviderKind() === 'globant' && pn) {
    var ragClient = AdminAgents_tryMaybeCreateRagClient_(props);
    if (ragClient) {
      var exists = AdminAgents_tryListRemoteProfilesSet_(ragClient);
      remoteChecked = exists !== null;
      onRemote = exists ? !!exists[pn] : false;
    }
  }
  return {
    ok: onRemote,
    inRegistry: true,
    onRemote: onRemote,
    remoteChecked: remoteChecked,
    profileName: pn,
    hubAgentIdOrName: pn,
  };
}

/**
 * Crea o actualiza perfiles RAG de los agentes por defecto (prompt según registro/código).
 *
 * @param {Object} ragClient
 * @param {Array<Object>} defaultsInRegistry
 * @return {{ created: number, updated: number }}
 */
function AdminAgents_ensureRemoteProfilesForDefaults_(
  ragClient,
  defaultsInRegistry,
) {
  var created = 0;
  var updated = 0;
  var i;
  for (i = 0; i < defaultsInRegistry.length; i++) {
    var ag = defaultsInRegistry[i];
    if (!ag || typeof ag !== 'object') continue;
    var name = String(ag.profileName || '').trim();
    if (!AdminAgents_isValidProfileName_(name)) continue;
    var outcome = AdminAgents_syncRagProfilePrompt_(
      ragClient,
      name,
      String(ag.systemPrompt || ''),
    );
    if (outcome === 'created') created++;
    else if (outcome === 'updated') updated++;
  }
  return { created: created, updated: updated };
}

/**
 * Upsert en Globant Agents API de los agentes por defecto (prompt context/instructions).
 * @param {GoogleAppsScript.Properties.Properties} props
 * @param {Array<Object>} defaultsInRegistry
 * @return {{ synced: number, errors: Array<string> }}
 */
function AdminAgents_ensureRemoteGlobantAgentsForDefaults_(
  props,
  defaultsInRegistry,
) {
  var synced = 0;
  var errors = [];
  var i;
  for (i = 0; i < defaultsInRegistry.length; i++) {
    var ag = defaultsInRegistry[i];
    if (!ag || typeof ag !== 'object') continue;
    if (!AdminAgents_usesHubAgent_(ag.id, ag.profileName)) continue;
    var profileName = String(ag.profileName || '').trim();
    if (!AdminAgents_isValidProfileName_(profileName)) continue;
    try {
      var remoteSave = AdminAgents_upsertRemoteGlobantAgent_(
        props,
        profileName,
        String(ag.systemPrompt || ''),
        AdminAgents_normalizeGlobantAgentConfig_(ag.globantAgent, ag),
      );
      ag.globantAgent = remoteSave.config;
      synced++;
    } catch (eSync) {
      var msg = (eSync && eSync.message) || String(eSync);
      errors.push(profileName + ': ' + msg);
      AviatorsError_log_(
        'AdminAgents_ensureRemoteGlobantAgentsForDefaults_',
        profileName + ' ' + msg,
      );
    }
  }
  return { synced: synced, errors: errors };
}

/**
 * @param {{agents:Array<Object>}} reg
 * @return {Array<Object>}
 */
function AdminAgents_pickDefaultAgents_(reg) {
  var wanted = {};
  wanted[_ADMIN_AGENT_ID_ORCHESTRATOR] = true;
  wanted[_ADMIN_AGENT_ID_SUCCESS_CASES] = true;
  wanted[_ADMIN_AGENT_ID_PROPOSALS] = true;
  wanted[_ADMIN_AGENT_ID_CLIENTS] = true;
  wanted[_ADMIN_AGENT_ID_ONBOARDING] = true;
  var out = [];
  var i;
  for (i = 0; i < reg.agents.length; i++) {
    var ag = reg.agents[i];
    if (!ag || typeof ag !== 'object') continue;
    var id = String(ag.id || '').trim();
    if (!wanted[id]) continue;
    out.push(ag);
  }
  return out;
}

/**
 * @return {{ ok: boolean, agents: Array<Object> }}
 */
function AdminAgents_list() {
  AdminAuth_requireAgentsView();
  var props = PropertiesService.getScriptProperties();
  var reg = AdminAgents_loadRegistry_(props);
  var out = [];
  var i;
  for (i = 0; i < reg.agents.length; i++) {
    var a = reg.agents[i];
    if (!a || typeof a !== 'object') continue;
    out.push({
      id: String(a.id || ''),
      profileName: String(a.profileName || ''),
      systemPrompt: String(a.systemPrompt || ''),
      sources: AdminAgents_normalizeSources_(a.sources),
      globantAgent: AdminAgents_normalizeGlobantAgentConfig_(a.globantAgent, a),
      lastSync: String(a.lastSync || ''),
    });
  }
  var ragClient = AdminAgents_tryMaybeCreateRagClient_(props);
  if (ragClient) {
    AdminAgents_annotateRagProfileOnRemote_(
      out,
      AdminAgents_tryListRemoteProfilesSet_(ragClient),
    );
  }
  return { ok: true, agents: out };
}

/**
 * @param {Array<Object>} agents
 * @param {GoogleAppsScript.Properties.Properties} props
 */
function AdminAgents_annotateHubAgentsOnRemote_(agents, props) {
  if (!agents || !agents.length) return;
  if (LlmOrchestrator_resolveProviderKind() !== 'globant') return;
  var client;
  try {
    client = AdminAgents_createGlobantAgentsApiClient_(props);
  } catch (eClient) {
    return;
  }
  var i;
  for (i = 0; i < agents.length; i++) {
    var ag = agents[i];
    if (!ag || !AdminAgents_usesHubAgent_(ag.id, ag.profileName)) continue;
    var cfg = AdminAgents_normalizeGlobantAgentConfig_(ag.globantAgent, ag);
    var hubId = String(cfg.idOrName || ag.profileName || '').trim();
    if (!hubId) {
      ag.hubAgentOnRemote = false;
      continue;
    }
    try {
      client.getAgent(hubId, true);
      ag.hubAgentOnRemote = true;
    } catch (eGet) {
      ag.hubAgentOnRemote = false;
    }
  }
}

/**
 * Lista mínima para métricas del home (sin prompts ni fuentes).
 * Solo quien puede administrar agentes en Aviators.
 *
 * @return {{ ok: boolean, agents: Array<Object> }}
 */
function AdminAgents_listForDashboardMetrics() {
  var email = ('' + Session.getActiveUser().getEmail()).trim();
  if (!email) return { ok: true, agents: [] };

  if (!AdminAuth_canManageAgents(email)) return { ok: true, agents: [] };

  var props = PropertiesService.getScriptProperties();
  var reg = AdminAgents_loadRegistry_(props);
  var out = [];
  var i;
  for (i = 0; i < reg.agents.length; i++) {
    var a = reg.agents[i];
    if (!a || typeof a !== 'object') continue;
    var cfg = AdminAgents_normalizeGlobantAgentConfig_(a.globantAgent, a);
    out.push({
      id: String(a.id || ''),
      profileName: String(a.profileName || ''),
      globantAgent: {
        strategyName: String(cfg.strategyName || ''),
        modelName: String(cfg.modelName || ''),
      },
    });
  }
  var ragClient = AdminAgents_tryMaybeCreateRagClient_(props);
  if (ragClient) {
    AdminAgents_annotateRagProfileOnRemote_(
      out,
      AdminAgents_tryListRemoteProfilesSet_(ragClient),
    );
  }
  return { ok: true, agents: out };
}

/**
 * Solo admin · asegura que existan los agentes por defecto (sin duplicar).
 * @return {{ ok: boolean, created: number, total: number }}
 */
function AdminAgents_ensureDefaults() {
  AdminAuth_requireAgentsAdmin();
  var props = PropertiesService.getScriptProperties();
  var reg = AdminAgents_loadRegistry_(props);
  var before = reg.agents.length;
  var changedLocal = AdminAgents_ensureDefaultAgentsInRegistry_(reg);
  var after = reg.agents.length;
  var defaults = AdminAgents_pickDefaultAgents_(reg);
  var ragProfileStats = { created: 0, updated: 0 };
  var ragClient = AdminAgents_maybeCreateRagClient_(props);
  if (ragClient) {
    ragProfileStats = AdminAgents_ensureRemoteProfilesForDefaults_(
      ragClient,
      defaults,
    );
  }
  if (changedLocal) {
    AdminAgents_saveRegistry_(props, reg);
  }
  var createdLocal = Math.max(0, after - before);
  return {
    ok: true,
    created: createdLocal + ragProfileStats.created,
    createdRegistry: createdLocal,
    createdProfiles: ragProfileStats.created,
    updatedProfiles: ragProfileStats.updated,
    syncedGlobantAgents: 0,
    globantSyncErrors: [],
    total: after,
  };
}

/**
 * @param {Object} agentIn
 * @return {Object}
 */
function AdminAgents_upsert(agentIn) {
  AdminAuth_requireAgentsAdmin();
  if (!agentIn || typeof agentIn !== 'object')
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_admin_agent_payload'));

  var props = PropertiesService.getScriptProperties();
  var reg = AdminAgents_loadRegistry_(props);

  var id = ('' + (agentIn.id || '')).trim();
  if (!id) id = Utilities.getUuid();

  var profileName = ('' + (agentIn.profileName || '')).trim();
  if (!AdminAgents_isValidProfileName_(profileName)) {
    throw new Error(
      UiStrings_t(UiStrings_activeLocale_(), 'err_admin_agent_profile_name'),
    );
  }

  var systemPrompt = '' + (agentIn.systemPrompt != null ? agentIn.systemPrompt : '');
  var sources = AdminAgents_normalizeSources_(agentIn.sources);

  var ai;
  for (ai = 0; ai < reg.agents.length; ai++) {
    var o = reg.agents[ai];
    if (!o) continue;
    if (
      String(o.profileName || '').trim() === profileName &&
      String(o.id || '') !== id
    ) {
      throw new Error(
        UiStrings_fmt_('err_admin_agent_duplicate', {
          name: profileName,
        }),
      );
    }
  }

  var foundIdx = -1;
  for (var j = 0; j < reg.agents.length; j++) {
    if (reg.agents[j] && String(reg.agents[j].id) === id) {
      foundIdx = j;
      break;
    }
  }

  AdminAgents_maybeSyncRagProfilePrompt_(props, profileName, systemPrompt, id);

  var globantAgent = AdminAgents_normalizeGlobantAgentConfig_(agentIn.globantAgent, {
    id: id,
    profileName: profileName,
    systemPrompt: systemPrompt,
  });

  var entry = {
    id: id,
    profileName: profileName,
    systemPrompt: systemPrompt,
    sources: sources,
    globantAgent: globantAgent,
    lastSync:
      foundIdx >= 0 && reg.agents[foundIdx].lastSync
        ? String(reg.agents[foundIdx].lastSync)
        : '',
  };

  if (foundIdx >= 0) reg.agents[foundIdx] = entry;
  else reg.agents.push(entry);

  AdminAgents_saveRegistry_(props, reg);

  return {
    ok: true,
    agent: entry,
    globant: {
      idOrName: String(globantAgent.idOrName || ''),
      revision: 0,
      isDraft: false,
      status: '',
      hubAgent: false,
    },
  };
}

/**
 * @param {string} agentId
 * @return {{ ok: boolean }}
 */
function AdminAgents_delete(agentId) {
  AdminAuth_requireAgentsAdmin();
  var aid = ('' + (agentId || '')).trim();
  if (!aid)
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_admin_agent_id'));

  var props = PropertiesService.getScriptProperties();
  var reg = AdminAgents_loadRegistry_(props);
  var removed = null;
  var next = [];
  var i;
  for (i = 0; i < reg.agents.length; i++) {
    var a = reg.agents[i];
    if (a && String(a.id) === aid) {
      removed = a;
      continue;
    }
    next.push(a);
  }
  if (!removed)
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_admin_agent_not_found'));

  AdminAgents_saveRegistry_(props, { agents: next });

  if (LlmOrchestrator_resolveProviderKind() === 'globant') {
    var pn = String(removed.profileName || '').trim();
    if (
      !LlmProviderGlobant_isAssistantMode(props) &&
      AdminAgents_usesRagAssistant_(removed.id, pn)
    ) {
      try {
        GlobantControl_deleteRagProfile(pn);
      } catch (ignore) {}
    }
  }

  return { ok: true };
}

/**
 * @param {string} agentId
 * @return {Object}
 */
function AdminAgents_sync(agentId) {
  AdminAuth_requireAgentsAdmin();
  var aid = ('' + (agentId || '')).trim();
  if (!aid)
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_admin_agent_id'));

  var props = PropertiesService.getScriptProperties();
  var reg = AdminAgents_loadRegistry_(props);
  var agent = null;
  var k;
  for (k = 0; k < reg.agents.length; k++) {
    if (reg.agents[k] && String(reg.agents[k].id) === aid) {
      agent = reg.agents[k];
      break;
    }
  }
  if (!agent)
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_admin_agent_not_found'));

  var profileName = String(agent.profileName || '').trim();
  var sources = AdminAgents_normalizeSources_(agent.sources);
  var systemPrompt = String(agent.systemPrompt || '');

  var fi;
  var ragFileCount = 0;
  var driveFileCount = 0;
  for (fi = 0; fi < sources.files.length; fi++) {
    if (sources.files[fi].source === 'rag') ragFileCount++;
    else driveFileCount++;
  }
  var hasFolders = sources.folders.length > 0;
  var hasRagFiles = ragFileCount > 0;
  var hasDriveSide = hasFolders || driveFileCount > 0;

  if (hasRagFiles && hasDriveSide) {
    throw new Error(
      UiStrings_t(UiStrings_activeLocale_(), 'err_admin_agent_sync_mixed_sources'),
    );
  }

  var bootstrap = AdminKnowledge_getBootstrapSlice();
  /** @type {{ profileName: string, docCount: number, uploaded: number, note: string }} */
  var sr;
  if (hasRagFiles && !hasDriveSide) {
    sr = {
      profileName: profileName,
      docCount: ragFileCount,
      uploaded: 0,
      note: UiStrings_t(
        UiStrings_activeLocale_(),
        'admin_agent_sync_rag_only_note',
      ),
    };
  } else {
    sr = AdminKnowledge_syncCorpusWithOptions({
      profileName: profileName,
      sources: sources,
      searchPrompt: systemPrompt,
      maxFiles: bootstrap.maxFiles,
    });
  }

  agent.lastSync = new Date().toISOString();
  AdminAgents_saveRegistry_(props, reg);

  return {
    ok: true,
    sync: sr,
    agent: {
      id: String(agent.id),
      profileName: profileName,
      systemPrompt: systemPrompt,
      sources: sources,
      lastSync: String(agent.lastSync),
    },
  };
}
