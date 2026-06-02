/**
 * @fileoverview Cliente REST para Globant Agents / RAG Assistants API.
 * Base URL por defecto: https://api.clients.geai.globant.com (GLOBANT_RAG_BASE_URL).
 */

/**
 * @typedef {Object} GlobantRagApiClientConfig
 * @property {string} apiKey
 * @property {string} [baseUrl]
 */

/**
 * @param {GlobantRagApiClientConfig} config
 * @return {Object} API con métodos de perfil, documentos y execute
 */
function GlobantRagApiClient_create(config) {
  var apiKey = config.apiKey;
  var baseUrl = GlobantUrl_normalizeBaseUrl_(config.baseUrl);

  function authHeaders() {
    return { Authorization: 'Bearer ' + apiKey };
  }

  /**
   * @param {string} method
   * @param {string} path — comienza con /
   * @param {GoogleAppsScript.URL_Fetch.URLFetchRequestOptions} extra
   */
  function request(method, path, extra) {
    var opt = extra || {};
    opt.method = method;
    opt.headers = Object.assign(authHeaders(), opt.headers || {});
    var res = BearerHttp_fetch(baseUrl + path, opt);
    var code = res.getResponseCode();
    var text = res.getContentText() || '';
    return { code: code, text: text };
  }

  /**
   * @param {string} profileName
   * @param {string} question
   * @param {Array<{key:string,operator:string,value:string|number}>} [filters] - Filtros opcionales
   */
  function executeQueryDetailedImpl(profileName, question, filters) {
    var finalFilters = [];
    if (Array.isArray(filters)) {
      finalFilters = filters;
    } else if (typeof filters === 'string' && filters) {
      finalFilters = [{ key: 'id', operator: '$eq', value: filters }];
    }
    var payload = {
      profile: profileName,
      question: question,
      filters: finalFilters,
    };
    console.log(
      '[RAG] POST /v1/search/execute profile=' +
        profileName +
        ' questionLen=' +
        String(question || '').length +
        ' filters=' +
        finalFilters.length,
    );
    var r = request('post', '/v1/search/execute', {
      contentType: 'application/json',
      payload: JSON.stringify(payload),
    });
    if (!BearerHttp_isSuccess(r.code)) {
      throw new Error(
        UiStrings_fmt_('err_globant_api_http', {
          path: '/v1/search/execute',
          code: String(r.code),
          detail: r.text,
        }),
      );
    }
    var result = JSON.parse(r.text);
    if (!result.result || !result.result.success) {
      throw new Error(
        UiStrings_fmt_('err_globant_api_logical', {
          path: '/v1/search/execute',
          detail: JSON.stringify(result).slice(0, 600),
        }),
      );
    }
    return { text: result.text || '', parsed: result };
  }

  function getProfileDocumentsRequest(profileName, skip, count) {
    skip = skip == null ? 0 : Math.max(0, parseInt(String(skip), 10) || 0);
    count =
      count == null ? 50 : Math.min(100, Math.max(1, parseInt(String(count), 10) || 50));
    var qs =
      '?skip=' +
      encodeURIComponent(String(skip)) +
      '&count=' +
      encodeURIComponent(String(count));
    var pathDoc =
      '/v1/search/profile/' +
      encodeURIComponent(profileName) +
      '/documents' +
      qs;
    return request('get', pathDoc, {
      headers: { Accept: 'application/json' },
    });
  }

  /**
   * @param {unknown} blob
   * @return {Array<{id:string,name:string,extension:string,indexStatus:string,url:string,timestamp:string}>}
   */
  function normalizeDocumentsArray_(blob) {
    var out = [];
    if (!blob) return out;
    if (Array.isArray(blob)) {
      for (var i = 0; i < blob.length; i++) {
        var d = blob[i];
        if (!d) continue;
        out.push({
          id: String(d.id || ''),
          name: String(d.name || ''),
          extension: String(d.extension || ''),
          indexStatus: String(d.indexStatus || ''),
          url: String(d.url || ''),
          timestamp: String(d.timestamp || ''),
        });
      }
      return out;
    }
    if (blob.id || blob.name) {
      out.push({
        id: String(blob.id || ''),
        name: String(blob.name || ''),
        extension: String(blob.extension || ''),
        indexStatus: String(blob.indexStatus || ''),
        url: String(blob.url || ''),
        timestamp: String(blob.timestamp || ''),
      });
    }
    return out;
  }

  /**
   * @param {unknown} parsed
   * @return {{ projectActive?: boolean, projectId?: string, projectName?: string, profiles: Array<{name:string,description:string}> }}
   */
  function normalizeSearchProfilesResponse_(parsed) {
    var profiles = [];
    /** @type {unknown} */
    var sp = parsed && parsed.searchProfiles;
    var i;

    function pushProf(o) {
      if (!o || typeof o !== 'object') return;
      var n = ('' + ('name' in o ? /** @type {{name:?}} */ (o).name : '')).trim();
      if (!n) return;
      var desc = '' + ('description' in o ? /** @type {{description:?}} */ (o).description : '');
      profiles.push({ name: n, description: desc });
    }

    if (Array.isArray(sp)) {
      for (i = 0; i < sp.length; i++) pushProf(sp[i]);
    } else if (sp && typeof sp === 'object') {
      pushProf(sp);
    }

    /** @deprecated algunos payloads usan otros nombres */
    var alt =
      parsed &&
      parsed.profiles &&
      Array.isArray(parsed.profiles)
        ? parsed.profiles
        : null;
    if (alt && profiles.length === 0) {
      for (i = 0; i < alt.length; i++) pushProf(alt[i]);
    }

    return {
      projectActive: !!(parsed && parsed.projectActive),
      projectId:
        parsed && parsed.projectId != null ? String(parsed.projectId) : '',
      projectName:
        parsed && parsed.projectName != null ? String(parsed.projectName) : '',
      profiles: profiles,
    };
  }

  return {
    /** Lista RAG Assistants (/searchProfiles) para el proyecto de la token. */
    listSearchProfiles: function () {
      var r = request('get', '/v1/search/profiles', {
        headers: {
          Accept: 'application/json',
          'include-all': 'true',
        },
      });
      if (!BearerHttp_isSuccess(r.code)) {
        throw new Error(
          UiStrings_fmt_('err_globant_api_http', {
            path: '/v1/search/profiles',
            code: String(r.code),
            detail: r.text.slice(0, 800),
          }),
        );
      }
      var parsed = JSON.parse(r.text || '{}');
      return normalizeSearchProfilesResponse_(parsed);
    },

    /** @param {number} skip @param {number} count */
    listProfileDocuments: function (profileName, skip, count) {
      var r = getProfileDocumentsRequest(profileName, skip, count);
      if (!BearerHttp_isSuccess(r.code)) {
        throw new Error(
          UiStrings_fmt_('err_globant_api_http', {
            path:
              '/v1/search/profile/' +
              encodeURIComponent(profileName) +
              '/documents',
            code: String(r.code),
            detail: r.text.slice(0, 800),
          }),
        );
      }
      var parsed = JSON.parse(r.text || '{}');
      var docs = normalizeDocumentsArray_(parsed.documents);
      var total = 0;
      if (parsed.count != null) {
        var tc = parseInt(String(parsed.count), 10);
        total = !isNaN(tc) ? tc : 0;
      }
      return { documents: docs, totalDocuments: total, raw: parsed };
    },

    deleteProfileDocumentsAll: function (profileName) {
      var path =
        '/v1/search/profile/' +
        encodeURIComponent(profileName) +
        '/documents';
      var r = request('delete', path, {});
      if (!BearerHttp_isSuccess(r.code)) {
        throw new Error(
          UiStrings_fmt_('err_globant_api_http', {
            path:
              '/v1/search/profile/' +
              encodeURIComponent(profileName) +
              '/documents',
            code: String(r.code),
            detail: r.text.slice(0, 800),
          }),
        );
      }
    },

    /** @param {Object} body */
    createProfile: function (body) {
      var r = request('post', '/v1/search/profile', {
        contentType: 'application/json',
        payload: JSON.stringify(body),
      });
      if (!BearerHttp_isSuccess(r.code)) {
        throw new Error(
          UiStrings_fmt_('err_globant_api_http', {
            path: '/v1/search/profile',
            code: String(r.code),
            detail: r.text,
          }),
        );
      }
    },

    /** @param {string} profileName */
    deleteProfile: function (profileName) {
      var path =
        '/v1/search/profile/' + encodeURIComponent(profileName);
      var r = request('delete', path, {});
      if (!BearerHttp_isSuccess(r.code)) {
        throw new Error(
          UiStrings_fmt_('err_globant_api_http', {
            path:
              '/v1/search/profile/' + encodeURIComponent(profileName),
            code: String(r.code),
            detail: r.text,
          }),
        );
      }
    },

    /**
     * @param {string} profileName
     * @param {Blob} pdfBlob
     * @param {Object} [metadata] - Metadata custom para indexacion (client_name, content_type, etc.)
     * @return {{ id: string }}
     */
    uploadPdfDocument: function (profileName, pdfBlob, metadata) {
      var path =
        '/v1/search/profile/' +
        encodeURIComponent(profileName) +
        '/document';
      var url = baseUrl + path;
      var r;

      if (metadata && typeof metadata === 'object' && Object.keys(metadata).length > 0) {
        var boundary = '----GlobantUpload' + Utilities.getUuid().replace(/-/g, '');
        var metadataJson = JSON.stringify(metadata);
        var fileName = pdfBlob.getName() || 'document.pdf';
        var pdfBytes = pdfBlob.getBytes();

        var parts = [];
        parts.push('--' + boundary);
        parts.push('Content-Disposition: form-data; name="metadata"');
        parts.push('');
        parts.push(metadataJson);
        parts.push('--' + boundary);
        parts.push('Content-Disposition: form-data; name="file"; filename="' + fileName + '"');
        parts.push('Content-Type: application/pdf');
        parts.push('');

        var preFileBlob = Utilities.newBlob(parts.join('\r\n') + '\r\n');
        var postFileBlob = Utilities.newBlob('\r\n--' + boundary + '--');
        var fullPayload = Utilities.newBlob(
          [].concat(preFileBlob.getBytes(), pdfBytes, postFileBlob.getBytes()),
        ).getBytes();

        r = BearerHttp_fetch(url, {
          method: 'post',
          contentType: 'multipart/form-data; boundary=' + boundary,
          headers: authHeaders(),
          payload: fullPayload,
          muteHttpExceptions: true,
          followRedirects: true,
          validateHttpsCertificates: true,
        });
      } else {
        r = BearerHttp_fetch(url, {
          method: 'post',
          contentType: 'application/pdf',
          headers: Object.assign(authHeaders(), {
            filename: pdfBlob.getName(),
          }),
          payload: pdfBlob.getBytes(),
          muteHttpExceptions: true,
          followRedirects: true,
          validateHttpsCertificates: true,
        });
      }

      var code = r.getResponseCode();
      var text = r.getContentText() || '';
      if (!BearerHttp_isSuccess(code)) {
        throw new Error(
          UiStrings_fmt_('err_globant_api_http', {
            path:
              '/v1/search/profile/' +
              encodeURIComponent(profileName) +
              '/document',
            code: String(code),
            detail: text,
          }),
        );
      }
      var parsed = JSON.parse(text);
      if (!parsed.id) {
        throw new Error(
          UiStrings_fmt_('err_globant_api_logical', {
            path:
              '/v1/search/profile/' +
              encodeURIComponent(profileName) +
              '/document',
            detail: text,
          }),
        );
      }
      return { id: parsed.id };
    },

    /**
     * @param {string} profileName
     * @param {string} documentId
     */
    deleteDocument: function (profileName, documentId) {
      var path =
        '/v1/search/profile/' +
        encodeURIComponent(profileName) +
        '/document/' +
        encodeURIComponent(documentId);
      var r = request('delete', path, {});
      if (!BearerHttp_isSuccess(r.code)) {
        throw new Error(
          UiStrings_fmt_('err_globant_api_http', {
            path:
              '/v1/search/profile/' +
              encodeURIComponent(profileName) +
              '/document/' +
              encodeURIComponent(documentId),
            code: String(r.code),
            detail: r.text,
          }),
        );
      }
    },

    /**
     * Reindexa un documento existente con nueva metadata (sin re-subir el archivo).
     * @param {string} profileName
     * @param {string} documentId
     * @param {Object} metadata - Metadata custom para indexacion
     * @return {{ id: string, indexStatus: string }}
     */
    reindexDocumentWithMetadata: function (profileName, documentId, metadata) {
      var path =
        '/v1/search/profile/' +
        encodeURIComponent(profileName) +
        '/document';
      var url = baseUrl + path;

      var boundary = '----GlobantReindex' + Utilities.getUuid().replace(/-/g, '');
      var metadataJson = JSON.stringify(metadata || {});

      var parts = [];
      parts.push('--' + boundary);
      parts.push('Content-Disposition: form-data; name="metadata"');
      parts.push('');
      parts.push(metadataJson);
      parts.push('--' + boundary + '--');

      var fullPayload = Utilities.newBlob(parts.join('\r\n')).getBytes();

      var r = BearerHttp_fetch(url, {
        method: 'put',
        contentType: 'multipart/form-data; boundary=' + boundary,
        headers: Object.assign(authHeaders(), {
          documentId: documentId,
        }),
        payload: fullPayload,
        muteHttpExceptions: true,
        followRedirects: true,
        validateHttpsCertificates: true,
      });

      var code = r.getResponseCode();
      var text = r.getContentText() || '';
      if (!BearerHttp_isSuccess(code)) {
        throw new Error(
          UiStrings_fmt_('err_globant_api_http', {
            path:
              '/v1/search/profile/' +
              encodeURIComponent(profileName) +
              '/document (reindex)',
            code: String(code),
            detail: text,
          }),
        );
      }
      var parsed = JSON.parse(text);
      return {
        id: String(parsed.id || documentId),
        indexStatus: String(parsed.indexStatus || 'Unknown'),
      };
    },

    /**
     * @param {string} profileName
     * @param {string} documentId
     * @return {string} indexStatus
     */
    getDocumentIndexStatus: function (profileName, documentId) {
      var path =
        '/v1/search/profile/' +
        encodeURIComponent(profileName) +
        '/document/' +
        encodeURIComponent(documentId);
      var r = request('get', path, {});
      if (!BearerHttp_isSuccess(r.code)) {
        throw new Error(
          UiStrings_fmt_('err_globant_api_http', {
            path:
              '/v1/search/profile/' +
              encodeURIComponent(profileName) +
              '/document/' +
              encodeURIComponent(documentId),
            code: String(r.code),
            detail: r.text,
          }),
        );
      }
      var result = JSON.parse(r.text);
      return result.indexStatus;
    },

    /**
     * @param {string} profileName
     * @param {string} question
     * @param {Array<{key:string,operator:string,value:string|number}>|string} [filters] - Array de filtros o documentId (backwards compatible)
     * @return {{ text: string, parsed: Object }}
     */
    executeQueryDetailed: executeQueryDetailedImpl,

    /**
     * @param {string} profileName
     * @param {string} question
     * @param {Array<{key:string,operator:string,value:string|number}>|string} [filters] - Array de filtros o documentId (backwards compatible)
     * @return {string}
     */
    executeQuery: function (profileName, question, filters) {
      return executeQueryDetailedImpl(profileName, question, filters).text;
    },
  };
}

/**
 * @param {Object} client — retorno de GlobantRagApiClient_create
 * @param {string} profileName
 * @param {string} documentId
 * @param {number} maxRetries
 * @param {number} delayMs
 * @return {boolean}
 */
function GlobantRagApiClient_waitIndexed(
  client,
  profileName,
  documentId,
  maxRetries,
  delayMs,
) {
  maxRetries = maxRetries || 12;
  delayMs = delayMs || 5000;
  var attempt = 0;
  while (attempt < maxRetries) {
    var status = client.getDocumentIndexStatus(profileName, documentId);
    if (status === 'Success') return true;
    if (status === 'Failed') return false;
    Utilities.sleep(delayMs);
    attempt++;
  }
  return false;
}

/**
 * @param {Object} client
 * @param {string} profileName
 * @param {string} question
 * @param {string} documentId
 * @param {number} maxRetries
 */
function GlobantRagApiClient_executeWithRetry(
  client,
  profileName,
  question,
  documentId,
  maxRetries,
) {
  maxRetries = maxRetries == null ? 2 : maxRetries;
  var lastErr;
  for (var i = 0; i <= maxRetries; i++) {
    try {
      return client.executeQuery(profileName, question, documentId);
    } catch (e) {
      lastErr = e;
      if (i < maxRetries) Utilities.sleep(500);
    }
  }
  throw lastErr;
}
