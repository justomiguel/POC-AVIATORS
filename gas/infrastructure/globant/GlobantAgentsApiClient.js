/**
 * @fileoverview Cliente REST para Globant Agents API v4 (/v4/agents/*).
 */

/** Versión de ruta para create/upsert/update (documentación Agents API). */
var GLOBANT_AGENTS_API_VERSION = 'v4';

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
   * @param {{modelName?:string,idOrName?:string,strategyName?:string}=} errorContext
   * @return {Object}
   */
  function upsertAgent(idOrName, agentDefinition, automaticPublish, errorContext) {
    var target = String(idOrName || '').trim();
    if (!target) {
      throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_admin_agent_api_id'));
    }
    var qs = '?automaticPublish=' + (automaticPublish ? 'true' : 'false');
    var path =
      '/' +
      GLOBANT_AGENTS_API_VERSION +
      '/agents/' +
      encodeURIComponent(target) +
      '/upsert' +
      qs;
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
      var ctx = errorContext || {};
      if (!ctx.idOrName) ctx.idOrName = target;
      var ad =
        agentDefinition && agentDefinition.agentData
          ? agentDefinition.agentData
          : {};
      var pr = ad.prompt || {};
      console.log(
        '[GlobantAgents] upsert failed HTTP ' +
          code +
          ' path=' +
          path +
          ' idOrName=' +
          ctx.idOrName +
          ' model=' +
          (ctx.modelName || '') +
          ' strategy=' +
          (ctx.strategyName || '') +
          ' projectId=' +
          (projectId ? 'set' : 'MISSING') +
          ' instructionsLen=' +
          String(pr.instructions || '').length +
          ' response=' +
          text.slice(0, 500),
      );
      throw new Error(GlobantHttp_formatApiError_(path, code, text, ctx));
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

  /**
   * @param {string} idOrName
   * @param {boolean} [allowDrafts]
   * @return {Object}
   */
  function getAgent(idOrName, allowDrafts) {
    var target = String(idOrName || '').trim();
    if (!target) {
      throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_admin_agent_api_id'));
    }
    var qs = allowDrafts ? '?allowDrafts=true' : '';
    var path =
      '/' + GLOBANT_AGENTS_API_VERSION + '/agents/' + encodeURIComponent(target) + qs;
    var res = BearerHttp_fetch(baseUrl + path, {
      method: 'get',
      headers: authHeaders(),
      muteHttpExceptions: true,
      followRedirects: true,
      validateHttpsCertificates: true,
    });
    var code = res.getResponseCode();
    var text = res.getContentText() || '';
    if (!BearerHttp_isSuccess(code)) {
      throw new Error(
        GlobantHttp_formatApiError_(path, code, text, { idOrName: target }),
      );
    }
    try {
      return JSON.parse(text || '{}');
    } catch (eParse) {
      throw new Error(
        UiStrings_fmt_('err_json_invalid_detail', {
          message: (eParse && eParse.message) || '',
        }),
      );
    }
  }

  /**
   * Inferencia sobre un Agent publicado en Hub (sin perfil RAG).
   * Prueba rutas documentadas en despliegues GEAI; si no hay endpoint de ejecución,
   * el llamador debe usar fallback (p. ej. chat con instrucciones del registro).
   *
   * @param {string} idOrName
   * @param {string} userMessage
   * @return {{ text: string, parsed: Object, path: string }}
   */
  function runAgentMessage(idOrName, userMessage) {
    var target = String(idOrName || '').trim();
    var msg = String(userMessage || '').trim();
    if (!target) {
      throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_admin_agent_api_id'));
    }
    if (!msg) {
      throw new Error(
        UiStrings_t(UiStrings_activeLocale_(), 'err_prompt_required'),
      );
    }

    var attempts = [
      {
        path:
          '/' +
          GLOBANT_AGENTS_API_VERSION +
          '/agents/' +
          encodeURIComponent(target) +
          '/run',
        body: { messages: [{ role: 'user', content: msg }] },
      },
      {
        path: '/' + GLOBANT_AGENTS_API_VERSION + '/agents/execute',
        body: {
          agentName: target,
          idOrName: target,
          messages: [{ role: 'user', content: msg }],
        },
      },
    ];

    var lastErr = null;
    var ai;
    for (ai = 0; ai < attempts.length; ai++) {
      var att = attempts[ai];
      try {
        var res = BearerHttp_fetch(baseUrl + att.path, {
          method: 'post',
          headers: authHeaders(),
          payload: JSON.stringify(att.body),
          muteHttpExceptions: true,
          followRedirects: true,
          validateHttpsCertificates: true,
        });
        var code = res.getResponseCode();
        var text = res.getContentText() || '';
        if (!BearerHttp_isSuccess(code)) {
          lastErr = new Error(
            GlobantHttp_formatApiError_(att.path, code, text, { idOrName: target }),
          );
          continue;
        }
        var parsed = JSON.parse(text || '{}');
        var extracted = GlobantAgentsApiClient_extractTextFromRunResponse_(parsed);
        if (!extracted) {
          lastErr = new Error(
            UiStrings_t(UiStrings_activeLocale_(), 'err_globant_hub_agent_empty'),
          );
          continue;
        }
        return { text: extracted, parsed: parsed, path: att.path };
      } catch (eAtt) {
        lastErr = eAtt;
      }
    }
    throw lastErr || new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_globant_hub_agent_run'));
  }

  return {
    upsertAgent: upsertAgent,
    getAgent: getAgent,
    runAgentMessage: runAgentMessage,
  };
}

/**
 * @param {unknown} parsed
 * @return {string}
 */
function GlobantAgentsApiClient_extractTextFromRunResponse_(parsed) {
  if (!parsed || typeof parsed !== 'object') return '';
  var p = /** @type {Object} */ (parsed);
  if (typeof p.text === 'string' && p.text.trim()) return p.text.trim();
  if (typeof p.answer === 'string' && p.answer.trim()) return p.answer.trim();
  if (p.action && typeof p.action === 'object') {
    var act = /** @type {Object} */ (p.action);
    if (typeof act.content === 'string' && act.content.trim()) {
      return act.content.trim();
    }
    if (typeof act.message === 'string' && act.message.trim()) {
      return act.message.trim();
    }
  }
  if (p.result && typeof p.result === 'object') {
    var r = /** @type {Object} */ (p.result);
    if (typeof r.text === 'string' && r.text.trim()) return r.text.trim();
  }
  return '';
}
