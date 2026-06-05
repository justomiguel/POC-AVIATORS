/**
 * @fileoverview Cliente REST para Assistants Globant (/v1/assistant/chat, /v1/files).
 * Equivalente al flujo legacy `AssistantProvider` (no confundir con /v1/search RAG).
 */

/** Ruta Chat API (Direct LLM / OpenAI-compatible). Doc: docs.globant.ai → Chat API. */
var GLOBANT_CHAT_COMPLETIONS_PATH = '/v1/chat/completions';

/**
 * Modelo para POST /v1/chat/completions (roster, catálogo). Script Property GLOBANT_CHAT_MODEL o LLM_DEFAULTS.
 * Remapea alias obsoletos (gemini-2.0-flash) a versiones disponibles en Vertex vía Globant.
 *
 * @return {string}
 */
function GlobantAssistant_resolveChatModel_() {
  var p = PropertiesService.getScriptProperties();
  var raw = (p.getProperty(LLM_PROP.GLOBANT_CHAT_MODEL) || '').trim();
  if (!raw) {
    raw = (p.getProperty(LLM_PROP.GEMINI_MODEL) || '').trim();
  }
  var aliases = {
    'gemini-2.0-flash': LLM_DEFAULTS.GLOBANT_CHAT_MODEL,
    'gemini-2.0-flash-exp': LLM_DEFAULTS.GLOBANT_CHAT_MODEL,
    'vertex_ai/gemini-2.0-flash': LLM_DEFAULTS.GLOBANT_CHAT_MODEL,
    'vertex_ai/gemini-2.0-flash-exp': LLM_DEFAULTS.GLOBANT_CHAT_MODEL,
  };
  if (raw && aliases[raw]) return aliases[raw];
  if (raw && raw.indexOf('/') < 0) {
    return 'vertex_ai/' + raw;
  }
  return raw || LLM_DEFAULTS.GLOBANT_CHAT_MODEL;
}

/**
 * @param {string=} modelSlug ej. vertex_ai/gemini-2.5-flash
 * @return {{providerName:string, modelName:string}}
 */
function GlobantAssistant_parseProviderModel_(modelSlug) {
  var m = String(modelSlug || GlobantAssistant_resolveChatModel_()).trim();
  var slash = m.indexOf('/');
  if (slash > 0) {
    return {
      providerName: m.slice(0, slash),
      modelName: m.slice(slash + 1),
    };
  }
  return { providerName: 'vertex_ai', modelName: m || 'gemini-2.5-flash' };
}

/**
 * @typedef {Object} GlobantAssistantApiClientConfig
 * @property {string} apiKey
 * @property {string} [baseUrl]
 */

/**
 * @param {{ organizationId: string, projectId: string }} ids
 */
function GlobantAssistantApiClient_cachePutAccessIds(ids) {
  var cache = CacheService.getScriptCache();
  var bundle = JSON.stringify(ids);
  cache.put('_globant_ac_ids', bundle, 1200); // 20 min
}

/** @return {{ organizationId: string, projectId: string }}|null */
function GlobantAssistantApiClient_cacheGetAccessIds() {
  var raw = CacheService.getScriptCache().get('_globant_ac_ids');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function GlobantAssistantApiClient_invalidateAccessCache() {
  CacheService.getScriptCache().remove('_globant_ac_ids');
}

/**
 * @param {GlobantAssistantApiClientConfig} config
 */
function GlobantAssistantApiClient_create(config) {
  var apiKey = config.apiKey;
  var baseUrl = GlobantUrl_normalizeBaseUrl_(config.baseUrl);

  /** @type {{ organizationId: string, projectId: string }|null} */
  var memAccessIds = GlobantAssistantApiClient_cacheGetAccessIds();

  function authHeaders(extra) {
    return Object.assign(
      { Authorization: 'Bearer ' + apiKey },
      extra || {},
    );
  }

  function fetchAccessIds() {
    var r = BearerHttp_fetch(
      baseUrl + '/v1/accessControl/apitoken/validate',
      {
        method: 'get',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
      },
    );
    var code = r.getResponseCode();
    var text = r.getContentText() || '';
    if (!BearerHttp_isSuccess(code)) {
      throw new Error(
        'Globant validate token ' + code + ': ' + text.substring(0, 500),
      );
    }
    var data = JSON.parse(text);
    if (!data.organizationId || !data.projectId) {
      throw new Error(
        'Globant validate: sin organizationId/projectId: ' + text.slice(0, 400),
      );
    }
    return {
      organizationId: String(data.organizationId),
      projectId: String(data.projectId),
    };
  }

  /** @return {{ organizationId: string, projectId: string }} */
  function getOrganizationAndProjectIds() {
    if (memAccessIds) return memAccessIds;
    memAccessIds = fetchAccessIds();
    GlobantAssistantApiClient_cachePutAccessIds(memAccessIds);
    return memAccessIds;
  }

  /**
   * @return {Array<{id:string,name:string,extension:string,size:number,url:string}>}
   */
  function normalizeDataFilesPayload_(parsed) {
    var out = [];
    var blob = parsed && parsed.dataFiles;
    function pushOne(raw) {
      if (!raw || typeof raw !== 'object') return;
      var o = /** @type {Object.<string,string|number>} */ (raw);
      var id =
        '' +
        ((o.DataFileId != null ? o.DataFileId : o.dataFileId) || '').toString().trim();
      if (!id) return;
      out.push({
        id: id,
        name: String(o.DataFileName != null ? o.DataFileName : o.dataFileName || ''),
        extension: String(
          o.DataFileExtension != null
            ? o.DataFileExtension
            : o.dataFileExtension || '',
        ),
        size: Number(o.DataFileSize != null ? o.DataFileSize : o.dataFileSize || 0),
        url: String(o.DataFileUrl != null ? o.DataFileUrl : o.dataFileUrl || ''),
      });
    }
    if (Array.isArray(blob)) {
      for (var i = 0; i < blob.length; i++) pushOne(blob[i]);
      return out;
    }
    if (blob && typeof blob === 'object') {
      pushOne(blob);
      return out;
    }
    return out;
  }

  /**
   * GET /v1/files/all para org/proyecto de la token.
   */
  function listAllFiles() {
    var ids = getOrganizationAndProjectIds();
    var qs =
      '?organization=' +
      encodeURIComponent(ids.organizationId) +
      '&project=' +
      encodeURIComponent(ids.projectId);
    var r = BearerHttp_fetch(baseUrl + '/v1/files/all' + qs, {
      method: 'get',
      headers: authHeaders({ Accept: 'application/json' }),
      muteHttpExceptions: true,
      followRedirects: true,
      validateHttpsCertificates: true,
    });
    var code = r.getResponseCode();
    var text = r.getContentText() || '';
    if (!BearerHttp_isSuccess(code)) {
      throw new Error(
        UiStrings_fmt_('err_globant_api_http', {
          path: '/v1/files/all',
          code: String(code),
          detail: text.slice(0, 600),
        }),
      );
    }
    var parsed = JSON.parse(text);
    return normalizeDataFilesPayload_(parsed);
  }

  /**
   * @param {Blob} blob
   * @param {string} folderAssistantName — mismo uso que legacy `folder: this.profileName`
   */
  function uploadFile(blob, folderAssistantName) {
    var ids = getOrganizationAndProjectIds();
    if (!blob || !blob.getBytes().length) {
      throw new Error(
        UiStrings_t(
          UiStrings_activeLocale_(),
          'err_globant_assistant_empty_file',
        ),
      );
    }
    var fileName = blob.getName() || 'document.pdf';

    /** @type {GoogleAppsScript.URL_Fetch.URLFetchRequestOptions} */
    var opt = {
      method: 'post',
      headers: Object.assign(authHeaders({}), {
        organizationId: ids.organizationId,
        projectId: ids.projectId,
        filename: fileName,
        folder: folderAssistantName || '',
      }),
      payload: { file: blob },
      muteHttpExceptions: true,
      followRedirects: true,
      validateHttpsCertificates: true,
    };

    var r = UrlFetchApp.fetch(baseUrl + '/v1/files', opt);
    var code = r.getResponseCode();
    var text = r.getContentText() || '';
    if (!BearerHttp_isSuccess(code)) {
      throw new Error(
        UiStrings_fmt_('err_globant_api_http', {
          path: '/v1/files',
          code: String(code),
          detail: text.slice(0, 800),
        }),
      );
    }
    var parsed = JSON.parse(text);
    var fid =
      parsed.dataFileId ||
      parsed.fileId ||
      parsed.id ||
      (parsed.data && parsed.data.id) ||
      '';
    return {
      parsed: parsed,
      fileId: fid ? String(fid) : '',
    };
  }

  /**
   * @param {string} fileId
   */
  function deleteFile(fileId) {
    var ids = getOrganizationAndProjectIds();
    var q =
      '?organization=' +
      encodeURIComponent(ids.organizationId) +
      '&project=' +
      encodeURIComponent(ids.projectId);
    var r = BearerHttp_fetch(
      baseUrl + '/v1/files/' + encodeURIComponent(fileId) + q,
      {
        method: 'delete',
        headers: authHeaders({ Accept: 'application/json' }),
      },
    );
    var code = r.getResponseCode();
    var text = r.getContentText() || '';
    if (!BearerHttp_isSuccess(code)) {
      throw new Error(
        UiStrings_fmt_('err_globant_api_http', {
          path: '/v1/files/{id}',
          code: String(code),
          detail: text.slice(0, 500),
        }),
      );
    }
  }

  /**
   * @param {string} idOrName assistantId o assistantName
   * @return {Object|null} null si no existe (HTTP 404)
   */
  function getAssistant(idOrName) {
    var target = String(idOrName || '').trim();
    if (!target) return null;
    var r = BearerHttp_fetch(
      baseUrl + '/v1/assistant/' + encodeURIComponent(target),
      {
        method: 'get',
        headers: authHeaders({ Accept: 'application/json' }),
      },
    );
    var code = r.getResponseCode();
    var text = r.getContentText() || '';
    if (code === 404) return null;
    if (!BearerHttp_isSuccess(code)) {
      throw new Error(
        UiStrings_fmt_('err_globant_api_http', {
          path: '/v1/assistant/{id}',
          code: String(code),
          detail: text.slice(0, 800),
        }),
      );
    }
    try {
      return JSON.parse(text);
    } catch (eParse) {
      throw new Error(
        UiStrings_fmt_('err_json_invalid_detail', {
          message: (eParse && eParse.message) || '',
        }),
      );
    }
  }

  /**
   * @param {{name:string, prompt:string, description?:string, providerName?:string, modelName?:string}} spec
   * @return {Object}
   */
  function createChatAssistant(spec) {
    var parts = GlobantAssistant_parseProviderModel_(
      spec.providerName && spec.modelName
        ? spec.providerName + '/' + spec.modelName
        : null,
    );
    var body = {
      type: 'chat',
      name: String(spec.name || '').trim(),
      description: String(spec.description || '').trim(),
      prompt: String(spec.prompt || '').trim(),
      llmSettings: {
        providerName: spec.providerName || parts.providerName,
        modelName: spec.modelName || parts.modelName,
        temperature: 0.1,
        maxTokens: 8192,
        uploadFiles: true,
      },
    };
    if (!body.name || !body.prompt) {
      throw new Error(
        UiStrings_t(UiStrings_activeLocale_(), 'err_globant_files_assistant_create'),
      );
    }
    var r = BearerHttp_fetch(baseUrl + '/v1/assistant', {
      method: 'post',
      contentType: 'application/json',
      headers: authHeaders({}),
      payload: JSON.stringify(body),
    });
    var code = r.getResponseCode();
    var text = r.getContentText() || '';
    if (!BearerHttp_isSuccess(code)) {
      throw new Error(
        UiStrings_fmt_('err_globant_api_http', {
          path: '/v1/assistant',
          code: String(code),
          detail: text.slice(0, 800),
        }),
      );
    }
    try {
      return JSON.parse(text);
    } catch (eParseCreate) {
      throw new Error(
        UiStrings_fmt_('err_json_invalid_detail', {
          message: (eParseCreate && eParseCreate.message) || '',
        }),
      );
    }
  }

  /**
   * @param {string} assistantName
   * @param {string} prompt
   */
  function sendMessageDetailed(assistantName, prompt) {
    var payload = JSON.stringify({
      assistant: assistantName,
      messages: [{ role: 'user', content: prompt }],
    });
    var r = BearerHttp_fetch(baseUrl + '/v1/assistant/chat', {
      method: 'post',
      contentType: 'application/json',
      headers: authHeaders({}),
      payload: payload,
    });
    var code = r.getResponseCode();
    var text = r.getContentText() || '';
    if (!BearerHttp_isSuccess(code)) {
      throw new Error(
        UiStrings_fmt_('err_globant_api_http', {
          path: '/v1/assistant/chat',
          code: String(code),
          detail: text.slice(0, 800),
        }),
      );
    }
    var result = JSON.parse(text);
    if (!result || !result.success) {
      throw new Error(
        UiStrings_fmt_('err_globant_api_logical', {
          path: '/v1/assistant/chat',
          detail: JSON.stringify(result).slice(0, 800),
        }),
      );
    }
    return { text: result.text || '', parsed: result };
  }

  /**
   * @deprecated Preferir GlobantDocumentChatService (/v1/files + /v1/assistant/chat).
   * Envía un mensaje con un archivo adjunto (base64 inline) al Chat API.
   * Usa modelos multimodales (Gemini) para analizar PDFs/archivos sin indexación.
   * @param {string} model e.g. "vertex_ai/gemini-2.0-flash-exp"
   * @param {string} systemPrompt
   * @param {string} userText
   * @param {string} fileBase64 base64-encoded file content
   * @param {string} mimeType e.g. "application/pdf"
   * @return {{text:string, parsed:Object}}
   */
  function chatWithFileInline(model, systemPrompt, userText, fileBase64, mimeType) {
    var messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: userText },
        { type: 'image_url', image_url: 'data:' + mimeType + ';base64,' + fileBase64 },
      ],
    });
    var payload = JSON.stringify({
      model: model,
      messages: messages,
      stream: false,
      max_tokens: 8192,
      temperature: 0.1,
    });
    var r = BearerHttp_fetch(baseUrl + GLOBANT_CHAT_COMPLETIONS_PATH, {
      method: 'post',
      contentType: 'application/json',
      headers: authHeaders({}),
      payload: payload,
    });
    var code = r.getResponseCode();
    var text = r.getContentText() || '';
    if (!BearerHttp_isSuccess(code)) {
      throw new Error(
        UiStrings_fmt_('err_globant_api_http', {
          path: GLOBANT_CHAT_COMPLETIONS_PATH + ' (inline file)',
          code: String(code),
          detail: text.slice(0, 800),
        }),
      );
    }
    var result = JSON.parse(text);
    var answer = '';
    if (result.choices && result.choices.length > 0) {
      answer = (result.choices[0].message && result.choices[0].message.content) || '';
    } else if (result.text) {
      answer = result.text;
    }
    return { text: answer, parsed: result };
  }

  /**
   * Chat completion simple sin RAG. Envía un prompt con contexto directo.
   * @param {string} systemPrompt
   * @param {string} userMessage
   * @param {string=} model — modelo a usar; por defecto GlobantAssistant_resolveChatModel_()
   * @return {{text:string, parsed:Object}}
   */
  function chatSimple(systemPrompt, userMessage, model) {
    var mdl = model || GlobantAssistant_resolveChatModel_();
    var messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: userMessage });
    var payload = JSON.stringify({
      model: mdl,
      messages: messages,
      stream: false,
      max_tokens: 8192,
      temperature: 0.2,
    });
    var r = BearerHttp_fetch(baseUrl + GLOBANT_CHAT_COMPLETIONS_PATH, {
      method: 'post',
      contentType: 'application/json',
      headers: authHeaders({}),
      payload: payload,
    });
    var code = r.getResponseCode();
    var text = r.getContentText() || '';
    if (!BearerHttp_isSuccess(code)) {
      throw new Error(
        UiStrings_fmt_('err_globant_api_http', {
          path: GLOBANT_CHAT_COMPLETIONS_PATH + ' (simple)',
          code: String(code),
          detail: text.slice(0, 800),
        }),
      );
    }
    var result = JSON.parse(text);
    var answer = '';
    if (result.choices && result.choices.length > 0) {
      answer = (result.choices[0].message && result.choices[0].message.content) || '';
    } else if (result.text) {
      answer = result.text;
    }
    return { text: answer, parsed: result };
  }

  return {
    getOrganizationAndProjectIds: getOrganizationAndProjectIds,
    getAssistant: getAssistant,
    createChatAssistant: createChatAssistant,
    uploadFile: uploadFile,
    deleteFile: deleteFile,
    listAllFiles: listAllFiles,
    sendMessageDetailed: sendMessageDetailed,
    chatWithFileInline: chatWithFileInline,
    chatSimple: chatSimple,
    refreshAccessIds: function () {
      GlobantAssistantApiClient_invalidateAccessCache();
      memAccessIds = null;
      return getOrganizationAndProjectIds();
    },
  };
}

/**
 * Reintentos exponenciales mínimos (equivalente a `sendMessageWithRetry`).
 * @param {ReturnType<GlobantAssistantApiClient_create>} client
 * @param {string} assistantName
 * @param {string} prompt
 * @param {number} maxRetries — si 1 → hasta 2 intentos (comportamiento habitual).
 */
function GlobantAssistantApiClient_sendChatWithRetry(
  client,
  assistantName,
  prompt,
  maxRetries,
) {
  maxRetries = maxRetries == null ? LLM_DEFAULTS.GLOBANT_EXECUTE_MAX_RETRIES : maxRetries;
  var attempt = 0;
  /** @type {Error|null} */
  var lastErr = null;

  while (attempt <= maxRetries) {
    try {
      var out = client.sendMessageDetailed(assistantName, prompt);
      return out;
    } catch (e) {
      lastErr = e;
      if (attempt >= maxRetries) break;
      Utilities.sleep(500);
      attempt++;
    }
  }
  throw (
    lastErr ||
    new Error(
      UiStrings_t(
        UiStrings_activeLocale_(),
        'err_globant_chat_retry_unknown',
      ),
    )
  );
}
