/**
 * @fileoverview Cliente REST para Globant Agents API v2 (/v2/agents/*).
 */

/**
 * @typedef {Object} GlobantAgentsApiClientConfig
 * @property {string} apiKey
 * @property {string} [baseUrl]
 * @property {string} [projectId]
 */

/**
 * @param {GlobantAgentsApiClientConfig} config
 * @return {{upsertAgent: function(string, Object, boolean): Object}}
 */
function GlobantAgentsApiClient_create(config) {
  var apiKey = String(config.apiKey || '').trim();
  var baseUrl = GlobantUrl_normalizeBaseUrl_(config.baseUrl);
  var projectId = String(config.projectId || '').trim();

  function authHeaders(extra) {
    var h = Object.assign(
      {
        Authorization: 'Bearer ' + apiKey,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      extra || {},
    );
    if (projectId) h.ProjectId = projectId;
    return h;
  }

  /**
   * @param {string} idOrName
   * @param {Object} agentDefinition
   * @param {boolean} automaticPublish
   * @return {Object}
   */
  function upsertAgent(idOrName, agentDefinition, automaticPublish) {
    var target = String(idOrName || '').trim();
    if (!target) {
      throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_admin_agent_api_id'));
    }
    var qs = '?automaticPublish=' + (automaticPublish ? 'true' : 'false');
    var path = '/v2/agents/' + encodeURIComponent(target) + '/upsert' + qs;
    var body = JSON.stringify({
      agentDefinition: agentDefinition || {},
    });
    var res = BearerHttp_fetch(baseUrl + path, {
      method: 'put',
      headers: authHeaders(),
      payload: body,
      muteHttpExceptions: true,
      followRedirects: true,
      validateHttpsCertificates: true,
    });
    var code = res.getResponseCode();
    var text = res.getContentText() || '';
    if (!BearerHttp_isSuccess(code)) {
      throw new Error(
        UiStrings_fmt_('err_globant_api_http', {
          path: '/v2/agents/{idOrName}/upsert',
          code: String(code),
          detail: text.slice(0, 900),
        }),
      );
    }
    var parsed = {};
    try {
      parsed = JSON.parse(text || '{}');
    } catch (eParse) {
      throw new Error(
        UiStrings_fmt_('err_json_invalid_detail', {
          message: (eParse && eParse.message) || '',
        }),
      );
    }
    return parsed;
  }

  return {
    upsertAgent: upsertAgent,
  };
}
