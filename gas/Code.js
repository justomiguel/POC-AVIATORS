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
  tpl.clientScript = HtmlService.createHtmlOutputFromFile('app-client').getContent();
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
  var files = [];

  if (!email) {
    return {
      email: '',
      files: [],
      note: UiStrings_t(locale, 'note_no_email'),
      showNoRoleBanner: false,
    };
  }

  var q =
    '(' +
    "mimeType = '" +
    MimeType.GOOGLE_DOCUMENT +
    "' or mimeType = 'text/plain' or mimeType = 'text/markdown'" +
    ') and trashed = false';

  var it = DriveApp.searchFiles(q);
  var seen = {};

  while (it.hasNext() && files.length < 24) {
    var f = it.next();
    var mime = f.getMimeType();
    var id = f.getId();
    if (seen[id]) continue;
    seen[id] = true;

    files.push({
      id: id,
      name: f.getName(),
      url: f.getUrl(),
      mimeType: mime,
    });
  }

  var note =
    files.length === 0 ? UiStrings_t(locale, 'note_no_docs') : '';

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
    /* La UI muestra error pero la ejecución sigue siendo «Completada»: el catch evita re-lanzar. */
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
    files: files,
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
 * Entrada HTML: delega en el orquestador (proveedor según Propiedades del script).
 * @param {string} question
 * @param {string[]} fileIds
 */
function askAboutDocuments(question, fileIds) {
  var ans = LlmOrchestrator_consultWithDriveDocuments(question, fileIds);
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
 * Prompt directo contra Globant según GLOBANT_API_MODE: RAG `/v1/search/execute` o Assistant `/v1/assistant/chat`.
 * @param {string} prompt
 */
function globantAskDirect(prompt) {
  if (LlmOrchestrator_resolveProviderKind() !== 'globant') {
    throw new Error(
      UiStrings_t(UiStrings_activeLocale_(), 'err_globant_direct'),
    );
  }
  var r = LlmProviderGlobant_consultPromptOnly(prompt);
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
