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
  tpl.clientScriptExport = HtmlService.createHtmlOutputFromFile('app-client-export').getContent();
  tpl.clientScriptDashboard = HtmlService.createHtmlOutputFromFile('app-client-dashboard').getContent();
  tpl.clientScriptMetrics = HtmlService.createHtmlOutputFromFile('app-client-metrics').getContent();
  tpl.clientScriptSettings = HtmlService.createHtmlOutputFromFile('app-client-settings').getContent();
  tpl.clientScriptAccessRequest = HtmlService.createHtmlOutputFromFile('app-client-access-request').getContent();
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
  var perms = {
    canViewAgents: false,
    canViewCatalog: false,
    canManageAgents: false,
    canEditCatalog: false,
    canViewMetrics: false,
    canResetMetrics: false,
    canManageUsers: false,
    canManageRoleConfig: false,
    canManageUnansweredQueue: false,
  };
  try {
    var email = ('' + Session.getActiveUser().getEmail()).trim();
    if (email) {
      perms.canManageAgents = AdminAuth_canManageAgents(email);
      perms.canEditCatalog = AdminAuth_emailCanWriteCatalog(email);
      perms.canViewAgents = AdminAuth_emailCanViewAgents(email);
      perms.canViewCatalog = AdminAuth_emailCanViewCatalog(email);
      perms.canViewMetrics = AdminAuth_emailCanViewMetrics(email);
      perms.canResetMetrics = AdminAuth_emailCanResetMetrics(email);
      perms.canManageUsers = AdminAuth_emailCanManageUsers(email);
      perms.canManageRoleConfig = AdminAuth_emailIsAdmin(email);
      perms.canManageUnansweredQueue = MetricsAuth_canManageQueue(email);
    }
  } catch (ePerms) {}

  var adminSlice = AdminKnowledge_getBootstrapSlice();
  adminSlice.adminUploadMaxBytes =
    typeof ADMIN_UPLOAD_LOCAL_MAX_BYTES !== 'undefined'
      ? ADMIN_UPLOAD_LOCAL_MAX_BYTES
      : 50 * 1024 * 1024;

  var quickPrompts = [];
  try { quickPrompts = MetricsService_quickPromptsGet_(); } catch (eQp) {}

  return {
    session: getSessionInfo(),
    llm: LlmOrchestrator_getUiConfig(),
    admin: adminSlice,
    i18n: UiStrings_getClientPack_(),
    permissions: perms,
    quickPrompts: quickPrompts,
    dataBackend: AviatorsDataBackend_mode_(),
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
 * Diagnóstico de roles (Supabase): en el editor Apps Script, elegí esta función y «Ejecutar».
 * Revisa configuración Supabase y si tu email tiene fila en la tabla `roles`.
 *
 * @return {Object}
 */
function debugRoleDirectory() {
  return RoleDirectory_diagnostic();
}

/**
 * Diagnóstico RAG y catálogo para una pregunta (editor Apps Script → Ejecutar).
 * @param {string} [question]
 * @return {Object}
 */
function debugAgentRagForQuestion(question) {
  return AgentOrchestrator_debugRagDiagnostics_(question);
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
    if (
      errMsg === 'ERR_SUPABASE_NOT_CONFIGURED' ||
      errMsg === 'ERR_SUPABASE_SHEETS_DISABLED' ||
      errMsg === 'ERR_ROLE_SUPABASE' ||
      errMsg.indexOf('ERR_SUPABASE_HTTP_') === 0
    )
      roleNoteKey = 'session_role_err_supabase';
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

  if (isVisitor && email) {
    AdminUsers_touchVisitorSession_(email, card.displayName || localPart);
  }

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
 * @param {string} raw
 * @return {string}
 */
function DriveQuery_escapeLiteral_(raw) {
  return String(raw || '')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');
}

/**
 * Resuelve URL de Drive por nombre de archivo.
 * Prioriza la carpeta raíz de proyecto cuando está disponible.
 * @param {string} fileName
 * @return {{ok:boolean,url:string,fileName:string}}
 */
function resolveDriveFileUrlByName(fileName) {
  var name = String(fileName || '').trim();
  if (!name) return { ok: false, url: '', fileName: '' };
  var q = 'trashed = false and title = "' + DriveQuery_escapeLiteral_(name) + '"';
  var rootFolderId = AviatorsConfig_driveRootFolderId_();
  if (rootFolderId) {
    q =
      '"' +
      DriveQuery_escapeLiteral_(rootFolderId) +
      '" in parents and ' +
      q;
  }
  var it = DriveApp.searchFiles(q);
  if (it.hasNext()) {
    var f = it.next();
    return { ok: true, url: String(f.getUrl() || ''), fileName: String(f.getName() || name) };
  }
  return { ok: false, url: '', fileName: name };
}

/**
 * @param {string[]} fileIds
 * @return {Array<{contentId:string,title:string,contentType:string,url:string,fileName:string,driveFileId:string}>}
 */
function ChatReferences_buildFromSelectedFiles_(fileIds) {
  var ids = Array.isArray(fileIds) ? fileIds : [];
  var refs = [];
  var seen = {};
  for (var i = 0; i < ids.length; i++) {
    var fid = String(ids[i] || '').trim();
    if (!fid || seen[fid]) continue;
    seen[fid] = true;
    try {
      var f = DriveApp.getFileById(fid);
      refs.push({
        contentId: '',
        title: String(f.getName() || fid),
        contentType: 'selected_file',
        url: String(f.getUrl() || ''),
        fileName: String(f.getName() || ''),
        driveFileId: fid,
      });
    } catch (e) {}
  }
  return refs;
}

/**
 * @param {Array<Object>} catalogRefs
 * @param {Array<Object>} selectedFileRefs
 * @return {Array<Object>}
 */
function ChatReferences_merge_(catalogRefs, selectedFileRefs) {
  var out = [];
  var i;
  var byFileName = {};
  for (i = 0; i < selectedFileRefs.length; i++) {
    var s = selectedFileRefs[i];
    var k = String(s.fileName || '').trim().toLowerCase();
    if (k) byFileName[k] = s;
  }

  var seen = {};
  var seenTargets = {};
  function resolveTargetKey_(ref, idx) {
    var driveId = String((ref && ref.driveFileId) || '').trim();
    if (driveId) return 'drive:' + driveId;
    var rawUrl = String((ref && ref.url) || '').trim();
    if (rawUrl) return 'url:' + rawUrl.toLowerCase();
    var name = String((ref && (ref.fileName || ref.title)) || '').trim().toLowerCase();
    if (name) return 'name:' + name;
    return 'idx:' + idx;
  }
  for (i = 0; i < catalogRefs.length; i++) {
    var c = catalogRefs[i] || {};
    var fKey = String(c.fileName || '').trim().toLowerCase();
    if (!c.url && fKey && byFileName[fKey] && byFileName[fKey].url) {
      c.url = byFileName[fKey].url;
    }
    if (!c.driveFileId && fKey && byFileName[fKey] && byFileName[fKey].driveFileId) {
      c.driveFileId = byFileName[fKey].driveFileId;
    }
    var idKey = String(c.contentId || '') || String(c.title || '');
    var targetKey = resolveTargetKey_(c, i);
    if (seenTargets[targetKey]) continue;
    if (idKey && !seen[idKey]) {
      seen[idKey] = true;
      seenTargets[targetKey] = true;
      out.push(c);
    } else if (!idKey) {
      seenTargets[targetKey] = true;
      out.push(c);
    }
  }

  // Fallback: if no catalog match, still provide explicit URLs from selected files.
  if (!out.length) {
    for (i = 0; i < selectedFileRefs.length; i++) {
      var sRef = selectedFileRefs[i];
      var sKey = 'file:' + String(sRef.driveFileId || sRef.fileName || i);
      var sTargetKey = resolveTargetKey_(sRef, i);
      if (seen[sKey] || seenTargets[sTargetKey]) continue;
      seen[sKey] = true;
      seenTargets[sTargetKey] = true;
      out.push(sRef);
    }
  }
  return out;
}

/**
 * @param {Object} ref
 * @return {Object}
 */
function ChatReferences_normalize_(ref) {
  var r = ref || {};
  return {
    contentId: String(r.contentId || r.content_id || '').trim(),
    title: String(r.title || '').trim(),
    contentType: String(r.contentType || r.content_type || '').trim(),
    clientName: String(r.clientName || r.client_name || '').trim(),
    url: String(r.url || r.driveUrl || r.drive_file_url || '').trim(),
    fileName: String(r.fileName || r.file_name || '').trim(),
    driveFileId: String(r.driveFileId || r.drive_file_id || '').trim(),
    globantDocumentId: String(
      r.globantDocumentId || r.documentId || r.globant_document_id || '',
    ).trim(),
    globantProfileName: String(
      r.globantProfileName || r.profileName || r.globant_profile_name || '',
    ).trim(),
  };
}

/**
 * @param {Object} ref
 * @return {Object}
 */
function ChatReferences_enrichFromCatalog_(ref) {
  var n = ChatReferences_normalize_(ref);
  var row = null;
  if (n.contentId) {
    try {
      row = ContentCatalogStore_getById(n.contentId);
    } catch (ignoreLookup) {}
  }
  if (row) {
    if (!n.title) n.title = String(row.title || '').trim();
    if (!n.contentType) n.contentType = String(row.content_type || '').trim();
    if (!n.clientName) n.clientName = String(row.client_name || '').trim();
    if (!n.fileName) n.fileName = String(row.file_name || '').trim();
    if (!n.driveFileId) n.driveFileId = String(row.drive_file_id || '').trim();
    if (!n.url) n.url = String(row.drive_file_url || '').trim();
    if (!n.globantDocumentId) {
      n.globantDocumentId = String(row.globant_document_id || '').trim();
    }
    if (!n.globantProfileName) {
      n.globantProfileName = String(row.globant_profile_name || '').trim();
    }
    if (!n.contentId) n.contentId = String(row.content_id || '').trim();
  }
  if (!n.url && n.driveFileId) {
    n.url = 'https://drive.google.com/open?id=' + encodeURIComponent(n.driveFileId);
  }
  if (!n.url && n.fileName && (n.contentType === 'success_case' || n.contentType === 'selected_file')) {
    var resolved = resolveDriveFileUrlByName(n.fileName);
    if (resolved.ok) n.url = resolved.url;
  }
  return n;
}

/**
 * @param {Object} ref
 * @param {string} email
 * @return {Object}
 */
function ChatReferences_buildActions_(ref, email) {
  var n = ChatReferences_enrichFromCatalog_(ref);
  var canCatalog = false;
  var canAgents = false;
  try {
    canCatalog = AdminAuth_emailCanViewCatalog(email);
  } catch (ignoreCat) {}
  try {
    canAgents = AdminAuth_emailCanViewAgents(email);
  } catch (ignoreAg) {}

  var driveUrl = n.url;
  if (!driveUrl && n.driveFileId) {
    driveUrl = 'https://drive.google.com/open?id=' + encodeURIComponent(n.driveFileId);
  }

  var hasDrive =
    !!driveUrl &&
    (n.contentType === 'success_case' ||
      n.contentType === 'selected_file' ||
      !!n.driveFileId ||
      /\.pdf($|\?)/i.test(driveUrl));

  return {
    contentId: n.contentId,
    title: n.title || n.fileName || n.contentId || '—',
    contentType: n.contentType,
    clientName: n.clientName,
    fileName: n.fileName,
    globantDocumentId: n.globantDocumentId,
    globantProfileName: n.globantProfileName,
    actions: {
      drive: { available: hasDrive, url: hasDrive ? driveUrl : '' },
      catalog: {
        available: !!(n.contentId && canCatalog),
        contentId: n.contentId,
      },
      rag: {
        available: !!(n.globantProfileName && canAgents),
        profileName: n.globantProfileName,
        documentId: n.globantDocumentId,
      },
    },
  };
}

/**
 * @param {Array<Object>} refs
 * @param {string=} email
 * @return {Array<Object>}
 */
function ChatReferences_enrichList_(refs, email) {
  if (!email) {
    try {
      email = Session.getActiveUser().getEmail();
    } catch (ignoreEmail) {}
  }
  email = String(email || '').trim();
  var list = Array.isArray(refs) ? refs : [];
  var out = [];
  var seen = {};
  var i;
  for (i = 0; i < list.length; i++) {
    var enriched = ChatReferences_buildActions_(list[i], email);
    var key =
      enriched.contentId ||
      enriched.actions.drive.url ||
      enriched.globantProfileName ||
      enriched.title;
    key = String(key || '').trim().toLowerCase();
    if (key && seen[key]) continue;
    if (key) seen[key] = true;
    if (
      enriched.actions.drive.available ||
      enriched.actions.catalog.available ||
      enriched.actions.rag.available ||
      enriched.title
    ) {
      out.push(enriched);
    }
  }
  return out.slice(0, 8);
}

/**
 * Resuelve acciones de apertura para una cita (p. ej. historial legacy).
 * @param {Object} ref
 * @return {Object}
 */
function resolveChatReference(ref) {
  var email = '';
  try {
    email = Session.getActiveUser().getEmail();
  } catch (ignore) {}
  return ChatReferences_buildActions_(ref || {}, email);
}

/**
 * @param {string} question
 * @param {string[]} fileIds
 */
function askAboutDocuments(question, fileIds, historyJson) {
  var history = [];
  try { if (historyJson) history = JSON.parse(historyJson); } catch (e) {}
  var ans = LlmOrchestrator_consultWithDriveDocuments(question, fileIds, history);
  var selectedRefs = ChatReferences_buildFromSelectedFiles_(fileIds);
  var catalogRefs = [];
  try {
    catalogRefs = AgentOrchestrator_matchCatalogReferences_(
      ans.answer || '',
      ['proposal', 'success_case', 'client'],
    );
  } catch (eMatch) {}
  var refs = ChatReferences_enrichList_(ChatReferences_merge_(catalogRefs, selectedRefs));
  var answerText = String(ans.answer || '').trim();
  var isUnanswered = !answerText;
  var tracked = MetricsService_trackQuestionEvent({
    mode: 'drive_docs',
    agentId: 'drive_docs',
    agentName: 'Drive Docs',
    questionText: question,
    isUnanswered: isUnanswered,
    unansweredCode: isUnanswered ? 'EMPTY_ANSWER' : '',
  });
  return {
    answer: ans.answer,
    eventId: (tracked && tracked.eventId) || '',
    meta: {
      model: ans.model,
      location: ans.providerLabel,
      filesUsed: ans.filesUsed,
      references: refs,
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
 * Analiza un documento adjunto efímero en el chat home (sin persistir).
 * @param {string} prompt
 * @param {string} payloadJson {name,mimeType,dataBase64}
 * @param {string=} historyJson
 */
function globantAnalyzeEphemeralDocument(prompt, payloadJson, historyJson) {
  var history = [];
  try {
    if (historyJson) history = JSON.parse(historyJson);
  } catch (e) {}
  var r = AgentOrchestrator_analyzeEphemeralDocument(prompt, payloadJson, historyJson);
  var tracked = MetricsService_trackQuestionEvent({
    mode: 'globant_ephemeral_doc',
    agentId: _ADMIN_AGENT_ID_ORCHESTRATOR,
    agentName: r.agentName || '',
    questionText: prompt,
    isUnanswered: !!r.isUnanswered,
    unansweredCode: r.unansweredCode || '',
  });
  return {
    answer: r.answer,
    agentName: r.agentName || '',
    eventId: (tracked && tracked.eventId) || '',
    meta: {
      model: r.model,
      location: r.providerLabel,
      filterNote: r.filterLabel,
      rawJson: r.rawJson,
      references: ChatReferences_enrichList_(r.references || []),
      docClassification: r.docClassification || null,
    },
  };
}

/**
 * @param {string} prompt
 * @param {string} agentId
 */
function globantAnswerWithAgent(prompt, agentId, historyJson) {
  var history = [];
  try { if (historyJson) history = JSON.parse(historyJson); } catch (e) {}
  var r = AgentOrchestrator_answerWith(prompt, agentId, history);
  var tracked = MetricsService_trackQuestionEvent({
    mode: 'globant_agent',
    agentId: agentId,
    agentName: r.agentName || '',
    questionText: prompt,
    isUnanswered: !!r.isUnanswered,
    unansweredCode: r.unansweredCode || '',
  });
  return {
    answer: r.answer,
    agentName: r.agentName || '',
    eventId: (tracked && tracked.eventId) || '',
    meta: {
      model: r.model,
      location: r.providerLabel,
      filterNote: r.filterLabel,
      rawJson: r.rawJson,
      references: ChatReferences_enrichList_(r.references || []),
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
  var multiAgentId = 'multi:' + (Array.isArray(agentIds) ? agentIds.join(',') : '');
  var tracked = MetricsService_trackQuestionEvent({
    mode: 'globant_multi',
    agentId: multiAgentId,
    agentName: 'Multi-agent',
    questionText: prompt,
    isUnanswered: !results || !results.length,
    unansweredCode: !results || !results.length ? 'NO_RELEVANT_CONTENT' : '',
  });
  var sharedEventId = (tracked && tracked.eventId) || '';
  var out = [];
  for (var i = 0; i < results.length; i++) {
    var r = results[i];
    out.push({
      answer: r.answer,
      agentName: r.agentName || '',
      eventId: sharedEventId,
      meta: {
        model: r.model,
        location: r.providerLabel,
        filterNote: r.filterLabel,
        rawJson: r.rawJson,
        references: ChatReferences_enrichList_(r.references || []),
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
  var noRelevant = String(r.answer || '').indexOf(
    UiStrings_t(UiStrings_activeLocale_(), 'chat_no_relevant_content'),
  ) >= 0;
  MetricsService_trackQuestionEvent({
    mode: 'globant_direct',
    agentId: 'orchestrator',
    agentName: 'orchestrator',
    questionText: prompt,
    isUnanswered: noRelevant,
    unansweredCode: noRelevant ? 'NO_RELEVANT_CONTENT' : '',
  });
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

/** Admin o lectura técnica/client partner · listar agentes configurados (perfil + fuentes + prompt). */
function adminAgentsList() {
  return AdminAgents_list();
}

/** Solo admin · crear agentes por defecto faltantes (sin duplicar). */
function adminAgentsEnsureDefaults() {
  return AdminAgents_ensureDefaults();
}

/** Admin o lectura técnica/client partner · catálogo de modelos/estrategias para Agent API. */
function adminAgentsApiCatalog() {
  return AdminAgents_apiCatalog();
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
 * Repara una fila del catálogo reindexando desde Drive; si el archivo ya no
 * existe, elimina la referencia remota y borra la fila.
 * @param {string} contentId
 */
function contentsRepairIndex(contentId) {
  return ContentIngestion_repairIndexFromDrive(contentId);
}

/**
 * Reindexa un documento existente en Globant con metadata actualizada
 * (sin re-subir el archivo). Usa los datos del catalogo.
 * @param {string} contentId
 */
function contentsReindexWithMetadata(contentId) {
  return ContentIngestion_reindexWithMetadata(contentId);
}

/**
 * Obtiene todos los tags usados en contenidos (para autocompletar).
 */
function contentsGetAllTags() {
  return { ok: true, tags: ContentCatalog_getAllTags() };
}

/**
 * Regenera embeddings vectoriales del catálogo (lote paginado).
 * @param {number} skip
 * @param {number} limit
 */
function contentsRebuildEmbeddingsBatch(skip, limit) {
  return ContentCatalog_rebuildEmbeddingsBatch(skip, limit);
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

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard (inicio)
// ─────────────────────────────────────────────────────────────────────────────

/** Métricas agregadas para tarjetas del home (admin y/o contributor según rol). */
function dashboardHomeMetrics() {
  return DashboardHome_metrics();
}

/**
 * Dashboard principal de métricas (leaderboards + tendencias).
 * @param {string} range
 * @param {number} topN
 */
function metricsDashboard(range, topN) {
  return MetricsService_dashboard(range, topN);
}

/**
 * Registro explícito de una pregunta para telemetría.
 * @param {Object} payload
 */
function metricsTrackQuestion(payload) {
  return MetricsService_trackQuestionEvent(payload || {});
}

/**
 * Lista paginada de consultas no respondidas.
 * @param {Object} filters
 */
function metricsUnansweredList(filters) {
  return MetricsService_unansweredList(filters || {});
}

/** Assignees válidos para la cola (admin / presales). */
function metricsUnansweredAssignees() {
  return MetricsService_unansweredAssignees_();
}

/**
 * Asigna una consulta no respondida.
 * @param {string} eventId
 * @param {string} assigneeEmail
 */
function metricsUnansweredAssign(eventId, assigneeEmail) {
  return MetricsService_unansweredAssign_(eventId, assigneeEmail);
}

/**
 * Cambia estado de cola: missing_content | resolved
 * @param {string} eventId
 * @param {string} status
 * @param {string=} note
 */
function metricsUnansweredSetStatus(eventId, status, note) {
  return MetricsService_unansweredSetStatus_(eventId, status, note);
}

/**
 * Lista paginada de leaderboard por tipo.
 * @param {string} kind
 * @param {Object} filters
 */
function metricsLeaderboardList(kind, filters) {
  return MetricsService_leaderboardList(kind, filters || {});
}

/** Reset total de métricas (solo admin). */
function metricsResetAll() {
  return MetricsService_resetAll();
}

/** Solo admin · listado paginado de visitantes sin rol. */
function adminUsersListVisitors(filters) {
  return AdminUsers_listVisitors(filters || {});
}

/** Solo admin · listado paginado de usuarios con rol. */
function adminUsersListRoles(filters) {
  return AdminUsers_listRoles(filters || {});
}

/** Solo admin · opciones de rol para asignación. */
function adminUsersRoleOptions() {
  return AdminUsers_roleOptions();
}

/** Solo admin · convertir visitante en usuario con rol. */
function adminUsersAssignRole(email, roleKey) {
  return AdminUsers_assignRole(email, roleKey);
}

/** Solo admin · actualizar rol de un usuario existente. */
function adminUsersUpdateRole(email, roleKey) {
  return AdminUsers_updateRole(email, roleKey);
}

/** Solo admin · quitar rol (vuelve a visitante en próximo acceso). */
function adminUsersRemoveRole(email) {
  return AdminUsers_removeRole(email);
}

/** Visitante · opciones de rol solicitables. */
function visitorAccessRequestRoleOptions() {
  return AccessRequest_roleOptions();
}

/** Visitante · solicitud pendiente del usuario actual. */
function visitorAccessRequestGetMine() {
  return AccessRequest_getMine();
}

/** Visitante · enviar solicitud de acceso. */
function visitorAccessRequestSubmit(roleKey, reason) {
  return AccessRequest_submit(roleKey, reason);
}

/** Solo admin · listado paginado de solicitudes de acceso. */
function adminUsersListAccessRequests(filters) {
  return AccessRequest_listForAdmin(filters || {});
}

/** Solo admin · descartar solicitud de acceso. */
function adminUsersDismissAccessRequest(requestId) {
  return AccessRequest_dismiss(requestId);
}

/** Solo admin · catálogo de roles y matriz de permisos. */
function adminRoleConfigGet() {
  return AdminRoleConfig_get();
}

/** Solo admin · guardar matriz de permisos (JSON). */
function adminRoleConfigSave(configJson) {
  return AdminRoleConfig_save(configJson);
}

/** Solo admin · crear rol personalizado. */
function adminRoleConfigAddRole(key, labelEs, labelEn) {
  return AdminRoleConfig_addRole(key, labelEs, labelEn);
}

/** Solo admin · eliminar rol personalizado sin usuarios asignados. */
function adminRoleConfigRemoveRole(key) {
  return AdminRoleConfig_removeRole(key);
}

/** Restablece todos los datos operativos en Supabase (solo admin). RPC legacy conserva nombre. */
function adminResetAllSpreadsheetData() {
  return AdminReset_resetAllSpreadsheetData();
}

/** Migra datos desde planillas hacia Supabase (solo admin, one-shot). */
function adminMigrateSpreadsheetsToSupabase() {
  return AdminSupabaseMigration_migrateFromSheets();
}

// ─────────────────────────────────────────────────────────────────────────────
// Feedback de chat
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Guarda feedback del usuario para una respuesta del chat.
 * @param {string} eventId
 * @param {string} rating  'up' | 'down'
 * @param {string} agentId
 * @param {string} agentName
 * @param {string} questionText
 * @return {{ok:boolean}}
 */
function metricsTrackFeedback(eventId, rating, agentId, agentName, questionText) {
  return MetricsService_trackFeedback_({
    eventId: eventId,
    rating: rating,
    agentId: agentId,
    agentName: agentName,
    questionText: questionText,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Historial de conversaciones
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Guarda o actualiza una conversación del usuario activo.
 * @param {string} convId
 * @param {string} title
 * @param {string} messagesJson
 * @return {{ok:boolean}}
 */
function chatHistorySave(convId, title, messagesJson) {
  return MetricsService_chatHistorySave_(convId, title, messagesJson);
}

/**
 * Lista las conversaciones del usuario activo (sin mensajes, solo metadatos).
 * @return {{ok:boolean,items:Array<{convId:string,title:string,tsCreated:string}>}}
 */
function chatHistoryList() {
  return MetricsService_chatHistoryList_();
}

/**
 * Carga los mensajes de una conversación.
 * @param {string} convId
 * @return {{ok:boolean,messagesJson:string}}
 */
function chatHistoryLoad(convId) {
  return MetricsService_chatHistoryLoad_(convId);
}

/**
 * Elimina una conversación.
 * @param {string} convId
 * @return {{ok:boolean}}
 */
function chatHistoryDelete(convId) {
  return MetricsService_chatHistoryDelete_(convId);
}

// ─────────────────────────────────────────────────────────────────────────────
// Quick prompts
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Devuelve los prompts rápidos configurados (o los de ejemplo si la hoja está vacía).
 * @return {Array<{id:string,es:string,en:string,order:number}>}
 */
function quickPromptsGet() {
  return MetricsService_quickPromptsGet_();
}

/**
 * Guarda los prompts rápidos. Solo admin.
 * @param {string} promptsJson  JSON array de {id,es,en,order}
 * @return {{ok:boolean}}
 */
function quickPromptsSave(promptsJson) {
  AdminAuth_requireAdmin();
  var prompts = [];
  try { prompts = JSON.parse(promptsJson); } catch (e) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_quick_prompts_parse'));
  }
  if (!Array.isArray(prompts)) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_quick_prompts_parse'));
  }
  return MetricsService_quickPromptsSave_(prompts);
}
