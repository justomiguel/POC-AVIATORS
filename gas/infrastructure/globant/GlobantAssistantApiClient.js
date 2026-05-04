/**
 * @fileoverview Cliente REST para Assistants Globant (/v1/assistant/chat, /v1/files).
 * Equivalente al flujo legacy `AssistantProvider` (no confundir con /v1/search RAG).
 */

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
  var baseUrl = (config.baseUrl || 'https://api.agents.globant.com').replace(
    /\/+$/,
    '',
  );

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

  return {
    getOrganizationAndProjectIds: getOrganizationAndProjectIds,
    uploadFile: uploadFile,
    deleteFile: deleteFile,
    listAllFiles: listAllFiles,
    sendMessageDetailed: sendMessageDetailed,
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
