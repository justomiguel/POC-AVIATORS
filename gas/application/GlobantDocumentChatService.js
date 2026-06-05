/**
 * @fileoverview Análisis de documentos vía Globant Files + Chat Assistant permanente.
 * Flujo: asegurar assistant → POST /v1/files (folder=assistant) → POST /v1/assistant/chat
 * → DELETE /v1/files/{id}. Usado por extracción de contenidos, chat efímero y armado de propuestas.
 */

/** Nombre estable del Chat Assistant para archivos temporales (POST /v1/assistant si no existe). */
var GLOBANT_DOCUMENT_FILES_ASSISTANT_DEFAULT = 'aviators-document-files';

/**
 * Mismo tope que subida local de contenidos (UrlFetch POST ~50 MB).
 * @type {number}
 */
var GLOBANT_DOCUMENT_CHAT_MAX_BYTES =
  typeof CONTENT_UPLOAD_LOCAL_MAX_BYTES !== 'undefined'
    ? CONTENT_UPLOAD_LOCAL_MAX_BYTES
    : 50 * 1024 * 1024;

/** Espera tras upload antes del chat assistant (ms). */
var GLOBANT_DOCUMENT_CHAT_UPLOAD_WAIT_MS = 1500;

/**
 * @return {number}
 */
function GlobantDocumentChat_maxBytes_() {
  return GLOBANT_DOCUMENT_CHAT_MAX_BYTES;
}

/**
 * Nombre configurado o por defecto del assistant de archivos (sin crear en Globant).
 * @return {string}
 */
function GlobantDocumentChat_getAssistantName_() {
  var p = PropertiesService.getScriptProperties();
  var dedicated = (p.getProperty(LLM_PROP.GLOBANT_FILES_ASSISTANT_NAME) || '').trim();
  return dedicated || GLOBANT_DOCUMENT_FILES_ASSISTANT_DEFAULT;
}

/**
 * Crea en Globant (si falta) el Chat Assistant permanente y persiste GLOBANT_FILES_ASSISTANT_NAME.
 * @param {ReturnType<GlobantAssistantApiClient_create>} client
 * @return {string} assistantName usado como carpeta en /v1/files y en /v1/assistant/chat
 */
function GlobantDocumentChat_ensurePermanentAssistant_(client) {
  var p = PropertiesService.getScriptProperties();
  var name = GlobantDocumentChat_getAssistantName_();
  var existing = client.getAssistant(name);
  if (existing) {
    var resolved =
      String(existing.assistantName || existing.name || name).trim() || name;
    if (!p.getProperty(LLM_PROP.GLOBANT_FILES_ASSISTANT_NAME)) {
      p.setProperty(LLM_PROP.GLOBANT_FILES_ASSISTANT_NAME, resolved);
    }
    return resolved;
  }
  var parts = GlobantAssistant_parseProviderModel_(GlobantAssistant_resolveChatModel_());
  var created = client.createChatAssistant({
    name: name,
    description: UiStrings_t(
      UiStrings_activeLocale_(),
      'globant_files_assistant_description',
    ),
    prompt: UiStrings_t(UiStrings_activeLocale_(), 'globant_files_assistant_prompt'),
    providerName: parts.providerName,
    modelName: parts.modelName,
  });
  var assistantName =
    String(created.assistantName || created.name || name).trim() || name;
  p.setProperty(LLM_PROP.GLOBANT_FILES_ASSISTANT_NAME, assistantName);
  return assistantName;
}

/**
 * @deprecated Usar GlobantDocumentChat_getAssistantName_ o ensurePermanentAssistant_.
 * @param {ReturnType<GlobantAssistantApiClient_create>=} client
 * @return {string}
 */
function GlobantDocumentChat_resolveAssistantFolder_(client) {
  if (client) {
    return GlobantDocumentChat_ensurePermanentAssistant_(client);
  }
  return GlobantDocumentChat_getAssistantName_();
}

/**
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {string} assistantName
 * @return {string}
 */
function GlobantDocumentChat_buildPrompt_(systemPrompt, userPrompt, assistantName) {
  var sys = String(systemPrompt || '').trim();
  var usr = String(userPrompt || '').trim();
  var folder = String(assistantName || '').trim();
  var docNote = [
    '[DOCUMENTO ADJUNTO]',
    'El archivo subido está disponible en tu carpeta de archivos',
    folder ? '(carpeta "' + folder + '")' : '',
    'para este turno. Analizalo antes de responder.',
    '[/DOCUMENTO ADJUNTO]',
  ]
    .filter(function (line) {
      return !!line;
    })
    .join('\n');

  if (!sys) {
    return usr ? usr + '\n\n' + docNote : docNote;
  }
  return [
    '[SYSTEM INSTRUCTIONS]',
    sys,
    '[/SYSTEM INSTRUCTIONS]',
    '',
    usr,
    '',
    docNote,
  ].join('\n');
}

/**
 * @param {ReturnType<GlobantAssistantApiClient_create>} client
 * @param {GoogleAppsScript.Base.Blob} blob
 * @return {{mode:string, client:Object, fileId:string, folder:string}}
 */
function GlobantDocumentChat_beginSession_(client, blob) {
  if (!blob || !blob.getBytes().length) {
    throw new Error(
      UiStrings_t(UiStrings_activeLocale_(), 'err_globant_assistant_empty_file'),
    );
  }
  if (blob.getBytes().length > GLOBANT_DOCUMENT_CHAT_MAX_BYTES) {
    throw new Error(
      UiStrings_fmt_('err_globant_document_too_large', {
        name: String(blob.getName() || 'document'),
        max_mb: String(Math.floor(GLOBANT_DOCUMENT_CHAT_MAX_BYTES / (1024 * 1024))),
      }),
    );
  }
  var folder = GlobantDocumentChat_ensurePermanentAssistant_(client);
  var up = client.uploadFile(blob, folder);
  var fileId = String(up.fileId || '').trim();
  if (!fileId) {
    throw new Error(
      UiStrings_t(UiStrings_activeLocale_(), 'err_globant_document_upload_no_id'),
    );
  }
  Utilities.sleep(GLOBANT_DOCUMENT_CHAT_UPLOAD_WAIT_MS);
  return { mode: 'assistant', client: client, fileId: fileId, folder: folder };
}

/**
 * @param {{mode:string, folder:string, client:Object}} session
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @return {{text:string, parsed:Object}}
 */
function GlobantDocumentChat_sessionChat_(session, systemPrompt, userPrompt) {
  var prompt = GlobantDocumentChat_buildPrompt_(systemPrompt, userPrompt, session.folder);
  var props = PropertiesService.getScriptProperties();
  var maxRetries = LlmProviderGlobant_readExecuteMaxRetries(props);
  try {
    return GlobantAssistantApiClient_sendChatWithRetry(
      session.client,
      session.folder,
      prompt,
      maxRetries,
    );
  } catch (eChat) {
    var raw = String(eChat && eChat.message ? eChat.message : eChat);
    if (raw.indexOf('Assistant Not Found') >= 0) {
      throw new Error(
        UiStrings_fmt_('err_globant_assistant_not_found', {
          assistant: session.folder,
        }),
      );
    }
    throw eChat;
  }
}

/**
 * Borra el archivo temporal en Globant Files API (el assistant permanece).
 * Doc: DELETE /v1/files/{fileId}?organization=…&project=…
 * @param {Object|null|undefined} session
 */
function GlobantDocumentChat_endSession_(session) {
  if (!session || !session.fileId || !session.client) return;
  try {
    session.client.deleteFile(session.fileId);
  } catch (eDel) {
    console.log(
      '[GlobantDocumentChat] delete temp file failed: ' +
        session.fileId +
        ' — ' +
        String(eDel.message || eDel).slice(0, 120),
    );
  }
}

/**
 * Sube un archivo, consulta al assistant permanente y borra el archivo temporal.
 * @param {ReturnType<GlobantAssistantApiClient_create>} client
 * @param {GoogleAppsScript.Base.Blob} blob
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @return {{text:string, parsed:Object}}
 */
function GlobantDocumentChat_chatWithBlob_(client, blob, systemPrompt, userPrompt) {
  var session = GlobantDocumentChat_beginSession_(client, blob);
  try {
    return GlobantDocumentChat_sessionChat_(session, systemPrompt, userPrompt);
  } finally {
    GlobantDocumentChat_endSession_(session);
  }
}
