/**
 * @fileoverview Proveedor inline: texto de Drive en el prompt + Gemini API (clave).
 */

function LlmProviderGemini_parseGeminiResponse(data) {
  var c = data && data.candidates && data.candidates[0];
  if (!c) {
    throw new Error(
      'Gemini sin candidates: ' + JSON.stringify(data).slice(0, 500),
    );
  }
  var cont = c.content;
  var partsArr = cont && cont.parts;
  if (!partsArr) throw new Error('Gemini sin parts');
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
    throw new Error('Falta GEMINI_API_KEY en Propiedades del script.');
  }

  var q = (cmd.question || '').trim();
  if (!q) throw new Error('Escribí una pregunta.');
  var ids = cmd.driveFileIds || [];
  if (ids.length === 0) {
    throw new Error('Seleccioná al menos un documento.');
  }

  var blocks = [];
  ids.forEach(function (fid) {
    try {
      var ff = DriveApp.getFileById(fid);
      blocks.push(
        '### ' +
          ff.getName() +
          '\n' +
          DriveDocuments_fetchPlainText(fid, LLM_DEFAULTS.MAX_DOC_CHARS),
      );
    } catch (e) {
      blocks.push(
        '### id ' + fid + '\n_Error: ' + (e.message || String(e)) + '_',
      );
    }
  });

  var preamble =
    'Respondé en español usando solo información de los documentos. ' +
    'Si algo no aparece ahí, decilo claramente. Podés usar viñetas.';

  var prompt =
    preamble +
    '\n\n--- PREGUNTA ---\n' +
    q +
    '\n\n--- DOCUMENTOS ---\n' +
    blocks.join('\n\n---\n');

  var modelLabel =
    p.getProperty(LLM_PROP.GEMINI_MODEL) || LLM_DEFAULTS.GEMINI_MODEL;

  var payload = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
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
    throw new Error('Gemini API ' + code + ': ' + raw.substring(0, 700));
  }
  var answer = LlmProviderGemini_parseGeminiResponse(JSON.parse(raw));

  /** @type {LlmConsultationAnswer} */
  return {
    answer: answer,
    model: modelLabel,
    providerLabel: 'Gemini API',
    filesUsed: ids.length,
  };
}
