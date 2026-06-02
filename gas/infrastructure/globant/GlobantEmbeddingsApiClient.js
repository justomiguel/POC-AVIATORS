/**
 * @fileoverview Cliente REST para embeddings Globant Enterprise AI (POST /embeddings).
 */

/** @type {string} */
var GLOBANT_EMBEDDING_DEFAULT_MODEL = 'openai/text-embedding-3-small';

/** @type {number} */
var GLOBANT_EMBEDDING_DIMENSIONS = 1536;

/**
 * @typedef {Object} GlobantEmbeddingsApiClientConfig
 * @property {string} apiKey
 * @property {string} [baseUrl]
 */

/**
 * @param {GlobantEmbeddingsApiClientConfig} config
 */
function GlobantEmbeddingsApiClient_create(config) {
  var apiKey = config.apiKey;
  var baseUrl = GlobantUrl_normalizeBaseUrl_(config.baseUrl);

  function authHeaders(extra) {
    return Object.assign({ Authorization: 'Bearer ' + apiKey }, extra || {});
  }

  /**
   * @param {string|Array<string>} input
   * @param {string=} model
   * @return {{embedding:Array<number>,model:string,usage:Object}}
   */
  function createEmbedding(input, model) {
    var mdl = String(model || GLOBANT_EMBEDDING_DEFAULT_MODEL).trim();
    var payload = JSON.stringify({
      model: mdl,
      input: input,
    });
    var r = BearerHttp_fetch(baseUrl + '/embeddings', {
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
          path: '/embeddings',
          code: String(code),
          detail: text.slice(0, 800),
        }),
      );
    }
    var parsed = JSON.parse(text);
    var data = parsed && parsed.data;
    if (!Array.isArray(data) || !data.length || !Array.isArray(data[0].embedding)) {
      throw new Error(
        UiStrings_fmt_('err_globant_api_logical', {
          path: '/embeddings',
          detail: JSON.stringify(parsed).slice(0, 800),
        }),
      );
    }
    return {
      embedding: data[0].embedding,
      model: String(parsed.model || mdl),
      usage: parsed.usage || {},
    };
  }

  return {
    createEmbedding: createEmbedding,
  };
}
