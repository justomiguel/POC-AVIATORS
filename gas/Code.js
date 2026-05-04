/**
 * Web app — Aviators: Drive + consultas IA (Globant RAG, Globant Assistant o Gemini API).
 * Despliegue: «Ejecutar como: usuario que accede».
 */
function doGet() {
  return HtmlService.createTemplateFromFile('index')
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
  };
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
      'Sin email de usuario: ejecutá la web como «usuario que accede» y autorizá de nuevo.',
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
  var user = Session.getActiveUser();
  var email = user.getEmail();
  var files = [];

  if (!email) {
    return {
      email: '',
      files: [],
      note:
        'Sin email: usá «Ejecutar como: usuario que accede» y volvé a autorizar.',
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

  return {
    email: email,
    files: files,
    note:
      files.length === 0
        ? 'No encontramos Docs ni archivos .txt/.md recientes en tu unidad. Creá uno o revisá los permisos de Drive.'
        : '',
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
      'La prueba directa Globant solo aplica cuando el proveedor activo es Globant (GLOBANT_AGENTS_API_KEY u opcional LLM_PROVIDER=globant).',
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
    throw new Error('Solo disponible con proveedor Globant.');
  }
  var p = PropertiesService.getScriptProperties();
  if (!LlmProviderGlobant_isAssistantMode(p)) {
    throw new Error(
      'globantAssistantDeleteFile solo aplica con GLOBANT_API_MODE=assistant.',
    );
  }
  var fid = (fileId || '').trim();
  if (!fid) throw new Error('Indicá fileId del documento en Globant.');
  var apiKey = (p.getProperty(LLM_PROP.GLOBANT_API_KEY) || '').trim();
  var baseUrl = (p.getProperty(LLM_PROP.GLOBANT_BASE_URL) || '').trim();
  var client = GlobantAssistantApiClient_create({
    apiKey: apiKey,
    baseUrl: baseUrl || undefined,
  });
  client.deleteFile(fid);
  return { success: true };
}
