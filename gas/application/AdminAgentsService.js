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
var _ADMIN_AGENTS_API_CATALOG_SSID_PROP = 'ADMIN_AGENTS_API_CATALOG_SPREADSHEET_ID';
var _ADMIN_AGENTS_API_CATALOG_TAB = 'agent_api_catalog';

/**
 * @return {Array<{id:string,profileName:string,systemPrompt:string,sources:{folders:Array<{id:string,name:string}>,files:Array<{id:string,name:string}>},lastSync:string}>}
 */
function AdminAgents_defaultRegistryEntries_() {
  return [
    {
      id: _ADMIN_AGENT_ID_ORCHESTRATOR,
      profileName: 'aviators-orquestador',
      systemPrompt:
        'Sos el Agente Orquestador de Aviators. Tu UNICO objetivo es clasificar la consulta del usuario y decidir que agente(s) deben responder.\n\n' +
        'Agentes disponibles:\n' +
        '- success_cases: casos de exito, historias de implementacion, resultados logrados, referencias del studio, trabajos realizados en una industria/tecnologia.\n' +
        '- proposals: propuestas comerciales, alcance, entregables, cronograma, esfuerzo, pricing, RFP, trabajos cotizados/presupuestados.\n' +
        '- clients: nomina de clientes, cuentas activas, proyectos en mantenimiento, estado de relacion por cliente.\n' +
        '- orchestrator: SOLO para saludos, charla breve, o preguntas que claramente NO requieren ningun corpus especializado.\n\n' +
        'REGLA CLAVE — consulta paralela:\n' +
        'Cuando la consulta del usuario podria ser respondida por MAS DE UN agente (por ejemplo: "que hicimos con X", "experiencia en Y", "proyectos de Z") DEBES listar TODOS los agentes relevantes en el array "agents". Ejemplos:\n' +
        '- "que hicimos con el cliente Acme" → agents: ["success_cases","proposals"] (podria haber casos de exito Y propuestas).\n' +
        '- "dame los success cases de banca" → agents: ["success_cases"] (pedido explicito, uno solo).\n' +
        '- "alguna propuesta de data engineering" → agents: ["proposals"] (pedido explicito).\n' +
        '- "experiencia en cloud" → agents: ["success_cases","proposals"] (experiencia puede estar en ambos).\n' +
        '- "hola" → agents: ["orchestrator"].\n\n' +
        'Debes devolver SIEMPRE un JSON estricto sin texto adicional:\n' +
        '{"agents":["success_cases","proposals"],"confidence":"high|medium|low","reason":"frase corta"}\n' +
        'El array "agents" puede tener 1 o mas elementos. No inventes agentes fuera de la lista.',
      sources: { folders: [], files: [] },
      lastSync: '',
    },
    {
      id: _ADMIN_AGENT_ID_SUCCESS_CASES,
      profileName: 'aviators-success-cases',
      systemPrompt:
        'Sos el Agente de Success Cases de Aviators.\n' +
        'Tu UNICA fuente de verdad es el repositorio indexado de success cases del studio. NO uses conocimiento externo.\n\n' +
        'Objetivo: responder con casos relevantes, contexto, problema, solucion implementada, resultados y aprendizajes.\n' +
        'Estilo: claro, ejecutivo y accionable.\n\n' +
        'Reglas:\n' +
        '1) Prioriza ejemplos concretos y comparables al pedido del usuario.\n' +
        '2) No inventes logos, clientes, metricas, resultados ni nombres de proyecto.\n' +
        '3) Cuando aplique, responde en formato: Caso, Contexto, Solucion, Impacto, Riesgos.\n' +
        '4) Si multiples casos aplican, listalos todos brevemente y pregunta si quiere profundizar en alguno.\n\n' +
        'REGLA CRITICA — sin contenido:\n' +
        'Si en tu corpus indexado NO encontras ningun caso de exito relevante a la consulta, responde EXACTAMENTE con este texto y nada mas:\n' +
        '[[NO_RELEVANT_CONTENT]]\n' +
        'No inventes ni sugieras contenido cuando no hay coincidencia real en el indice.',
      sources: { folders: [], files: [] },
      lastSync: '',
    },
    {
      id: _ADMIN_AGENT_ID_PROPOSALS,
      profileName: 'aviators-proposals',
      systemPrompt:
        'Sos el Agente de Propuestas de Aviators.\n' +
        'Tu UNICA fuente de verdad es el repositorio indexado de propuestas comerciales. NO uses conocimiento externo.\n\n' +
        'Objetivo: responder con datos orientados a ventas y delivery: alcance, supuestos, entregables, fases, riesgos y proximos pasos.\n' +
        'Estilo: breve, estructurado y alineado a lo que esta documentado.\n\n' +
        'Reglas:\n' +
        '1) Prioriza consistencia comercial y tecnica con el repositorio indexado.\n' +
        '2) Diferencia claramente hechos del repositorio vs supuestos.\n' +
        '3) Si faltan datos clave para responder, pide solo la informacion imprescindible.\n' +
        '4) No inventes precios, fechas, compromisos ni clientes no documentados.\n' +
        '5) Si multiples propuestas aplican, listalas brevemente y pregunta si quiere profundizar.\n\n' +
        'REGLA CRITICA — sin contenido:\n' +
        'Si en tu corpus indexado NO encontras ninguna propuesta relevante a la consulta, responde EXACTAMENTE con este texto y nada mas:\n' +
        '[[NO_RELEVANT_CONTENT]]\n' +
        'No inventes ni sugieras contenido cuando no hay coincidencia real en el indice.',
      sources: { folders: [], files: [] },
      lastSync: '',
    },
    {
      id: _ADMIN_AGENT_ID_CLIENTS,
      profileName: 'aviators-clients',
      systemPrompt:
        'Sos el Agente de Clientes de Aviators.\n' +
        'Tu UNICA fuente de verdad es la nomina indexada de clientes actuales y proyectos en mantenimiento. NO uses conocimiento externo.\n\n' +
        'Objetivo: responder por cliente, proyecto activo, estado y continuidad.\n\n' +
        'Reglas:\n' +
        '1) No mezcles clientes ni proyectos sin evidencia en el indice.\n' +
        '2) Si la consulta usa nombres ambiguos, confirma la entidad antes de afirmar.\n' +
        '3) No inventes contratos, revenue, alcance o fechas.\n' +
        '4) Cuando aplique, responde por bloques: Cliente, Proyectos vigentes, Estado, Riesgos/pendientes.\n\n' +
        'REGLA CRITICA — sin contenido:\n' +
        'Si en tu corpus indexado NO encontras informacion del cliente o proyecto consultado, responde EXACTAMENTE con este texto y nada mas:\n' +
        '[[NO_RELEVANT_CONTENT]]\n' +
        'No inventes ni sugieras contenido cuando no hay coincidencia real en el indice.',
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
    modelName: '',
    maxTokens: 4000,
    timeout: 0,
    temperature: 0.2,
  };
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
 * @param {GoogleAppsScript.Properties.Properties} props
 * @return {{ spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet, sheet: GoogleAppsScript.Spreadsheet.Sheet }}
 */
function AdminAgents_getOrCreateApiCatalogSheet_(props) {
  var ssId = (props.getProperty(_ADMIN_AGENTS_API_CATALOG_SSID_PROP) || '').trim();
  var ss = null;
  if (ssId) {
    try {
      ss = SpreadsheetApp.openById(ssId);
    } catch (eOpen) {
      ss = null;
    }
  }
  if (!ss) {
    ss = SpreadsheetApp.create('Aviators - Admin Agent API Catalog');
    props.setProperty(_ADMIN_AGENTS_API_CATALOG_SSID_PROP, ss.getId());
  }
  var sh = ss.getSheetByName(_ADMIN_AGENTS_API_CATALOG_TAB);
  if (!sh) sh = ss.insertSheet(_ADMIN_AGENTS_API_CATALOG_TAB);
  if (sh.getLastRow() < 1) {
    sh.getRange(1, 1, 1, 2).setValues([['model', 'strategy']]);
  } else {
    var h1 = String(sh.getRange(1, 1).getValue() || '').trim().toLowerCase();
    var h2 = String(sh.getRange(1, 2).getValue() || '').trim().toLowerCase();
    if (h1 !== 'model' || h2 !== 'strategy') {
      sh.getRange(1, 1, 1, 2).setValues([['model', 'strategy']]);
    }
  }
  return { spreadsheet: ss, sheet: sh };
}

/**
 * Catálogo editable desde hoja:
 * - Spreadsheet: Script Property ADMIN_AGENTS_API_CATALOG_SPREADSHEET_ID.
 * - Tab: agent_api_catalog.
 * - Columnas: model, strategy.
 * @return {{ ok: boolean, models: Array<string>, strategies: Array<string>, source: string, spreadsheetId: string, sheetName: string }}
 */
function AdminAgents_apiCatalog() {
  AdminAuth_requireAgentsAdmin();
  var props = PropertiesService.getScriptProperties();
  var defaultModels = [
    'vertex_ai/gemini-2.5-pro',
    'vertex_ai/gemini-2.5-flash',
    'vertex_ai/gemini-2.5-flash-lite',
    'vertex_ai/gemini-2.0-flash',
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
  var cat = AdminAgents_getOrCreateApiCatalogSheet_(props);
  var sh = cat.sheet;
  var models = [];
  var strategies = [];
  var last = sh.getLastRow();
  if (last >= 2) {
    var vals = sh.getRange(2, 1, last - 1, 2).getDisplayValues();
    var i;
    for (i = 0; i < vals.length; i++) {
      models.push(vals[i][0]);
      strategies.push(vals[i][1]);
    }
  }
  models = AdminAgents_uniqueNonEmpty_(models);
  strategies = AdminAgents_uniqueNonEmpty_(strategies);
  return {
    ok: true,
    models: models.length ? models : defaultModels,
    strategies: strategies.length ? strategies : defaultStrategies,
    source: models.length || strategies.length ? 'spreadsheet' : 'defaults',
    spreadsheetId: cat.spreadsheet.getId(),
    sheetName: _ADMIN_AGENTS_API_CATALOG_TAB,
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
    strategyName: String(inCfg.strategyName || base.strategyName).trim(),
    promptContext: String(inCfg.promptContext || '').trim(),
    promptInstructions: String(
      inCfg.promptInstructions != null
        ? inCfg.promptInstructions
        : base.promptInstructions,
    ),
    modelName: String(inCfg.modelName || '').trim(),
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
 * @return {{ folders: Array<{id:string,name:string}>, files: Array<{id:string,name:string}> }}
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
        files.push({
          id: idf,
          name: ('' + (/** @type {{name:?}} */ (ge).name || idf)).trim() || idf,
        });
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
    if (AdminAgents_ensureDefaultAgentsInRegistry_(fromFile)) {
      AdminAgents_saveRegistry_(props, fromFile);
    }
    return fromFile;
  }

  var legacy = AdminAgents_loadLegacyRegistryFromProperties_(props);
  if (legacy) {
    if (AdminAgents_ensureDefaultAgentsInRegistry_(legacy)) {
      // seeded missing defaults
    }
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
  var projectId = (props.getProperty('GLOBANT_PROJECT_ID') || '').trim();
  return GlobantAgentsApiClient_create({
    apiKey: apiKey,
    baseUrl: baseUrl || undefined,
    projectId: projectId || undefined,
  });
}

/**
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
  var idOrName = String(cfg.idOrName || cfg.name || profileName).trim();
  if (!idOrName) {
    throw new Error(
      UiStrings_t(UiStrings_activeLocale_(), 'err_admin_agent_api_id'),
    );
  }
  var name = String(cfg.name || profileName || idOrName).trim();
  var instructions = String(
    cfg.promptInstructions != null ? cfg.promptInstructions : systemPrompt,
  );
  var agentDefinition = {
    name: name,
    accessScope: cfg.accessScope,
    sharingScope: cfg.sharingScope,
    status: cfg.status,
    jobDescription: String(cfg.jobDescription || ''),
    avatarImage: String(cfg.avatarImage || ''),
    description: String(cfg.description || ''),
    agentData: {
      strategyName: String(cfg.strategyName || ''),
      prompt: {
        context: String(cfg.promptContext || ''),
        instructions: instructions,
      },
      llmConfig: {
        maxTokens: cfg.maxTokens,
        timeout: cfg.timeout,
        sampling: {
          temperature: cfg.temperature,
        },
      },
      models: [{ name: String(cfg.modelName || '') }],
    },
  };
  var client = AdminAgents_createGlobantAgentsApiClient_(props);
  var remote = client.upsertAgent(idOrName, agentDefinition, !!cfg.automaticPublish);

  cfg.idOrName = idOrName;
  cfg.name = name;
  cfg.promptInstructions = instructions;
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
 * @param {Object} ragClient
 * @param {Array<Object>} defaultsInRegistry
 * @return {number}
 */
function AdminAgents_ensureRemoteProfilesForDefaults_(
  ragClient,
  defaultsInRegistry,
) {
  var existing = AdminAgents_listRemoteProfilesSet_(ragClient);
  var created = 0;
  var i;
  for (i = 0; i < defaultsInRegistry.length; i++) {
    var ag = defaultsInRegistry[i];
    if (!ag || typeof ag !== 'object') continue;
    var name = String(ag.profileName || '').trim();
    if (!AdminAgents_isValidProfileName_(name)) continue;
    if (existing[name]) continue;
    var body = GlobantRagDefaults_buildCreateProfileBody(
      name,
      UiStrings_t(UiStrings_activeLocale_(), 'llm_auto_created_profile_desc'),
    );
    ragClient.createProfile(body);
    existing[name] = true;
    created++;
  }
  return created;
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
  AdminAuth_requireAgentsAdmin();
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
  var ragClient = AdminAgents_maybeCreateRagClient_(props);
  if (ragClient) {
    var exists = AdminAgents_listRemoteProfilesSet_(ragClient);
    var filtered = [];
    for (i = 0; i < out.length; i++) {
      if (exists[out[i].profileName]) filtered.push(out[i]);
    }
    out = filtered;
  }
  return { ok: true, agents: out };
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
  var ragClient = AdminAgents_maybeCreateRagClient_(props);
  if (ragClient) {
    var exists = AdminAgents_listRemoteProfilesSet_(ragClient);
    var filtered = [];
    for (i = 0; i < out.length; i++) {
      if (exists[out[i].profileName]) filtered.push(out[i]);
    }
    out = filtered;
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
  if (changedLocal) {
    AdminAgents_saveRegistry_(props, reg);
  }
  var createdProfiles = 0;
  var ragClient = AdminAgents_maybeCreateRagClient_(props);
  if (ragClient) {
    createdProfiles = AdminAgents_ensureRemoteProfilesForDefaults_(
      ragClient,
      AdminAgents_pickDefaultAgents_(reg),
    );
  }
  var createdLocal = Math.max(0, after - before);
  return {
    ok: true,
    created: createdLocal + createdProfiles,
    createdRegistry: createdLocal,
    createdProfiles: createdProfiles,
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

  // El guardado de Agentes siempre refleja la definición en Globant antes
  // de persistir localmente en Drive.
  var remoteSave = AdminAgents_upsertRemoteGlobantAgent_(
    props,
    profileName,
    systemPrompt,
    agentIn.globantAgent,
  );
  var globantAgent = remoteSave.config;

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
      revision: Number((remoteSave.remote && remoteSave.remote.revision) || 0),
      isDraft: !!(remoteSave.remote && remoteSave.remote.isDraft),
      status: String((remoteSave.remote && remoteSave.remote.status) || ''),
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
    if (!LlmProviderGlobant_isAssistantMode(props)) {
      try {
        GlobantControl_deleteRagProfile(String(removed.profileName || '').trim());
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

  var bootstrap = AdminKnowledge_getBootstrapSlice();
  var sr = AdminKnowledge_syncCorpusWithOptions({
    profileName: profileName,
    sources: sources,
    searchPrompt: systemPrompt,
    maxFiles: bootstrap.maxFiles,
  });

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
