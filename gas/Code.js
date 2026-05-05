/**
 * Web app — Aviators: Drive + consultas IA (Globant RAG, Globant Assistant o Gemini API).
 * Despliegue: «Ejecutar como: usuario que accede».
 */
function doGet() {
  var tpl = HtmlService.createTemplateFromFile('index');
  tpl.cssInclude = HtmlService.createHtmlOutputFromFile('tailwind-include')
    .getContent();
  tpl.legacyStyles = HtmlService.createHtmlOutputFromFile(
    'app-legacy-styles',
  ).getContent();
  tpl.i18nEmbed = JSON.stringify(UiStrings_getClientPack_());
  tpl.clientScriptCore = HtmlService.createHtmlOutputFromFile('app-client-core').getContent();
  tpl.clientScriptI18n = HtmlService.createHtmlOutputFromFile('app-client-i18n').getContent();
  tpl.clientScriptToast = HtmlService.createHtmlOutputFromFile('app-client-toast').getContent();
  tpl.clientScriptDrive = HtmlService.createHtmlOutputFromFile('app-client-drive').getContent();
  tpl.clientScriptChat = HtmlService.createHtmlOutputFromFile('app-client-chat').getContent();
  tpl.clientScriptAgents = HtmlService.createHtmlOutputFromFile('app-client-agents').getContent();
  tpl.clientScriptContents = HtmlService.createHtmlOutputFromFile('app-client-contents').getContent();
  tpl.clientScriptClients = HtmlService.createHtmlOutputFromFile('app-client-clients').getContent();
  tpl.clientScriptSearch = HtmlService.createHtmlOutputFromFile('app-client-search').getContent();
  tpl.clientScriptDashboard = HtmlService.createHtmlOutputFromFile('app-client-dashboard').getContent();
  tpl.clientScriptBoot = HtmlService.createHtmlOutputFromFile('app-client-boot').getContent();
  return tpl
    .evaluate()
    .setTitle('Aviators')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** @deprecated usar LlmOrchestrator_getUiConfig */
function getLlmUiConfig() {
  return LlmOrchestrator_getUiConfig();
}

/** Sesión + archivos + estado proveedor IA */
function getBootstrap() {
  return {
    session: getSessionInfo(),
    llm: LlmOrchestrator_getUiConfig(),
    admin: AdminKnowledge_getBootstrapSlice(),
    i18n: UiStrings_getClientPack_(),
  };
}

/**
 * Textos de UI para un idioma (selector en cliente; persiste en localStorage).
 * @param {string} locale - «es» o «en»
 * @return {Object<string, string>}
 */
function getI18nPack(locale) {
  return UiStrings_getClientPackForLocale(locale === 'en' ? 'en' : 'es');
}

/**
 * Diagnóstico de roles (planilla): en el editor Apps Script, elegí esta función y «Ejecutar».
 * Revisa acceso, pestaña `data`, encabezados y si tu email aparece en una fila.
 *
 * @return {Object}
 */
function debugRoleDirectory() {
  return RoleDirectory_diagnostic();
}

/**
 * Solo admin · guardar corpus: JSON `{folders:[{id,name}],files:[{id,name}]}` u opción legado (solo carpetas).
 * @param {string} sourcesJson
 * @param {string} [profileName]
 */
function adminSaveKnowledgeConfig(sourcesJson, profileName) {
  return AdminKnowledge_saveConfiguration(sourcesJson, profileName);
}

/**
 * Solo admin · búsqueda en Drive por nombre/texto (`includeFullText` para escanear contenido Workspace).
 *
 * @param {string} query
 * @param {boolean} [includeFullText]
 * @param {string} [pageToken]
 */
function adminDriveSearch(query, includeFullText, pageToken) {
  AdminAuth_requireAdmin();
  return DriveExplorer_searchDrive(
    query || '',
    !!includeFullText,
    pageToken || '',
  );
}

/**
 * Explorador de carpetas/archivos Drive (solo lectura) para quien tiene sesión como usuario que accede.
 * @param {string} parentId - vacío o «root»
 * @param {string} [pageToken]
 */
function driveBrowseFolder(parentId, pageToken) {
  var email = Session.getActiveUser().getEmail();
  if (!email) {
    throw new Error(
      UiStrings_t(
        UiStrings_activeLocale_(),
        'session_email_no_capture',
      ),
    );
  }
  return DriveExplorer_listChildren(parentId || '', pageToken || '');
}

/** Solo admin · guarda sólo carpeta raíz y sincroniza el árbol completo contra Globant (un clic). */
function adminQuickSyncKnowledgeRoot(rootFolderInput, profileName) {
  return AdminKnowledge_saveRootFolderOnlyAndSync(rootFolderInput, profileName);
}

/** Solo admin · recrea perfil Globant + sube PDFs desde carpetas seleccionadas y archivos pinchados */
function adminSyncKnowledgeCorpus() {
  return AdminKnowledge_syncCorpusFromDrive();
}

/** Solo admin · inventario: perfiles RAG o archivos /v1/files según modo */
function adminGlobantControlFetch() {
  return GlobantControl_fetchSnapshot();
}

/** Solo admin · documentos de un perfil RAG */
function adminGlobantRagDocuments(profileName, skip, count) {
  return GlobantControl_listRagDocuments(profileName, skip, count);
}

function adminGlobantDeleteRagProfile(profileName) {
  return GlobantControl_deleteRagProfile(profileName);
}

function adminGlobantDeleteRagProfileDocuments(profileName) {
  return GlobantControl_deleteRagProfileDocuments(profileName);
}

function adminGlobantDeleteRagDocument(profileName, documentId) {
  return GlobantControl_deleteRagDocument(profileName, documentId);
}

function adminGlobantDeleteAssistantFileCtrl(fileId) {
  return GlobantControl_deleteAssistantFileAdmin(fileId);
}

function getSessionInfo() {
  var locale = UiStrings_activeLocale_();
  var user = Session.getActiveUser();
  var email = user.getEmail();

  if (!email) {
    return {
      email: '',
      note: UiStrings_t(locale, 'note_no_email'),
      showNoRoleBanner: false,
    };
  }

  var note = '';
  var roleRec = null;
  var roleLookupError = false;
  try {
    roleRec = RoleDirectory_lookupRole(email);
  } catch (eRole) {
    roleLookupError = true;
    var errMsg = eRole && eRole.message ? String(eRole.message) : '';
    var roleNoteKey = 'session_no_role_line';
    if (errMsg === 'ERR_ROLE_LOOKUP_OPEN') roleNoteKey = 'session_role_err_open';
    else if (errMsg === 'ERR_ROLE_LOOKUP_TAB') roleNoteKey = 'session_role_err_tab';
    else if (errMsg === 'ERR_ROLE_LOOKUP_COLS')
      roleNoteKey = 'session_role_err_cols';
    note += (note ? ' ' : '') + UiStrings_t(locale, roleNoteKey);
    var logLine =
      '[getSessionInfo] RoleDirectory threw message=' +
      errMsg +
      ' i18nKey=' +
      roleNoteKey +
      ' sessionEmail=' +
      email;
    Logger.log(logLine);
    try {
      console.error(logLine);
      console.warn(logLine);
      console.info(logLine);
      console.log(logLine);
    } catch (ignore) {}
    if (eRole && eRole.stack) {
      var st = '[getSessionInfo] stack=' + String(eRole.stack).slice(0, 2000);
      Logger.log(st);
      try {
        console.error(st);
        console.warn(st);
      } catch (ignore2) {}
    }
  }

  var card = SessionProfile_getGoogleCard_();
  var localPart = email.split('@')[0] || email;

  var isVisitor = !roleRec;

  return {
    email: email,
    note: note,
    displayName: card.displayName || localPart,
    photoUrl: card.photoUrl || '',
    roleLabel: roleRec
      ? roleRec.label
      : UiStrings_t(locale, 'role_label_visitor'),
    roleKey: roleRec ? roleRec.key : 'visitante',
    isVisitor: isVisitor,
    showNoRoleBanner: roleLookupError,
  };
}

/**
 * Archivos de contexto Drive (lazy, llamado on-demand desde el cliente).
 * @return {{ files: Array<{id:string,name:string,url:string,mimeType:string}>, note: string }}
 */
function getContextFiles() {
  var locale = UiStrings_activeLocale_();
  var email = Session.getActiveUser().getEmail();
  if (!email) {
    return { files: [], note: UiStrings_t(locale, 'note_no_email') };
  }

  var q =
    '(' +
    "mimeType = '" +
    MimeType.GOOGLE_DOCUMENT +
    "' or mimeType = 'text/plain' or mimeType = 'text/markdown'" +
    ') and trashed = false';

  var it = DriveApp.searchFiles(q);
  var seen = {};
  var files = [];

  while (it.hasNext() && files.length < 24) {
    var f = it.next();
    var id = f.getId();
    if (seen[id]) continue;
    seen[id] = true;
    files.push({
      id: id,
      name: f.getName(),
      url: f.getUrl(),
      mimeType: f.getMimeType(),
    });
  }

  var note = files.length === 0 ? UiStrings_t(locale, 'note_no_docs') : '';
  return { files: files, note: note };
}

/**
 * Entrada HTML: delega en el orquestador (proveedor según Propiedades del script).
 * @param {string} question
 * @param {string[]} fileIds
 */
function askAboutDocuments(question, fileIds, historyJson) {
  var history = [];
  try { if (historyJson) history = JSON.parse(historyJson); } catch (e) {}
  var ans = LlmOrchestrator_consultWithDriveDocuments(question, fileIds, history);
  return {
    answer: ans.answer,
    meta: {
      model: ans.model,
      location: ans.providerLabel,
      filesUsed: ans.filesUsed,
    },
  };
}

/**
 * Paso 1 de orquestacion: clasifica la consulta y devuelve el/los agente(s) elegido(s).
 * @param {string} prompt
 * @return {{ agents: Array<{id:string,name:string}>, confidence: string, reason: string, isSelf: boolean }}
 */
function globantRouteQuery(prompt) {
  return AgentOrchestrator_routeOnly(prompt);
}

/**
 * Paso 2 de orquestacion: responde la consulta con el agente indicado.
 * @param {string} prompt
 * @param {string} agentId
 */
function globantAnswerWithAgent(prompt, agentId, historyJson) {
  var history = [];
  try { if (historyJson) history = JSON.parse(historyJson); } catch (e) {}
  var r = AgentOrchestrator_answerWith(prompt, agentId, history);
  return {
    answer: r.answer,
    agentName: r.agentName || '',
    meta: {
      model: r.model,
      location: r.providerLabel,
      filterNote: r.filterLabel,
      rawJson: r.rawJson,
    },
  };
}

/**
 * Consulta paralela: pregunta a multiples agentes y devuelve solo los que tengan contenido.
 * @param {string} prompt
 * @param {Array<string>} agentIds
 * @return {Array<{answer:string, agentName:string, meta:{model:string, location:string, filterNote:string, rawJson:string}}>}
 */
function globantAnswerMultiAgent(prompt, agentIds, historyJson) {
  var history = [];
  try { if (historyJson) history = JSON.parse(historyJson); } catch (e) {}
  var results = AgentOrchestrator_answerMulti(prompt, agentIds, history);
  var out = [];
  for (var i = 0; i < results.length; i++) {
    var r = results[i];
    out.push({
      answer: r.answer,
      agentName: r.agentName || '',
      meta: {
        model: r.model,
        location: r.providerLabel,
        filterNote: r.filterLabel,
        rawJson: r.rawJson,
      },
    });
  }
  return out;
}

/**
 * Prompt del home: pasa por orquestador y deriva al agente mas adecuado (legacy single-step).
 * @param {string} prompt
 */
function globantAskDirect(prompt) {
  if (LlmOrchestrator_resolveProviderKind() !== 'globant') {
    throw new Error(
      UiStrings_t(UiStrings_activeLocale_(), 'err_globant_direct'),
    );
  }
  var r = AgentOrchestrator_answer(prompt);
  return {
    answer: r.answer,
    meta: {
      model: r.model,
      location: r.providerLabel,
      filterNote: r.filterLabel,
      rawJson: r.rawJson,
    },
  };
}

/**
 * Borra un archivo en Globant Assistant API (`DELETE /v1/files/{id}`). Requiere GLOBANT_API_MODE=assistant.
 * @param {string} fileId
 */
function globantAssistantDeleteFile(fileId) {
  if (LlmOrchestrator_resolveProviderKind() !== 'globant') {
    throw new Error(
      UiStrings_t(UiStrings_activeLocale_(), 'err_globant_only_feature'),
    );
  }
  var p = PropertiesService.getScriptProperties();
  if (!LlmProviderGlobant_isAssistantMode(p)) {
    throw new Error(
      UiStrings_t(UiStrings_activeLocale_(), 'err_assistant_delete_mode'),
    );
  }
  var fid = (fileId || '').trim();
  if (!fid)
    throw new Error(
      UiStrings_t(UiStrings_activeLocale_(), 'err_globant_file_id'),
    );
  var apiKey = (p.getProperty(LLM_PROP.GLOBANT_API_KEY) || '').trim();
  var baseUrl = (p.getProperty(LLM_PROP.GLOBANT_BASE_URL) || '').trim();
  var client = GlobantAssistantApiClient_create({
    apiKey: apiKey,
    baseUrl: baseUrl || undefined,
  });
  client.deleteFile(fid);
  return { success: true };
}

/** Solo admin · listar agentes configurados (perfil + fuentes + prompt). */
function adminAgentsList() {
  return AdminAgents_list();
}

/** Solo admin · crear agentes por defecto faltantes (sin duplicar). */
function adminAgentsEnsureDefaults() {
  return AdminAgents_ensureDefaults();
}

/**
 * Solo admin · crear/actualizar agente (JSON serializado desde el cliente).
 * @param {string} agentJson
 */
function adminAgentsSave(agentJson) {
  var raw = ('' + (agentJson || '')).trim();
  /** @type {Object} */
  var obj;
  try {
    obj = JSON.parse(raw);
  } catch (e) {
    throw new Error(
      UiStrings_fmt_('err_json_invalid_detail', { message: e.message || '' }),
    );
  }
  return AdminAgents_upsert(obj);
}

/** Solo admin · eliminar agente (registro y perfil RAG en Globant si aplica). */
function adminAgentsDelete(agentId) {
  return AdminAgents_delete(agentId);
}

/** Solo admin · sincronizar corpus Drive → perfil Globant del agente. */
function adminAgentsSync(agentId) {
  return AdminAgents_sync(agentId);
}

/**
 * Catalogo de contenidos · lista para tabla/filtros.
 * @param {Object} filters
 */
function contentsList(filters) {
  return ContentCatalog_list(filters || {});
}

/**
 * Catalogo de contenidos · obtener detalle por id.
 * @param {string} contentId
 */
function contentsGet(contentId) {
  return ContentCatalog_get(contentId);
}

/**
 * Extrae metadata de un archivo enviándolo inline al LLM multimodal (sin indexación temporal).
 * @param {string} payloadJson {name, mimeType, dataBase64}
 * @param {string} contentType proposal|success_case|client
 */
function contentsExtractDraft(payloadJson, contentType) {
  return ContentExtraction_extractInline(payloadJson, contentType);
}

/**
 * Guardado transaccional (indexa + persiste).
 * @param {string} payloadJson
 */
function contentsSaveDraft(payloadJson) {
  return ContentIngestion_save(payloadJson);
}

/**
 * Eliminar contenido (desindexa + borra filas).
 * @param {string} contentId
 */
function contentsDelete(contentId) {
  return ContentIngestion_delete(contentId);
}

/**
 * Obtiene todos los tags usados en contenidos (para autocompletar).
 */
function contentsGetAllTags() {
  return { ok: true, tags: ContentCatalog_getAllTags() };
}

// ─────────────────────────────────────────────────────────────────────────────
// Clients Master
// ─────────────────────────────────────────────────────────────────────────────

function clientsList(filters) {
  return ClientsMaster_list(filters || {});
}

function clientsListForCombo() {
  return ClientsMaster_listForCombo();
}

function clientsGet(clientId) {
  return ClientsMaster_get(clientId);
}

function clientsUpsert(dataJson) {
  var data = typeof dataJson === 'string' ? JSON.parse(dataJson) : dataJson;
  return ClientsMaster_upsert(data);
}

function clientsEnsureByName(name) {
  return ClientsMaster_ensureByName(name);
}

function clientsDelete(clientId) {
  return ClientsMaster_delete(clientId);
}
