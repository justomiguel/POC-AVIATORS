/**
 * @fileoverview Cliente REST para Globant Agents / RAG Assistants API.
 * Basado en https://api.agents.globant.com (base configurable).
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
  var baseUrl = (config.baseUrl || 'https://api.agents.globant.com').replace(
    /\/+$/,
    '',
  );

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

  function executeQueryDetailedImpl(profileName, question, documentId) {
    var payload = {
      profile: profileName,
      question: question,
      filters: documentId
        ? [
            {
              key: 'id',
              operator: '$eq',
              value: documentId,
            },
          ]
        : [],
    };
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
     * @return {{ id: string }}
     */
    uploadPdfDocument: function (profileName, pdfBlob) {
      var path =
        '/v1/search/profile/' +
        encodeURIComponent(profileName) +
        '/document';
      var r = BearerHttp_fetch(baseUrl + path, {
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
     * @param {string} [documentId]
     * @return {{ text: string, parsed: Object }}
     */
    executeQueryDetailed: executeQueryDetailedImpl,

    /**
     * @param {string} profileName
     * @param {string} question
     * @param {string} documentId
     * @return {string}
     */
    executeQuery: function (profileName, question, documentId) {
      return executeQueryDetailedImpl(profileName, question, documentId).text;
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
