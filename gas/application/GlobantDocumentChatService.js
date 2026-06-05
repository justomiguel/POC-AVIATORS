/**
 * @fileoverview Análisis de documentos vía Globant Files API + Assistant Chat.
 * Flujo: POST /v1/files (multipart) → breve espera → POST /v1/assistant/chat → DELETE /v1/files/{id}.
 * Usado por extracción de contenidos, chat efímero y armado de propuestas.
 */

/** Asistente/carpeta por defecto si no hay Script Property (debe existir en Globant). */
var GLOBANT_DOCUMENT_CHAT_DEFAULT_ASSISTANT = 'aviators-document-analysis';

/**
 * Mismo tope que subida local de contenidos (UrlFetch POST ~50 MB).
 * @type {number}
 */
var GLOBANT_DOCUMENT_CHAT_MAX_BYTES =
  typeof CONTENT_UPLOAD_LOCAL_MAX_BYTES !== 'undefined'
    ? CONTENT_UPLOAD_LOCAL_MAX_BYTES
    : 50 * 1024 * 1024;

/** Espera tras upload antes del chat (ms). Alineado a LlmProviderGlobant_consultAssistantWithDriveApi. */
var GLOBANT_DOCUMENT_CHAT_UPLOAD_WAIT_MS = 1500;

/**
 * @return {number}
 */
function GlobantDocumentChat_maxBytes_() {
  return GLOBANT_DOCUMENT_CHAT_MAX_BYTES;
}

/**
 * Carpeta/asistente Globant para archivos temporales de análisis.
 * Prioridad: GLOBANT_FILES_ASSISTANT_NAME → GLOBANT_RAG_PROFILE_NAME → defecto.
 * @return {string}
 */
function GlobantDocumentChat_resolveAssistantFolder_() {
  var p = PropertiesService.getScriptProperties();
  var dedicated = (p.getProperty(LLM_PROP.GLOBANT_FILES_ASSISTANT_NAME) || '').trim();
  if (dedicated) return dedicated;
  var profile = (p.getProperty(LLM_PROP.GLOBANT_PROFILE) || '').trim();
  if (profile) return profile;
  return GLOBANT_DOCUMENT_CHAT_DEFAULT_ASSISTANT;
}

/**
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {string} assistantFolder
 * @return {string}
 */
function GlobantDocumentChat_buildPrompt_(systemPrompt, userPrompt, assistantFolder) {
  var sys = String(systemPrompt || '').trim();
  var usr = String(userPrompt || '').trim();
  var folder = String(assistantFolder || '').trim();
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
 * @return {{client:Object, fileId:string, folder:string}}
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
  var folder = GlobantDocumentChat_resolveAssistantFolder_();
  var up = client.uploadFile(blob, folder);
  var fileId = String(up.fileId || '').trim();
  if (!fileId) {
    throw new Error(
      UiStrings_t(UiStrings_activeLocale_(), 'err_globant_document_upload_no_id'),
    );
  }
  Utilities.sleep(GLOBANT_DOCUMENT_CHAT_UPLOAD_WAIT_MS);
  return { client: client, fileId: fileId, folder: folder };
}

/**
 * @param {{client:Object, fileId:string, folder:string}} session
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @return {{text:string, parsed:Object}}
 */
function GlobantDocumentChat_sessionChat_(session, systemPrompt, userPrompt) {
  var prompt = GlobantDocumentChat_buildPrompt_(systemPrompt, userPrompt, session.folder);
  var props = PropertiesService.getScriptProperties();
  var maxRetries = LlmProviderGlobant_readExecuteMaxRetries(props);
  return GlobantAssistantApiClient_sendChatWithRetry(
    session.client,
    session.folder,
    prompt,
    maxRetries,
  );
}

/**
 * @param {{client:Object, fileId:string, folder:string}|null|undefined} session
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
 * Sube un archivo, consulta al asistente y borra el archivo temporal.
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
