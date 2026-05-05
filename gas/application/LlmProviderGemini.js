/**
 * @fileoverview Proveedor inline: texto de Drive en el prompt + Gemini API (clave).
 */

function LlmProviderGemini_parseGeminiResponse(data) {
  var c = data && data.candidates && data.candidates[0];
  if (!c) {
    throw new Error(
      UiStrings_t(UiStrings_activeLocale_(), 'err_gemini_parse'),
    );
  }
  var cont = c.content;
  var partsArr = cont && cont.parts;
  if (!partsArr)
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_gemini_parse'));
  var out = [];
  partsArr.forEach(function (part) {
    if (part.text) out.push(part.text);
  });
  var joined = out.join('');
  if (!joined && cont) joined = JSON.stringify(cont).slice(0, 700);
  return joined;
}

/**
 * @param {LlmConsultationCommand} cmd
 * @return {LlmConsultationAnswer}
 */
function LlmProviderGemini_consult(cmd) {
  var p = PropertiesService.getScriptProperties();
  var apiKey = (p.getProperty(LLM_PROP.GEMINI_KEY) || '').trim();
  if (!apiKey) {
    throw new Error(
      UiStrings_t(UiStrings_activeLocale_(), 'err_falta_gemini'),
    );
  }

  var q = (cmd.question || '').trim();
  if (!q)
    throw new Error(
      UiStrings_t(UiStrings_activeLocale_(), 'err_question_required'),
    );
  var ids = cmd.driveFileIds || [];
  if (ids.length === 0) {
    throw new Error(
      UiStrings_t(UiStrings_activeLocale_(), 'err_select_doc'),
    );
  }

  var blocks = [];
  ids.forEach(function (fid) {
    try {
      var ff = DriveApp.getFileById(fid);
      blocks.push(
        UiStrings_fmt_('llm_gemini_doc_heading', { name: ff.getName() }) +
          DriveDocuments_fetchPlainText(fid, LLM_DEFAULTS.MAX_DOC_CHARS),
      );
    } catch (e) {
      blocks.push(
        UiStrings_fmt_('llm_gemini_block_read_error', {
          id: fid,
          err: e.message || String(e),
        }),
      );
    }
  });

  var preamble = UiStrings_t(UiStrings_activeLocale_(), 'llm_gemini_system_preamble');

  var prompt =
    preamble +
    '\n\n' +
    UiStrings_t(UiStrings_activeLocale_(), 'llm_gemini_section_question') +
    '\n' +
    q +
    '\n\n' +
    UiStrings_t(UiStrings_activeLocale_(), 'llm_gemini_section_documents') +
    '\n' +
    blocks.join(
      UiStrings_t(UiStrings_activeLocale_(), 'llm_gemini_between_docs'),
    );

  var modelLabel =
    p.getProperty(LLM_PROP.GEMINI_MODEL) || LLM_DEFAULTS.GEMINI_MODEL;

  var contents = [];
  var hist = cmd.history || [];
  for (var hi = 0; hi < hist.length; hi++) {
    var he = hist[hi];
    if (he && he.content) {
      var gemRole = he.role === 'assistant' ? 'model' : 'user';
      contents.push({ role: gemRole, parts: [{ text: he.content }] });
    }
  }
  contents.push({ role: 'user', parts: [{ text: prompt }] });

  var payload = {
    contents: contents,
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 4096,
    },
  };

  var url =
    'https://generativelanguage.googleapis.com/v1beta/models/' +
    encodeURIComponent(modelLabel) +
    ':generateContent';

  var res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    muteHttpExceptions: true,
    headers: { 'x-goog-api-key': apiKey },
    payload: JSON.stringify(payload),
    followRedirects: true,
    validateHttpsCertificates: true,
  });

  var code = res.getResponseCode();
  var raw = res.getContentText() || '';
  if (code < 200 || code >= 300) {
    throw new Error(
      UiStrings_fmt_('llm_error_gemini_http', {
        code: String(code),
        detail: raw.substring(0, 700),
      }),
    );
  }
  var answer = LlmProviderGemini_parseGeminiResponse(JSON.parse(raw));

  /** @type {LlmConsultationAnswer} */
  return {
    answer: answer,
    model: modelLabel,
    providerLabel: UiStrings_t(
      UiStrings_activeLocale_(),
      'meta_provider_gemini_api',
    ),
    filesUsed: ids.length,
  };
}
