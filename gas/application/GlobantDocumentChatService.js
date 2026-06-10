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

/** Espera mínima tras upload antes del chat assistant (ms). */
var GLOBANT_DOCUMENT_CHAT_UPLOAD_WAIT_MS = 2500;

/** Tiempo máximo de polling post-upload hasta que el archivo aparezca indexado (ms). */
var GLOBANT_DOCUMENT_CHAT_FILE_READY_MAX_MS = 20000;

/** Intervalo entre polls de GET /v1/files/all (ms). */
var GLOBANT_DOCUMENT_CHAT_FILE_READY_STEP_MS = 1500;

/** Tope práctico de PDF/binario inline en /v1/chat/completions (Gemini ~20 MB). */
var GLOBANT_CHAT_INLINE_FILE_MAX_BYTES = 20 * 1024 * 1024;

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
 * @param {GoogleAppsScript.Properties.Properties} props
 * @param {ReturnType<GlobantAssistantApiClient_create>} client
 * @param {Object|null|undefined} assistantObj
 * @param {string} fallbackName
 * @return {string}
 */
function GlobantDocumentChat_persistAssistantName_(props, client, assistantObj, fallbackName) {
  var defaultName = GlobantDocumentChat_getAssistantName_();
  var resolved =
    String(
      (assistantObj && (assistantObj.assistantName || assistantObj.name)) ||
        fallbackName ||
        '',
    ).trim() || defaultName;
  props.setProperty(LLM_PROP.GLOBANT_FILES_ASSISTANT_NAME, resolved);
  return resolved;
}

/**
 * Crea en Globant (si falta) el Chat Assistant permanente y persiste GLOBANT_FILES_ASSISTANT_NAME.
 * Sin candado: createChatAssistant resuelve conflicto de nombre; la propiedad es cache idempotente.
 * @param {ReturnType<GlobantAssistantApiClient_create>} client
 * @return {string} assistantName usado como carpeta en /v1/files y en /v1/assistant/chat
 */
function GlobantDocumentChat_ensurePermanentAssistant_(client) {
  var props = PropertiesService.getScriptProperties();
  var stored = (props.getProperty(LLM_PROP.GLOBANT_FILES_ASSISTANT_NAME) || '').trim();
  if (stored) {
    return stored;
  }

  var name = GlobantDocumentChat_getAssistantName_();
  var existing = client.getAssistant(name);
  if (existing) {
    return GlobantDocumentChat_persistAssistantName_(props, client, existing, name);
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
  return GlobantDocumentChat_persistAssistantName_(props, client, created, name);
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
 * Nombre único y ASCII-safe para upload (header filename) y referencia {file:stem}.
 * @param {GoogleAppsScript.Base.Blob} blob
 * @return {string}
 */
function GlobantDocumentChat_uniqueUploadName_(blob) {
  var raw = String(blob.getName() || 'document').trim() || 'document';
  var extMatch = raw.match(/(\.[^.]+)$/);
  var ext = extMatch ? extMatch[1] : '';
  var stem = DriveDocuments_safeFileStem_(raw.replace(/\.[^.]+$/, '') || 'document');
  var mime = String(blob.getContentType() || '').trim().toLowerCase();
  if (!ext && (mime === 'application/pdf' || mime === MimeType.PDF)) ext = '.pdf';
  if (!ext && /\.docx$/i.test(raw)) {
    ext = '.docx';
  }
  var suffix = Utilities.getUuid().replace(/-/g, '').slice(0, 8);
  return stem + '-' + suffix + ext;
}

/**
 * Borra archivos huérfanos del proyecto Globant antes de subir (un solo PDF por turno).
 * @param {ReturnType<GlobantAssistantApiClient_create>} client
 */
function GlobantDocumentChat_purgeProjectFiles_(client) {
  try {
    var files = client.listAllFiles();
    for (var i = 0; i < files.length; i++) {
      var fid = String(files[i].id || '').trim();
      if (!fid) continue;
      try {
        client.deleteFile(fid);
      } catch (eDel) {
        console.log(
          '[GlobantDocumentChat] purge delete failed ' +
            fid +
            ': ' +
            String(eDel && eDel.message ? eDel.message : eDel).slice(0, 80),
        );
      }
    }
  } catch (eList) {
    console.log(
      '[GlobantDocumentChat] purge list failed: ' +
        String(eList && eList.message ? eList.message : eList).slice(0, 100),
    );
  }
}

/**
 * @param {number[]} bytes
 * @param {string} mime
 * @param {string} name
 */
function GlobantDocumentChat_assertValidUploadBytes_(bytes, mime, name) {
  if (!bytes || !bytes.length) {
    throw new Error(
      UiStrings_t(UiStrings_activeLocale_(), 'err_globant_assistant_empty_file'),
    );
  }
  var m = String(mime || '').trim().toLowerCase();
  var n = String(name || '').trim();
  if (m !== 'application/pdf' && m !== MimeType.PDF && !/\.pdf$/i.test(n)) return;
  var head = '';
  for (var i = 0; i < Math.min(5, bytes.length); i++) {
    head += String.fromCharCode(bytes[i]);
  }
  if (head.indexOf('%PDF') !== 0) {
    throw new Error(
      UiStrings_t(UiStrings_activeLocale_(), 'err_globant_document_invalid_pdf'),
    );
  }
}

/**
 * Espera a que el archivo subido figure en /v1/files/all con tamaño > 0 (Vertex lo procesa async).
 * @param {ReturnType<GlobantAssistantApiClient_create>} client
 * @param {string} fileId
 */
function GlobantDocumentChat_waitForFileReady_(client, fileId) {
  var targetId = String(fileId || '').trim();
  if (!targetId) return;
  Utilities.sleep(GLOBANT_DOCUMENT_CHAT_UPLOAD_WAIT_MS);
  var elapsed = GLOBANT_DOCUMENT_CHAT_UPLOAD_WAIT_MS;
  while (elapsed < GLOBANT_DOCUMENT_CHAT_FILE_READY_MAX_MS) {
    try {
      var files = client.listAllFiles();
      for (var i = 0; i < files.length; i++) {
        if (String(files[i].id || '') === targetId && Number(files[i].size || 0) > 0) {
          return;
        }
      }
    } catch (eList) {
      console.log(
        '[GlobantDocumentChat] listAllFiles poll failed: ' +
          String(eList && eList.message ? eList.message : eList).slice(0, 100),
      );
    }
    Utilities.sleep(GLOBANT_DOCUMENT_CHAT_FILE_READY_STEP_MS);
    elapsed += GLOBANT_DOCUMENT_CHAT_FILE_READY_STEP_MS;
  }
}

/**
 * @param {string} errMsg
 * @return {boolean}
 */
function GlobantDocumentChat_isNoPagesError_(errMsg) {
  var raw = String(errMsg || '').toLowerCase();
  return raw.indexOf('no pages') >= 0 || raw.indexOf('"code":8024') >= 0 || raw.indexOf('code":8024') >= 0;
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
  var assistantFolderClause = folder ? ' ("' + folder + '")' : '';
  var systemSection = sys
    ? PromptCatalog_render('chat.document.system_section', { systemPrompt: sys })
    : '';
  return PromptCatalog_render('chat.document.wrapper', {
    systemSection: systemSection,
    userPrompt: usr,
    assistantFolderClause: assistantFolderClause,
  });
}

/**
 * @param {ReturnType<GlobantAssistantApiClient_create>} client
 * @param {GoogleAppsScript.Base.Blob} blob
 * @return {{mode:string, client:Object, fileId:string, fileName:string, folder:string}}
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
  GlobantDocumentChat_purgeProjectFiles_(client);
  var bytes = blob.getBytes();
  var mime = String(blob.getContentType() || '').trim().toLowerCase();
  if (!mime && /\.pdf$/i.test(String(blob.getName() || ''))) mime = 'application/pdf';
  var uploadName = GlobantDocumentChat_uniqueUploadName_(blob);
  GlobantDocumentChat_assertValidUploadBytes_(bytes, mime, uploadName);
  var uploadBlob = Utilities.newBlob(bytes, mime || 'application/pdf', uploadName);
  var up = client.uploadFile(uploadBlob, folder);
  var fileId = String(up.fileId || '').trim();
  if (!fileId) {
    throw new Error(
      UiStrings_t(UiStrings_activeLocale_(), 'err_globant_document_upload_no_id'),
    );
  }
  GlobantDocumentChat_waitForFileReady_(client, fileId);
  return {
    mode: 'assistant',
    client: client,
    fileId: fileId,
    fileName: uploadName,
    folder: folder,
  };
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
  var noPagesRetries = 2;
  var attempt = 0;
  /** @type {Error|null} */
  var lastErr = null;
  while (attempt <= maxRetries) {
    try {
      return GlobantAssistantApiClient_sendChatWithRetry(
        session.client,
        session.folder,
        prompt,
        0,
      );
    } catch (eChat) {
      lastErr = eChat;
      var raw = String(eChat && eChat.message ? eChat.message : eChat);
      if (raw.indexOf('Assistant Not Found') >= 0) {
        throw new Error(
          UiStrings_fmt_('err_globant_assistant_not_found', {
            assistant: session.folder,
          }),
        );
      }
      if (GlobantDocumentChat_isNoPagesError_(raw) && noPagesRetries > 0) {
        noPagesRetries--;
        Utilities.sleep(GLOBANT_DOCUMENT_CHAT_FILE_READY_STEP_MS * 2);
        attempt++;
        continue;
      }
      if (attempt >= maxRetries) break;
      Utilities.sleep(500);
      attempt++;
    }
  }
  throw (
    lastErr ||
    new Error(
      UiStrings_t(UiStrings_activeLocale_(), 'err_globant_chat_retry_unknown'),
    )
  );
}

/**
 * Fallback: PDF/binario inline vía /v1/chat/completions (sin Files API).
 * @param {ReturnType<GlobantAssistantApiClient_create>} client
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {number[]} bytes
 * @param {string} mime
 * @param {string} fileName
 * @return {{text:string, parsed:Object}}
 */
function GlobantDocumentChat_chatViaCompletionsInline_(
  client,
  systemPrompt,
  userPrompt,
  bytes,
  mime,
  fileName,
) {
  var m = String(mime || 'application/pdf').trim().toLowerCase() || 'application/pdf';
  var name = String(fileName || 'document.pdf').trim() || 'document.pdf';
  var model = GlobantAssistant_resolveChatModel_();
  var b64 = Utilities.base64Encode(bytes);
  console.log(
    '[GlobantDocumentChat] completions inline fallback · ' +
      name +
      ' · ' +
      bytes.length +
      ' bytes',
  );
  return client.chatWithFileInline(model, systemPrompt, userPrompt, b64, m, name);
}

/**
 * Borra el archivo temporal en Globant Files API (el assistant permanece).
 * Doc: DELETE /v1/files/{fileId}?organization=…&project=…
 * @param {Object|null|undefined} session
 */
function GlobantDocumentChat_endSession_(session) {
  if (!session || !session.fileId || !session.client) return;
  var attempts = 0;
  while (attempts < 2) {
    try {
      session.client.deleteFile(session.fileId);
      return;
    } catch (eDel) {
      attempts++;
      if (attempts >= 2) {
        console.log(
          '[GlobantDocumentChat] delete temp file failed: ' +
            session.fileId +
            ' — ' +
            String(eDel.message || eDel).slice(0, 120),
        );
        return;
      }
      Utilities.sleep(400);
    }
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
  var bytes = blob.getBytes();
  var mime = String(blob.getContentType() || '').trim().toLowerCase();
  if (!mime && /\.pdf$/i.test(String(blob.getName() || ''))) mime = 'application/pdf';
  var name = String(blob.getName() || 'document.pdf').trim() || 'document.pdf';
  GlobantDocumentChat_assertValidUploadBytes_(bytes, mime, name);

  if (
    (mime === 'application/pdf' || mime === MimeType.PDF) &&
    bytes.length <= GLOBANT_CHAT_INLINE_FILE_MAX_BYTES
  ) {
    try {
      return GlobantDocumentChat_chatViaCompletionsInline_(
        client,
        systemPrompt,
        userPrompt,
        bytes,
        mime,
        name,
      );
    } catch (eInlinePrimary) {
      console.log(
        '[GlobantDocumentChat] inline primary failed, trying /v1/files: ' +
          String(eInlinePrimary && eInlinePrimary.message ? eInlinePrimary.message : eInlinePrimary).slice(
            0,
            180,
          ),
      );
    }
  }

  /** @type {Object|null} */
  var session = null;
  try {
    session = GlobantDocumentChat_beginSession_(client, blob);
    return GlobantDocumentChat_sessionChat_(session, systemPrompt, userPrompt);
  } catch (ePrimary) {
    var raw = String(ePrimary && ePrimary.message ? ePrimary.message : ePrimary);
    if (
      GlobantDocumentChat_isNoPagesError_(raw) &&
      bytes.length > 0 &&
      bytes.length <= GLOBANT_CHAT_INLINE_FILE_MAX_BYTES
    ) {
      try {
        return GlobantDocumentChat_chatViaCompletionsInline_(
          client,
          systemPrompt,
          userPrompt,
          bytes,
          mime,
          name,
        );
      } catch (eInline) {
        console.log(
          '[GlobantDocumentChat] inline fallback failed: ' +
            String(eInline && eInline.message ? eInline.message : eInline).slice(0, 200),
        );
      }
    }
    if (GlobantDocumentChat_isNoPagesError_(raw)) {
      throw new Error(
        UiStrings_t(UiStrings_activeLocale_(), 'err_globant_document_no_pages'),
      );
    }
    throw ePrimary;
  } finally {
    GlobantDocumentChat_endSession_(session);
  }
}
