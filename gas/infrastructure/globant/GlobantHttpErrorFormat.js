/**
 * @fileoverview Formateo legible de respuestas de error HTTP de APIs Globant.
 */

/**
 * @param {string} text
 * @return {string}
 */
function GlobantHttp_extractErrorDetail_(text) {
  var raw = String(text || '').trim();
  if (!raw) return '';
  try {
    var j = JSON.parse(raw);
    /** @type {Array<string>} */
    var parts = [];
    if (j.error != null) {
      if (typeof j.error === 'string') {
        parts.push(j.error);
      } else if (typeof j.error === 'object') {
        if (j.error.message) parts.push(String(j.error.message));
        if (j.error.detail) {
          parts.push(
            typeof j.error.detail === 'string'
              ? j.error.detail
              : JSON.stringify(j.error.detail),
          );
        }
        if (j.error.details) {
          parts.push(
            typeof j.error.details === 'string'
              ? j.error.details
              : JSON.stringify(j.error.details),
          );
        }
        if (j.error.code != null && !j.error.message) {
          parts.push('code=' + String(j.error.code));
        }
      }
    }
    if (j.message) parts.push(String(j.message));
    if (j.detail) parts.push(String(j.detail));
    if (j.title) parts.push(String(j.title));
    if (parts.length) {
      var uniq = [];
      var seen = {};
      var i;
      for (i = 0; i < parts.length; i++) {
        var p = String(parts[i] || '').trim();
        if (!p || seen[p]) continue;
        seen[p] = true;
        uniq.push(p);
      }
      return uniq.join(' · ').slice(0, 900);
    }
  } catch (ignoreParse) {}
  return raw.slice(0, 900);
}

/**
 * @param {string} path
 * @param {number|string} httpCode
 * @param {string} responseText
 * @param {{modelName?:string,idOrName?:string,strategyName?:string}=} ctx
 * @return {string}
 */
function GlobantHttp_formatApiError_(path, httpCode, responseText, ctx) {
  var code = String(httpCode || '');
  var detail = GlobantHttp_extractErrorDetail_(responseText);
  /** @type {Array<string>} */
  var hints = [];
  var p = String(path || '');

  if (code === '400' && p.indexOf('upsert') >= 0) {
    hints.push(UiStrings_t(UiStrings_activeLocale_(), 'err_globant_agent_upsert_hint'));
    hints.push(
      UiStrings_t(UiStrings_activeLocale_(), 'err_globant_agent_upsert_project_hint'),
    );
    if (ctx && ctx.modelName) {
      hints.push(
        UiStrings_fmt_('err_globant_agent_upsert_model', {
          model: String(ctx.modelName),
        }),
      );
    }
    if (ctx && ctx.idOrName) {
      hints.push(
        UiStrings_fmt_('err_globant_agent_upsert_id', {
          id: String(ctx.idOrName),
        }),
      );
    }
    if (ctx && ctx.strategyName) {
      hints.push(
        UiStrings_fmt_('err_globant_agent_upsert_strategy', {
          strategy: String(ctx.strategyName),
        }),
      );
    }
  }

  if (code === '400' && p.indexOf('/v1/search/execute') >= 0) {
    hints.push(
      UiStrings_t(UiStrings_activeLocale_(), 'err_globant_rag_execute_400_hint'),
    );
    if (ctx && ctx.idOrName) {
      hints.push(
        UiStrings_fmt_('err_globant_rag_execute_profile', {
          profile: String(ctx.idOrName),
        }),
      );
    }
  }

  if (code === '401' || code === '403') {
    hints.push(UiStrings_t(UiStrings_activeLocale_(), 'err_globant_api_auth_hint'));
  }

  var fullDetail = detail;
  if (hints.length) {
    fullDetail =
      (fullDetail || UiStrings_t(UiStrings_activeLocale_(), 'err_globant_api_no_detail')) +
      '\n\n' +
      hints.join('\n');
  }

  return UiStrings_fmt_('err_globant_api_http', {
    path: p,
    code: code,
    detail: String(fullDetail || '').slice(0, 1400),
  });
}
