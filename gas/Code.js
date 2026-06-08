/**
 * Web app — Aviators: Drive + consultas IA (Globant RAG, Globant Assistant o Gemini API).
 * Despliegue: «Ejecutar como: usuario que accede».
 */
function doGet(e) {
  e = e || {};
  var globantDocId =
    e.parameter && String(e.parameter.globantDoc || e.parameter.pdf || '').trim();
  if (globantDocId) {
    return ChatReferences_serveGlobantDocHttp_(globantDocId);
  }

  var tpl = HtmlService.createTemplateFromFile('index');
  tpl.cssInclude = HtmlService.createHtmlOutputFromFile('tailwind-include')
    .getContent();
  tpl.legacyStyles = HtmlService.createHtmlOutputFromFile(
    'app-legacy-styles',
  ).getContent();
  tpl.i18nEmbed = JSON.stringify(UiStrings_getClientEmbedStub_());
  tpl.clientScriptCore = HtmlService.createHtmlOutputFromFile('app-client-core').getContent();
  tpl.clientScriptI18n = HtmlService.createHtmlOutputFromFile('app-client-i18n').getContent();
  tpl.clientScriptToast = HtmlService.createHtmlOutputFromFile('app-client-toast').getContent();
  tpl.clientScriptDrive = HtmlService.createHtmlOutputFromFile('app-client-drive').getContent();
  tpl.clientScriptChat = HtmlService.createHtmlOutputFromFile('app-client-chat').getContent();
  tpl.clientScriptProposalBuilding = HtmlService.createHtmlOutputFromFile('app-client-proposal-building')
    .getContent();
  tpl.clientScriptAgents = HtmlService.createHtmlOutputFromFile('app-client-agents').getContent();
  tpl.clientScriptContents = HtmlService.createHtmlOutputFromFile('app-client-contents').getContent();
  tpl.clientScriptTags = HtmlService.createHtmlOutputFromFile('app-client-tags').getContent();
  tpl.clientScriptClients = HtmlService.createHtmlOutputFromFile('app-client-clients').getContent();
  tpl.clientScriptKnowledgeGraph = HtmlService.createHtmlOutputFromFile('app-client-knowledge-graph')
    .getContent();
  tpl.knowledgeGraphLib = HtmlService.createHtmlOutputFromFile('knowledge-graph-vis-include')
    .getContent();
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

/**
 * Envuelve handlers RPC expuestos al cliente: registra errores y re-lanza.
 * @param {string} scope
 * @param {function():*} fn
 * @return {*}
 */
function AviatorsCode_runRpc_(scope, fn) {
  return AviatorsError_run_(scope, fn);
}

/** @deprecated usar LlmOrchestrator_getUiConfig */
function getLlmUiConfig() {
  return AviatorsCode_runRpc_('getLlmUiConfig', function () {
    return LlmOrchestrator_getUiConfig();
  });
}

/** Sesión + archivos + estado proveedor IA */
function getBootstrap() {
  return AviatorsCode_runRpc_('getBootstrap', function () {
  var perms = {
    canViewAgents: false,
    canViewCatalog: false,
    canViewTags: false,
    canViewClients: false,
    canManageAgents: false,
    canEditCatalog: false,
    canViewMetrics: false,
    canResetMetrics: false,
    canManageUsers: false,
    canManageRoleConfig: false,
    canManageUnansweredQueue: false,
    canSyncSalesforceAccounts: false,
    canViewOnboarding: false,
    canViewProposalBuilding: false,
    canViewKnowledgeGraph: false,
    canRebuildKnowledgeGraph: false,
  };
  try {
    var email = ('' + Session.getActiveUser().getEmail()).trim();
    if (email) {
      perms.canManageAgents = AdminAuth_canManageAgents(email);
      perms.canEditCatalog = AdminAuth_emailCanWriteCatalog(email);
      perms.canViewAgents = AdminAuth_emailCanViewAgents(email);
      perms.canViewCatalog = AdminAuth_emailCanViewCatalog(email);
      perms.canViewTags = AdminAuth_emailCanViewTags(email);
      perms.canViewClients = AdminAuth_emailCanViewClients(email);
      perms.canViewMetrics = AdminAuth_emailCanViewMetrics(email);
      perms.canResetMetrics = AdminAuth_emailCanResetMetrics(email);
      perms.canManageUsers = AdminAuth_emailCanManageUsers(email);
      perms.canManageRoleConfig = AdminAuth_emailIsAdmin(email);
      perms.canManageUnansweredQueue = AdminAuth_emailCanManageUnansweredQueue(email);
      perms.canSyncSalesforceAccounts = AdminAuth_emailCanSyncSalesforce(email);
      perms.canViewOnboarding = AdminAuth_emailCanViewOnboarding(email);
      perms.canViewProposalBuilding = AdminAuth_emailCanViewProposalBuilding(email);
      perms.canViewKnowledgeGraph = AdminAuth_emailCanViewKnowledgeGraph(email);
      perms.canRebuildKnowledgeGraph = AdminAuth_emailIsAdmin(email);
    }
  } catch (ePerms) {}

  var adminSlice = AdminKnowledge_getBootstrapSlice();
  adminSlice.adminUploadMaxBytes =
    typeof ADMIN_UPLOAD_LOCAL_MAX_BYTES !== 'undefined'
      ? ADMIN_UPLOAD_LOCAL_MAX_BYTES
      : 50 * 1024 * 1024;

  var quickPrompts = [];
  try { quickPrompts = MetricsService_quickPromptsGet_(); } catch (eQp) {}
  var onboardingQuickPrompts = [];
  try {
    onboardingQuickPrompts = MetricsService_onboardingQuickPromptsGet_();
  } catch (eQpOb) {}
  var globantOfferingQuickPrompts = [];
  try {
    globantOfferingQuickPrompts = MetricsService_globantOfferingQuickPromptsGet_();
  } catch (eQpGo) {}

  var webAppUrl = '';
  try {
    var svc = ScriptApp.getService();
    if (svc) webAppUrl = String(svc.getUrl() || '').trim();
  } catch (ignoreSvc) {}

  var kgLimits = null;
  if (perms.canViewKnowledgeGraph) {
    try {
      kgLimits = KnowledgeGraphLimits_get();
    } catch (ignoreKgLimits) {}
  }

  return {
    session: getSessionInfo(),
    llm: LlmOrchestrator_getUiConfig(),
    admin: adminSlice,
    permissions: perms,
    quickPrompts: quickPrompts,
    onboardingQuickPrompts: onboardingQuickPrompts,
    globantOfferingQuickPrompts: globantOfferingQuickPrompts,
    dataBackend: AviatorsDataBackend_mode_(),
    webAppUrl: webAppUrl,
    kgLimits: kgLimits,
  };
});
}

/**
 * Textos de UI para un idioma (selector en cliente; persiste en localStorage).
 * @param {string} locale - «es» o «en»
 * @return {Object<string, string>}
 */
function getI18nPack(locale) {
  return AviatorsCode_runRpc_('getI18nPack', function () {
    return UiStrings_getClientPackForLocale(locale === 'en' ? 'en' : 'es');
  });
}

/** Metadatos del pack i18n fragmentado (evita límite ~60 KB de google.script.run). */
function getI18nPackMeta(locale) {
  return AviatorsCode_runRpc_('getI18nPackMeta', function () {
    return UiStrings_getClientPackMeta_(locale === 'en' ? 'en' : 'es');
  });
}

/**
 * @param {string} locale
 * @param {number} partIndex
 * @return {Object<string, string>}
 */
function getI18nPackPart(locale, partIndex) {
  return AviatorsCode_runRpc_('getI18nPackPart', function () {
    return UiStrings_getClientPackPart_(locale === 'en' ? 'en' : 'es', partIndex);
  });
}

/**
 * Diagnóstico de roles (Supabase): en el editor Apps Script, elegí esta función y «Ejecutar».
 * Revisa configuración Supabase y si tu email tiene fila en la tabla `roles`.
 *
 * @return {Object}
 */
function debugRoleDirectory() {
  return AviatorsCode_runRpc_('debugRoleDirectory', function () {
    return RoleDirectory_diagnostic();
  });
}

/**
 * Diagnóstico RAG y catálogo para una pregunta (editor Apps Script → Ejecutar).
 * @param {string} [question]
 * @return {Object}
 */
function debugAgentRagForQuestion(question) {
  return AviatorsCode_runRpc_('debugAgentRagForQuestion', function () {
    return AgentOrchestrator_debugRagDiagnostics_(question);
  });
}

/**
 * Solo admin · guardar corpus: JSON `{folders:[{id,name}],files:[{id,name}]}` u opción legado (solo carpetas).
 * @param {string} sourcesJson
 * @param {string} [profileName]
 */
function adminSaveKnowledgeConfig(sourcesJson, profileName) {
  return AviatorsCode_runRpc_('adminSaveKnowledgeConfig', function () {
    return AdminKnowledge_saveConfiguration(sourcesJson, profileName);
  });
}

/**
 * Solo admin · búsqueda en Drive por nombre/texto (`includeFullText` para escanear contenido Workspace).
 *
 * @param {string} query
 * @param {boolean} [includeFullText]
 * @param {string} [pageToken]
 */
function adminDriveSearch(query, includeFullText, pageToken) {
  return AviatorsCode_runRpc_('adminDriveSearch', function () {
    AdminAuth_requireAdmin();
    return DriveExplorer_searchDrive(
      query || '',
      !!includeFullText,
      pageToken || '',
    );
  });
}

/**
 * Explorador de carpetas/archivos Drive (solo lectura) para quien tiene sesión como usuario que accede.
 * @param {string} parentId - vacío o «root»
 * @param {string} [pageToken]
 */
function driveBrowseFolder(parentId, pageToken) {
  return AviatorsCode_runRpc_('driveBrowseFolder', function () {
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
  });
}

/** Solo admin · guarda sólo carpeta raíz y sincroniza el árbol completo contra Globant (un clic). */
function adminQuickSyncKnowledgeRoot(rootFolderInput, profileName) {
  return AviatorsCode_runRpc_('adminQuickSyncKnowledgeRoot', function () {
    return AdminKnowledge_saveRootFolderOnlyAndSync(rootFolderInput, profileName);
  });
}

/** Solo admin · recrea perfil Globant + sube PDFs desde carpetas seleccionadas y archivos pinchados */
function adminSyncKnowledgeCorpus() {
  return AviatorsCode_runRpc_('adminSyncKnowledgeCorpus', function () {
    return AdminKnowledge_syncCorpusFromDrive();
  });
}

/** Solo admin · inventario: perfiles RAG o archivos /v1/files según modo */
function adminGlobantControlFetch() {
  return AviatorsCode_runRpc_('adminGlobantControlFetch', function () {
    return GlobantControl_fetchSnapshot();
  });
}

/** Solo admin · documentos de un perfil RAG */
function adminGlobantRagDocuments(profileName, skip, count) {
  return AviatorsCode_runRpc_('adminGlobantRagDocuments', function () {
    return GlobantControl_listRagDocuments(profileName, skip, count);
  });
}

function adminGlobantDeleteRagProfile(profileName) {
  return AviatorsCode_runRpc_('adminGlobantDeleteRagProfile', function () {
    return GlobantControl_deleteRagProfile(profileName);
  });
}

function adminGlobantDeleteRagProfileDocuments(profileName) {
  return AviatorsCode_runRpc_('adminGlobantDeleteRagProfileDocuments', function () {
    return GlobantControl_deleteRagProfileDocuments(profileName);
  });
}

function adminGlobantDeleteRagDocument(profileName, documentId) {
  return AviatorsCode_runRpc_('adminGlobantDeleteRagDocument', function () {
    return GlobantControl_deleteRagDocument(profileName, documentId);
  });
}

function adminGlobantDeleteAssistantFileCtrl(fileId) {
  return AviatorsCode_runRpc_('adminGlobantDeleteAssistantFileCtrl', function () {
    return GlobantControl_deleteAssistantFileAdmin(fileId);
  });
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
  return AviatorsCode_runRpc_('getContextFiles', function () {
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
  });
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
  return AviatorsCode_runRpc_('resolveDriveFileUrlByName', function () {
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
  });
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
  if (!n.url && n.globantDocumentId) {
    n.url = ChatReferences_resolveGlobantOpenUrl_(
      n.globantProfileName,
      n.globantDocumentId,
    );
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
  try {
    canCatalog = AdminAuth_emailCanViewCatalog(email);
  } catch (ignoreCat) {}

  var openUrl = ChatReferences_driveOpenUrl_(n.driveFileId, n.url);
  if (!openUrl && n.globantDocumentId) {
    openUrl = ChatReferences_resolveGlobantOpenUrl_(
      n.globantProfileName,
      n.globantDocumentId,
    );
  }

  var hasPdfLink = !!(
    openUrl ||
    n.driveFileId ||
    n.globantDocumentId ||
    (n.fileName && /\.pdf$/i.test(n.fileName))
  );

  return {
    contentId: n.contentId,
    title: n.title || n.fileName || n.contentId || '—',
    contentType: n.contentType,
    clientName: n.clientName,
    fileName: n.fileName,
    url: openUrl || '',
    globantDocumentId: n.globantDocumentId,
    globantProfileName: n.globantProfileName,
    actions: {
      drive: {
        available: hasPdfLink && !!openUrl,
        url: openUrl || '',
      },
      catalog: {
        available: !!(n.contentId && canCatalog),
        contentId: n.contentId,
      },
      clientMaster: {
        available: !!(n.clientName && canCatalog && !n.contentId),
        clientName: n.clientName,
      },
    },
  };
}

/**
 * @param {Object} a
 * @param {Object} b
 * @return {number}
 */
function ChatReferences_compareSort_(a, b) {
  var score = function (ref) {
    var r = ref || {};
    var act = r.actions || {};
    var drive = act.drive || {};
    if (drive.available && drive.url) return 0;
    if (r.url || r.driveFileId || r.globantDocumentId) return 0;
    if (act.catalog && act.catalog.available) return 1;
    if (r.contentId) return 1;
    if (act.clientMaster && act.clientMaster.available) return 3;
    if (r.clientName && r.contentType === 'client') return 3;
    return 2;
  };
  return score(a) - score(b);
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
      enriched.actions.clientMaster.available ||
      enriched.title
    ) {
      out.push(enriched);
    }
  }
  out.sort(ChatReferences_compareSort_);
  return out.slice(0, 8);
}

/**
 * Resuelve acciones de apertura para una cita (p. ej. historial legacy).
 * @param {Object} ref
 * @return {Object}
 */
function resolveChatReference(ref) {
  return AviatorsCode_runRpc_('resolveChatReference', function () {
    var email = '';
    try {
      email = Session.getActiveUser().getEmail();
    } catch (ignore) {}
    return ChatReferences_buildActions_(ref || {}, email);
  });
}

/**
 * Resuelve URL de apertura externa. Payload: { contentId?, driveFileId?, url?, globantDocumentId?, globantProfileName? }
 * @param {string} payloadJson
 */
function chatReferenceOpenUrl(payloadJson) {
  return AviatorsCode_runRpc_('chatReferenceOpenUrl', function () {
    var opts = {};
    try {
      if (payloadJson) opts = JSON.parse(payloadJson);
    } catch (eParse) {
      AviatorsError_throw_('ERR_PDF_NOT_AVAILABLE', 'chatReferenceOpenUrl', 'invalid_json');
    }
    var resolved = ChatReferences_resolveOpenUrl_(opts);
    if (!resolved.ok) {
      AviatorsError_throw_(
        resolved.code || 'ERR_PDF_NOT_AVAILABLE',
        'chatReferenceOpenUrl',
        resolved.message || '',
      );
    }
    return resolved;
  });
}

/** @deprecated usar chatReferenceOpenUrl */
function chatReferencePdfView(payloadJson) {
  return chatReferenceOpenUrl(payloadJson);
}

/**
 * @param {string} question
 * @param {string[]} fileIds
 */
function askAboutDocuments(question, fileIds, historyJson) {
  return AviatorsCode_runRpc_('askAboutDocuments', function () {
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
  });
}

/**
 * Paso 1 de orquestacion: clasifica la consulta y devuelve el/los agente(s) elegido(s).
 * @param {string} prompt
 * @return {{ agents: Array<{id:string,name:string}>, confidence: string, reason: string, isSelf: boolean }}
 */
function globantRouteQuery(prompt) {
  return AviatorsCode_runRpc_('globantRouteQuery', function () {
    return AgentOrchestrator_routeOnly(prompt);
  });
}

/**
 * Analiza un documento adjunto efímero en el chat home (sin persistir).
 * @param {string} prompt
 * @param {string} payloadJson {name,mimeType,dataBase64}
 * @param {string=} historyJson
 */
function globantAnalyzeEphemeralDocument(prompt, payloadJson, historyJson) {
  return AviatorsCode_runRpc_('globantAnalyzeEphemeralDocument', function () {
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
  });
}

/**
 * @param {string} prompt
 * @param {string} agentId
 */
function globantAnswerWithAgent(prompt, agentId, historyJson) {
  return AviatorsCode_runRpc_('globantAnswerWithAgent', function () {
    var aid = String(agentId || '').trim().toLowerCase();
    if (aid === 'onboarding') {
      AdminAuth_requireOnboardingView();
    }
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
  });
}

/**
 * Consulta paralela: pregunta a multiples agentes y devuelve solo los que tengan contenido.
 * @param {string} prompt
 * @param {Array<string>} agentIds
 * @return {Array<{answer:string, agentName:string, meta:{model:string, location:string, filterNote:string, rawJson:string}}>}
 */
function globantAnswerMultiAgent(prompt, agentIds, historyJson) {
  return AviatorsCode_runRpc_('globantAnswerMultiAgent', function () {
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
  });
}

/**
 * Prompt del home: pasa por orquestador y deriva al agente mas adecuado (legacy single-step).
 * @param {string} prompt
 */
function globantAskDirect(prompt) {
  return AviatorsCode_runRpc_('globantAskDirect', function () {
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
  });
}

/**
 * Borra un archivo en Globant Assistant API (`DELETE /v1/files/{id}`). Requiere GLOBANT_API_MODE=assistant.
 * @param {string} fileId
 */
function globantAssistantDeleteFile(fileId) {
  return AviatorsCode_runRpc_('globantAssistantDeleteFile', function () {
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
  });
}

/** Admin o lectura técnica/client partner · listar agentes configurados (perfil + fuentes + prompt). */
function adminAgentsList() {
  return AviatorsCode_runRpc_('adminAgentsList', function () {
    return AdminAgents_list();
  });
}

/** Solo admin · crear agentes por defecto faltantes (sin duplicar). */
function adminAgentsEnsureDefaults() {
  return AviatorsCode_runRpc_('adminAgentsEnsureDefaults', function () {
    return AdminAgents_ensureDefaults();
  });
}

/** Admin o lectura técnica/client partner · catálogo de modelos/estrategias para Agent API. */
function adminAgentsApiCatalog() {
  return AviatorsCode_runRpc_('adminAgentsApiCatalog', function () {
    return AdminAgents_apiCatalog();
  });
}

/**
 * Solo admin · crear/actualizar agente (JSON serializado desde el cliente).
 * @param {string} agentJson
 */
function adminAgentsSave(agentJson) {
  return AviatorsCode_runRpc_('adminAgentsSave', function () {
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
  });
}

/** Solo admin · eliminar agente (registro y perfil RAG en Globant si aplica). */
function adminAgentsDelete(agentId) {
  return AviatorsCode_runRpc_('adminAgentsDelete', function () {
    return AdminAgents_delete(agentId);
  });
}

/** Solo admin · sincronizar corpus Drive → perfil Globant del agente. */
function adminAgentsSync(agentId) {
  return AviatorsCode_runRpc_('adminAgentsSync', function () {
    return AdminAgents_sync(agentId);
  });
}

/**
 * Catalogo de contenidos · lista para tabla/filtros.
 * @param {Object} filters
 */
function contentsList(filters) {
  return AviatorsCode_runRpc_('contentsList', function () {
    return ContentCatalog_list(filters || {});
  });
}

/**
 * Catalogo de contenidos · obtener detalle por id.
 * @param {string} contentId
 */
function contentsGet(contentId) {
  return AviatorsCode_runRpc_('contentsGet', function () {
    return ContentCatalog_get(contentId);
  });
}

/**
 * Extrae metadata de un archivo enviándolo inline al LLM multimodal (sin indexación temporal).
 * @param {string} payloadJson {name, mimeType, dataBase64}
 * @param {string} contentType proposal|success_case|client
 */
function contentsListIndustryOptions() {
  return AviatorsCode_runRpc_('contentsListIndustryOptions', function () {
    return ContentCatalog_listIndustryOptions();
  });
}

function contentsExtractDraft(payloadJson, contentType) {
  return AviatorsCode_runRpc_('contentsExtractDraft', function () {
    return ContentExtraction_extractInline(payloadJson, contentType);
  });
}

/**
 * Una pasada de extracción success_case (el cliente encadena las pasadas).
 * @param {string} payloadJson {name, mimeType, dataBase64}
 * @param {string} contentType success_case
 * @param {string} passId common|challenge|solution|impact
 * @param {string} draftJson borrador acumulado ("" en la primera pasada)
 */
function contentsExtractDraftPass(payloadJson, contentType, passId, draftJson) {
  return AviatorsCode_runRpc_('contentsExtractDraftPass', function () {
    return ContentExtraction_extractPass(payloadJson, contentType, passId, draftJson);
  });
}

/**
 * Guardado transaccional (indexa + persiste).
 * @param {string} payloadJson
 */
function contentsSaveDraft(payloadJson) {
  return AviatorsCode_runRpc_('contentsSaveDraft', function () {
    return ContentIngestion_save(payloadJson);
  });
}

/**
 * Busca success cases existentes con metadata muy similar (evitar duplicados).
 * @param {string} payloadJson — { common, specific, excludeContentId? }
 * @return {{ok:boolean,matches:Array<Object>}}
 */
function contentsFindSimilarSuccessCases(payloadJson) {
  return AviatorsCode_runRpc_('contentsFindSimilarSuccessCases', function () {
    var payload = JSON.parse(String(payloadJson || '{}'));
    return ContentDuplicateCheck_findSimilarSuccessCases_({
      common: payload.common || {},
      specific: payload.specific || {},
      excludeContentId: payload.excludeContentId || '',
    });
  });
}

/**
 * Eliminar contenido (desindexa + borra filas).
 * @param {string} contentId
 */
function contentsDelete(contentId) {
  return AviatorsCode_runRpc_('contentsDelete', function () {
    return ContentIngestion_delete(contentId);
  });
}

/**
 * Asigna industria en lote a success cases seleccionados.
 * @param {Array<string>} contentIds
 * @param {string} industry
 * @return {{ok:boolean,updated:number,skipped:number,failed:number,industry:string}}
 */
function contentsBatchSetIndustry(contentIds, industry) {
  return AviatorsCode_runRpc_('contentsBatchSetIndustry', function () {
    return ContentCatalog_batchSetIndustry(contentIds, industry);
  });
}

/**
 * Asigna cliente en lote a success cases seleccionados.
 * @param {Array<string>} contentIds
 * @param {string} clientName
 */
function contentsBatchSetClient(contentIds, clientName) {
  return AviatorsCode_runRpc_('contentsBatchSetClient', function () {
    return ContentCatalog_batchSetSuccessCaseClient(contentIds, clientName);
  });
}

/**
 * Repara una fila del catálogo reindexando desde Drive; si el archivo ya no
 * existe, elimina la referencia remota y borra la fila.
 * @param {string} contentId
 */
function contentsRepairIndex(contentId) {
  return AviatorsCode_runRpc_('contentsRepairIndex', function () {
    return ContentIngestion_repairIndexFromDrive(contentId);
  });
}

/**
 * Reindexa un documento existente en Globant con metadata actualizada
 * (sin re-subir el archivo). Usa los datos del catalogo.
 * @param {string} contentId
 */
function contentsReindexWithMetadata(contentId) {
  return AviatorsCode_runRpc_('contentsReindexWithMetadata', function () {
    return ContentIngestion_reindexWithMetadata(contentId);
  });
}

/**
 * Devuelve el PDF en Drive de un contenido para re-extraer metadata en el cliente.
 * @param {string} contentId
 */
function contentsReextractMetadata(contentId) {
  return AviatorsCode_runRpc_('contentsReextractMetadata', function () {
    return ContentExtraction_getPdfPayloadFromContentId(contentId);
  });
}

/**
 * Obtiene todos los tags usados en contenidos (para autocompletar).
 */
function contentsGetAllTags() {
  return AviatorsCode_runRpc_('contentsGetAllTags', function () {
    return { ok: true, tags: ContentCatalog_getAllTags() };
  });
}

/**
 * Nube de tags del catálogo (tag + conteo por documento).
 */
function contentsGetTagsCloud() {
  return AviatorsCode_runRpc_('contentsGetTagsCloud', function () {
    return ContentCatalog_getTagsCloud();
  });
}

/**
 * Fusiona etiquetas del catálogo en el tag canónico más usado del grupo (irreversible).
 * @param {Array<string>} sources
 */
function contentsMergeTags(sources) {
  return AviatorsCode_runRpc_('contentsMergeTags', function () {
    return ContentCatalog_mergeTags(sources);
  });
}

/**
 * Sugerencias de fusión de tags (Globant Chat).
 */
function contentsSuggestTagMerges() {
  return AviatorsCode_runRpc_('contentsSuggestTagMerges', function () {
    return ContentTagMergeSuggest_list();
  });
}

/**
 * Regenera embeddings vectoriales del catálogo (lote paginado).
 * @param {number} skip
 * @param {number} limit
 */
function contentsRebuildEmbeddingsBatch(skip, limit) {
  return AviatorsCode_runRpc_('contentsRebuildEmbeddingsBatch', function () {
    return ContentCatalog_rebuildEmbeddingsBatch(skip, limit);
  });
}

/** Grafo de conocimiento · snapshot (permiso view_knowledge_graph o admin). */
function getKnowledgeGraph(filters) {
  return AviatorsCode_runRpc_('getKnowledgeGraph', function () {
    return KnowledgeGraph_getSnapshot(filters || {});
  });
}

/** Opciones de filtro del grafo (industrias/clientes presentes en nodos). */
function getKnowledgeGraphFilterOptions() {
  return AviatorsCode_runRpc_('getKnowledgeGraphFilterOptions', function () {
    return KnowledgeGraph_listFilterOptions();
  });
}

/** Catálogo de tipos de entidad y relación del grafo (conteos en Supabase). */
function getKnowledgeGraphEntityCatalog() {
  return AviatorsCode_runRpc_('getKnowledgeGraphEntityCatalog', function () {
    return KnowledgeGraph_getEntityCatalog();
  });
}

/** Listado paginado de entidades (nodos) del grafo. */
function listKnowledgeGraphEntities(params) {
  return AviatorsCode_runRpc_('listKnowledgeGraphEntities', function () {
    return KnowledgeGraph_listEntities(params || {});
  });
}

/** Alineación catálogo Supabase ↔ grafo (conteos y si hace falta sincronizar). */
function getKnowledgeGraphSyncStatus() {
  return AviatorsCode_runRpc_('getKnowledgeGraphSyncStatus', function () {
    return KnowledgeGraph_getSyncStatus();
  });
}

/** Solo admin · backfill paginado del grafo de conocimiento. */
function rebuildKnowledgeGraphBatch(skip, limit) {
  return AviatorsCode_runRpc_('rebuildKnowledgeGraphBatch', function () {
    return KnowledgeGraph_rebuildBatch(skip, limit);
  });
}

/** Solo admin · un lote por etapa (contents → clients → salesforce → stale → prune). */
function rebuildKnowledgeGraphStep(phase, skip, limit, reset) {
  return AviatorsCode_runRpc_('rebuildKnowledgeGraphStep', function () {
    return KnowledgeGraph_rebuildStep(phase, skip, limit, !!reset);
  });
}

/** Solo admin · progreso persistido del rebuild (reanudar tras timeout). */
function getKnowledgeGraphRebuildProgress() {
  return AviatorsCode_runRpc_('getKnowledgeGraphRebuildProgress', function () {
    return KnowledgeGraph_getRebuildProgress();
  });
}

/** Solo admin · descartar progreso de rebuild interrumpido. */
function adminKnowledgeGraphDiscardRebuildProgress() {
  return AviatorsCode_runRpc_('adminKnowledgeGraphDiscardRebuildProgress', function () {
    return AdminKnowledgeGraph_discardRebuildProgress();
  });
}

/** Estado de sincronización del grafo en segundo plano (triggers). */
function getKnowledgeGraphBackgroundSyncStatus() {
  return AviatorsCode_runRpc_('getKnowledgeGraphBackgroundSyncStatus', function () {
    return KnowledgeGraph_getBackgroundCatchupStatus();
  });
}

/** Solo admin · encolar sync del grafo en segundo plano (no bloquea la UI). */
function adminKnowledgeGraphEnqueueBackgroundSync(reset) {
  return AviatorsCode_runRpc_('adminKnowledgeGraphEnqueueBackgroundSync', function () {
    return AdminKnowledgeGraph_enqueueBackgroundSync(!!reset);
  });
}

/** Solo admin · vacía el grafo en Supabase y encola rebuild completo. */
function adminKnowledgeGraphRebuildFromScratch() {
  return AviatorsCode_runRpc_('adminKnowledgeGraphRebuildFromScratch', function () {
    return AdminKnowledgeGraph_rebuildFromScratch_();
  });
}

/** Solo admin · cancelar sync en segundo plano. */
function adminKnowledgeGraphDiscardBackgroundSync() {
  return AviatorsCode_runRpc_('adminKnowledgeGraphDiscardBackgroundSync', function () {
    return AdminKnowledgeGraph_discardBackgroundSync();
  });
}

/** Límites del grafo (lectura · permiso view_knowledge_graph). */
function getKnowledgeGraphLimits() {
  return AviatorsCode_runRpc_('getKnowledgeGraphLimits', function () {
    return KnowledgeGraph_getLimitsConfig();
  });
}

/** Solo admin · guardar límites del grafo en app_settings. */
function adminKnowledgeGraphLimitsSave(configJson) {
  return AviatorsCode_runRpc_('adminKnowledgeGraphLimitsSave', function () {
    return AdminKnowledgeGraphLimits_save(configJson);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Clients Master
// ─────────────────────────────────────────────────────────────────────────────

function clientsList(filters) {
  return AviatorsCode_runRpc_('clientsList', function () {
    return ClientsMaster_list(filters || {});
  });
}

function clientsListForCombo() {
  return AviatorsCode_runRpc_('clientsListForCombo', function () {
    return ClientsMaster_listForCombo();
  });
}

function clientsListFilterOptions() {
  return AviatorsCode_runRpc_('clientsListFilterOptions', function () {
    return ClientsMaster_listFilterOptions();
  });
}

/** Solo admin · fusiona clientes duplicados por variaciones de acentos en el nombre. */
function adminClientsReconcileDuplicates() {
  return AviatorsCode_runRpc_('adminClientsReconcileDuplicates', function () {
    AdminAuth_requireAdmin();
    return ClientsMaster_reconcileDuplicates();
  });
}

function clientsGet(clientId) {
  return AviatorsCode_runRpc_('clientsGet', function () {
    return ClientsMaster_get(clientId);
  });
}

function clientsUpsert(dataJson) {
  return AviatorsCode_runRpc_('clientsUpsert', function () {
    var data = typeof dataJson === 'string' ? JSON.parse(dataJson) : dataJson;
    return ClientsMaster_upsert(data);
  });
}

function clientsEnsureByName(name) {
  return AviatorsCode_runRpc_('clientsEnsureByName', function () {
    return ClientsMaster_ensureByName(name);
  });
}

function clientsDelete(clientId) {
  return AviatorsCode_runRpc_('clientsDelete', function () {
    return ClientsMaster_delete(clientId);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard (inicio)
// ─────────────────────────────────────────────────────────────────────────────

/** Métricas agregadas para tarjetas del home (admin y/o contributor según rol). */
function dashboardHomeMetrics() {
  return AviatorsCode_runRpc_('dashboardHomeMetrics', function () {
    return DashboardHome_metrics();
  });
}

/**
 * Dashboard principal de métricas (leaderboards + tendencias).
 * @param {string} range
 * @param {number} topN
 */
function metricsDashboard(range, topN) {
  return AviatorsCode_runRpc_('metricsDashboard', function () {
    return MetricsService_dashboard(range, topN);
  });
}

/**
 * Registro explícito de una pregunta para telemetría.
 * @param {Object} payload
 */
function metricsTrackQuestion(payload) {
  return AviatorsCode_runRpc_('metricsTrackQuestion', function () {
    return MetricsService_trackQuestionEvent(payload || {});
  });
}

/**
 * Lista paginada de consultas no respondidas.
 * @param {Object} filters
 */
function metricsUnansweredList(filters) {
  return AviatorsCode_runRpc_('metricsUnansweredList', function () {
    return MetricsService_unansweredList(filters || {});
  });
}

/** Assignees válidos para la cola (admin / presales). */
function metricsUnansweredAssignees() {
  return AviatorsCode_runRpc_('metricsUnansweredAssignees', function () {
    return MetricsService_unansweredAssignees_();
  });
}

/**
 * Asigna una consulta no respondida.
 * @param {string} eventId
 * @param {string} assigneeEmail
 */
function metricsUnansweredAssign(eventId, assigneeEmail) {
  return AviatorsCode_runRpc_('metricsUnansweredAssign', function () {
    return MetricsService_unansweredAssign_(eventId, assigneeEmail);
  });
}

/**
 * Cambia estado de cola: missing_content | resolved
 * @param {string} eventId
 * @param {string} status
 * @param {string=} note
 */
function metricsUnansweredSetStatus(eventId, status, note) {
  return AviatorsCode_runRpc_('metricsUnansweredSetStatus', function () {
    return MetricsService_unansweredSetStatus_(eventId, status, note);
  });
}

/**
 * Lista paginada de leaderboard por tipo.
 * @param {string} kind
 * @param {Object} filters
 */
function metricsLeaderboardList(kind, filters) {
  return AviatorsCode_runRpc_('metricsLeaderboardList', function () {
    return MetricsService_leaderboardList(kind, filters || {});
  });
}

/** Reset total de métricas (solo admin). */
function metricsResetAll() {
  return AviatorsCode_runRpc_('metricsResetAll', function () {
    return MetricsService_resetAll();
  });
}

/** Solo admin · listado paginado de visitantes sin rol. */
function adminUsersListVisitors(filters) {
  return AviatorsCode_runRpc_('adminUsersListVisitors', function () {
    return AdminUsers_listVisitors(filters || {});
  });
}

/** Solo admin · listado paginado de usuarios con rol. */
function adminUsersListRoles(filters) {
  return AviatorsCode_runRpc_('adminUsersListRoles', function () {
    return AdminUsers_listRoles(filters || {});
  });
}

/** Solo admin · opciones de rol para asignación. */
function adminUsersRoleOptions() {
  return AviatorsCode_runRpc_('adminUsersRoleOptions', function () {
    return AdminUsers_roleOptions();
  });
}

/** Solo admin · convertir visitante en usuario con rol. */
function adminUsersAssignRole(email, roleKey) {
  return AviatorsCode_runRpc_('adminUsersAssignRole', function () {
    return AdminUsers_assignRole(email, roleKey);
  });
}

/** Solo admin · vista previa de correos en lista pegada. */
function adminUsersPreviewBulkEmails(rawText) {
  return AviatorsCode_runRpc_('adminUsersPreviewBulkEmails', function () {
    return AdminUsers_previewBulkEmails(rawText);
  });
}

/** Solo admin · asignar rol a lista pegada (solo extrae emails). */
function adminUsersAssignRoleBulk(rawText, roleKey) {
  return AviatorsCode_runRpc_('adminUsersAssignRoleBulk', function () {
    return AdminUsers_assignRoleBulk(rawText, roleKey);
  });
}

/** Solo admin · actualizar rol de un usuario existente. */
function adminUsersUpdateRole(email, roleKey) {
  return AviatorsCode_runRpc_('adminUsersUpdateRole', function () {
    return AdminUsers_updateRole(email, roleKey);
  });
}

/** Solo admin · quitar rol (vuelve a visitante en próximo acceso). */
function adminUsersRemoveRole(email) {
  return AviatorsCode_runRpc_('adminUsersRemoveRole', function () {
    return AdminUsers_removeRole(email);
  });
}

/** Visitante · opciones de rol solicitables. */
function visitorAccessRequestRoleOptions() {
  return AviatorsCode_runRpc_('visitorAccessRequestRoleOptions', function () {
    return AccessRequest_roleOptions();
  });
}

/** Visitante · solicitud pendiente del usuario actual. */
function visitorAccessRequestGetMine() {
  return AviatorsCode_runRpc_('visitorAccessRequestGetMine', function () {
    return AccessRequest_getMine();
  });
}

/** Visitante · enviar solicitud de acceso. */
function visitorAccessRequestSubmit(roleKey, reason) {
  return AviatorsCode_runRpc_('visitorAccessRequestSubmit', function () {
    return AccessRequest_submit(roleKey, reason);
  });
}

/** Solo admin · listado paginado de solicitudes de acceso. */
function adminUsersListAccessRequests(filters) {
  return AviatorsCode_runRpc_('adminUsersListAccessRequests', function () {
    return AccessRequest_listForAdmin(filters || {});
  });
}

/** Solo admin · descartar solicitud de acceso. */
function adminUsersDismissAccessRequest(requestId) {
  return AviatorsCode_runRpc_('adminUsersDismissAccessRequest', function () {
    return AccessRequest_dismiss(requestId);
  });
}

/** Solo admin · catálogo de roles y matriz de permisos. */
function adminRoleConfigGet() {
  return AviatorsCode_runRpc_('adminRoleConfigGet', function () {
    return AdminRoleConfig_get();
  });
}

/** Solo admin · guardar matriz de permisos (JSON). */
function adminRoleConfigSave(configJson) {
  return AviatorsCode_runRpc_('adminRoleConfigSave', function () {
    return AdminRoleConfig_save(configJson);
  });
}

/** Solo admin · crear rol personalizado. */
function adminRoleConfigAddRole(key, labelEs, labelEn) {
  return AviatorsCode_runRpc_('adminRoleConfigAddRole', function () {
    return AdminRoleConfig_addRole(key, labelEs, labelEn);
  });
}

/** Solo admin · eliminar rol personalizado sin usuarios asignados. */
function adminRoleConfigRemoveRole(key) {
  return AviatorsCode_runRpc_('adminRoleConfigRemoveRole', function () {
    return AdminRoleConfig_removeRole(key);
  });
}

/** Restablece todos los datos operativos en Supabase (solo admin). RPC legacy conserva nombre. */
function adminResetAllSpreadsheetData() {
  return AviatorsCode_runRpc_('adminResetAllSpreadsheetData', function () {
    return AdminReset_resetAllSpreadsheetData();
  });
}

/** Migra datos desde planillas hacia Supabase (solo admin, one-shot). */
function adminMigrateSpreadsheetsToSupabase() {
  return AviatorsCode_runRpc_('adminMigrateSpreadsheetsToSupabase', function () {
    return AdminSupabaseMigration_migrateFromSheets();
  });
}

/** Requiere permiso sync_salesforce · estado del sync automático Salesforce. */
function adminSalesforceAccountsGetSyncStatus() {
  return AviatorsCode_runRpc_('adminSalesforceAccountsGetSyncStatus', function () {
    AdminAuth_requireSyncSalesforce();
    return SalesforceAccounts_getSyncStatus();
  });
}

/** Requiere permiso sync_salesforce · instala trigger diario de sync Salesforce Accounts. */
function adminSalesforceAccountsInstallDailyTrigger() {
  return AviatorsCode_runRpc_('adminSalesforceAccountsInstallDailyTrigger', function () {
    AdminAuth_requireSyncSalesforce();
    return SalesforceAccounts_installDailyTrigger();
  });
}

/** Requiere permiso sync_salesforce · sync manual del roster Salesforce. */
function adminSalesforceAccountsRunSync() {
  return AviatorsCode_runRpc_('adminSalesforceAccountsRunSync', function () {
    AdminAuth_requireSyncSalesforce();
    return SalesforceAccounts_runFullSync(true);
  });
}

/** Requiere permiso sync_salesforce · fase 1: lee planilla y persiste cuentas (sin embeddings). */
function adminSalesforceAccountsRunSyncData(force) {
  return AviatorsCode_runRpc_('adminSalesforceAccountsRunSyncData', function () {
    AdminAuth_requireSyncSalesforce();
    return SalesforceAccounts_runSyncData_(!!force);
  });
}

/** Requiere permiso sync_salesforce · fase 2: indexa embeddings del último sync. */
function adminSalesforceAccountsRunSyncEmbeddingsBatch(start, limit) {
  return AviatorsCode_runRpc_('adminSalesforceAccountsRunSyncEmbeddingsBatch', function () {
    AdminAuth_requireSyncSalesforce();
    return SalesforceAccounts_runSyncEmbeddingsBatch_(start, limit);
  });
}

/** Requiere permiso sync_salesforce · actualiza prompt del agente clients en el registry. */
function adminSalesforceAccountsRefreshClientsPrompt() {
  return AviatorsCode_runRpc_('adminSalesforceAccountsRefreshClientsPrompt', function () {
    AdminAuth_requireSyncSalesforce();
    return SalesforceAccounts_refreshClientsAgentPrompt();
  });
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
  return AviatorsCode_runRpc_('metricsTrackFeedback', function () {
    return MetricsService_trackFeedback_({
      eventId: eventId,
      rating: rating,
      agentId: agentId,
      agentName: agentName,
      questionText: questionText,
    });
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
  return AviatorsCode_runRpc_('chatHistorySave', function () {
    return MetricsService_chatHistorySave_(convId, title, messagesJson);
  });
}

/**
 * Lista las conversaciones del usuario activo (sin mensajes, solo metadatos).
 * @return {{ok:boolean,items:Array<{convId:string,title:string,tsCreated:string}>}}
 */
function chatHistoryList() {
  return AviatorsCode_runRpc_('chatHistoryList', function () {
    return MetricsService_chatHistoryList_();
  });
}

/**
 * Carga los mensajes de una conversación.
 * @param {string} convId
 * @return {{ok:boolean,messagesJson:string}}
 */
function chatHistoryLoad(convId) {
  return AviatorsCode_runRpc_('chatHistoryLoad', function () {
    return MetricsService_chatHistoryLoad_(convId);
  });
}

/**
 * Elimina una conversación.
 * @param {string} convId
 * @return {{ok:boolean}}
 */
function chatHistoryDelete(convId) {
  return AviatorsCode_runRpc_('chatHistoryDelete', function () {
    return MetricsService_chatHistoryDelete_(convId);
  });
}

/**
 * Genera PDF de conversacion completa o de un turno (respuesta + pregunta previa).
 * @param {Object} payload { mode, locale, logoSrc, messages, turnIndex? }
 * @return {{ok:boolean, filename:string, mimeType:string, pdfBase64:string}}
 */
function chatExportPdf(payload) {
  return AviatorsCode_runRpc_('chatExportPdf', function () {
    return ChatExportPdf_export_(payload);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Quick prompts
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Devuelve los prompts rápidos configurados (o los de ejemplo si la hoja está vacía).
 * @return {Array<{id:string,es:string,en:string,order:number}>}
 */
function quickPromptsGet() {
  return AviatorsCode_runRpc_('quickPromptsGet', function () {
    return MetricsService_quickPromptsGet_();
  });
}

/**
 * Guarda los prompts rápidos. Solo admin.
 * @param {string} promptsJson  JSON array de {id,es,en,order}
 * @return {{ok:boolean}}
 */
function quickPromptsSave(promptsJson) {
  return AviatorsCode_runRpc_('quickPromptsSave', function () {
    AdminAuth_requireAdmin();
    var prompts = [];
    try { prompts = JSON.parse(promptsJson); } catch (e) {
      throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_quick_prompts_parse'));
    }
    if (!Array.isArray(prompts)) {
      throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_quick_prompts_parse'));
    }
    return MetricsService_quickPromptsSave_(prompts);
  });
}

/**
 * Prompts rápidos del chat onboarding.
 * @return {Array<{id:string,es:string,en:string,order:number}>}
 */
function onboardingQuickPromptsGet() {
  return AviatorsCode_runRpc_('onboardingQuickPromptsGet', function () {
    return MetricsService_onboardingQuickPromptsGet_();
  });
}

/**
 * Guarda prompts rápidos de onboarding. Solo admin.
 * @param {string} promptsJson
 * @return {{ok:boolean}}
 */
function onboardingQuickPromptsSave(promptsJson) {
  return AviatorsCode_runRpc_('onboardingQuickPromptsSave', function () {
    AdminAuth_requireAdmin();
    var prompts = [];
    try { prompts = JSON.parse(promptsJson); } catch (eOb) {
      throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_quick_prompts_parse'));
    }
    if (!Array.isArray(prompts)) {
      throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_quick_prompts_parse'));
    }
    return MetricsService_onboardingQuickPromptsSave_(prompts);
  });
}

/**
 * Prompts rápidos del chat Globant Offering.
 * @return {Array<{id:string,es:string,en:string,order:number}>}
 */
function globantOfferingQuickPromptsGet() {
  return AviatorsCode_runRpc_('globantOfferingQuickPromptsGet', function () {
    return MetricsService_globantOfferingQuickPromptsGet_();
  });
}

/**
 * Guarda prompts rápidos de Globant Offering. Solo admin.
 * @param {string} promptsJson
 * @return {{ok:boolean}}
 */
function globantOfferingQuickPromptsSave(promptsJson) {
  return AviatorsCode_runRpc_('globantOfferingQuickPromptsSave', function () {
    AdminAuth_requireAdmin();
    var prompts = [];
    try {
      prompts = JSON.parse(promptsJson);
    } catch (eGo) {
      throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_quick_prompts_parse'));
    }
    if (!Array.isArray(prompts)) {
      throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_quick_prompts_parse'));
    }
    return MetricsService_globantOfferingQuickPromptsSave_(prompts);
  });
}

/**
 * Extrae brief comercial desde chat/adjuntos (Armado de propuestas).
 * @param {string} payloadJson
 * @return {{ok:boolean, brief:Object}}
 */
function proposalBuildingExtractBrief(payloadJson) {
  return AviatorsCode_runRpc_('proposalBuildingExtractBrief', function () {
    return ProposalBuilding_extractBrief(payloadJson);
  });
}

/**
 * Fusiona varios briefs extraídos (multi-documento).
 * @param {string} briefsJson
 */
function proposalBuildingMergeExtractedBriefs(briefsJson) {
  return AviatorsCode_runRpc_('proposalBuildingMergeExtractedBriefs', function () {
    return ProposalBuilding_mergeExtractedBriefs(briefsJson);
  });
}

/**
 * Recomienda Globant Studios para la propuesta (agente proposals + catálogo).
 * @param {string} briefJson
 * @param {string=} industryKey
 */
function proposalBuildingRecommendStudios(briefJson, industryKey) {
  return AviatorsCode_runRpc_('proposalBuildingRecommendStudios', function () {
    return ProposalBuilding_recommendStudios(briefJson, industryKey);
  });
}

/**
 * Responde con agente proposals inyectando brief validado + industria/deck.
 * @param {string} question
 * @param {string} historyJson
 * @param {string} contextJson
 */
function proposalBuildingAnswer(question, historyJson, contextJson) {
  return AviatorsCode_runRpc_('proposalBuildingAnswer', function () {
    var r = ProposalBuilding_answerWithContext(question, historyJson, contextJson);
    var tracked = MetricsService_trackQuestionEvent({
      mode: 'globant_agent',
      agentId: 'proposals',
      agentName: r.agentName || 'proposals',
      questionText: question,
      isUnanswered: !!r.isUnanswered,
      unansweredCode: r.unansweredCode || '',
    });
    return {
      answer: r.answer,
      agentName: r.agentName || '',
      eventId: (tracked && tracked.eventId) || '',
      meta: r.meta || {},
    };
  });
}

/**
 * Resuelve deck base según industria (airlines / logistics).
 * @param {string} industryKey
 */
function proposalBuildingResolveDeck(industryKey, briefJson) {
  return AviatorsCode_runRpc_('proposalBuildingResolveDeck', function () {
    return ProposalBuilding_resolveDeck(industryKey, briefJson);
  });
}

/**
 * Redacta «Nuestro entendimiento» con IA a partir del brief validado.
 * @param {string} briefJson
 * @param {string=} industryKey
 */
function proposalBuildingComposeUnderstanding(briefJson, industryKey) {
  return AviatorsCode_runRpc_('proposalBuildingComposeUnderstanding', function () {
    return ProposalBuilding_composeUnderstanding(briefJson, industryKey);
  });
}

/**
 * Copia la plantilla de deck a Propuestas/ sin personalizar slides.
 * @param {string} industryKey
 * @param {string} briefJson
 */
function proposalBuildingCopyProposalDeck(industryKey, briefJson) {
  return AviatorsCode_runRpc_('proposalBuildingCopyProposalDeck', function () {
    return ProposalBuilding_copyProposalDeck(industryKey, briefJson);
  });
}

/**
 * Explica con IA por qué cada caso de éxito encaja con el brief validado.
 * @param {string} briefJson
 * @param {string=} industryKey
 */
function proposalBuildingComposeSuccessCaseRationales(briefJson, industryKey) {
  return AviatorsCode_runRpc_('proposalBuildingComposeSuccessCaseRationales', function () {
    return ProposalBuilding_composeSuccessCaseRationales(briefJson, industryKey);
  });
}

/**
 * Personaliza slides (entendimiento, casos de éxito) en una copia ya creada.
 * @param {string} presentationId
 * @param {string} industryKey
 * @param {string} briefJson
 * @param {string} understandingJson
 * @param {string=} successCasesJson
 */
function proposalBuildingCustomizeProposalDeck(
  presentationId,
  industryKey,
  briefJson,
  understandingJson,
  successCasesJson,
  deckOptionsJson,
) {
  return AviatorsCode_runRpc_('proposalBuildingCustomizeProposalDeck', function () {
    return ProposalBuilding_customizeProposalDeck(
      presentationId,
      industryKey,
      briefJson,
      understandingJson,
      successCasesJson,
      deckOptionsJson,
    );
  });
}

function runSalesforceDailySync() {
  SalesforceAccounts_dailySyncJob_();
}
