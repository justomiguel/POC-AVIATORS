/**
 * @fileoverview Extraccion de metadata desde un archivo (vía LLM multimodal con archivo inline).
 */

/**
 * Mismo tope que `ADMIN_UPLOAD_LOCAL_MAX_BYTES` (cuota UrlFetch POST de Apps Script: 50 MB).
 * Si el otro módulo no está cargado, se usa 50 MB.
 *
 * @type {number}
 */
var CONTENT_UPLOAD_LOCAL_MAX_BYTES =
  typeof ADMIN_UPLOAD_LOCAL_MAX_BYTES !== 'undefined'
    ? ADMIN_UPLOAD_LOCAL_MAX_BYTES
    : 50 * 1024 * 1024;

/**
 * Normaliza tags: inglés, camelCase, sin espacios, con #.
 * @param {Array<string>} tags
 * @return {Array<string>}
 */
function ContentExtraction_normalizeTags_(tags) {
  if (!Array.isArray(tags)) return [];
  var out = [];
  var seen = {};
  for (var i = 0; i < tags.length; i++) {
    var t = String(tags[i] || '').trim();
    if (!t) continue;
    t = t.replace(/[^a-zA-Z0-9#]/g, '');
    if (t.charAt(0) !== '#') t = '#' + t;
    var key = t.toLowerCase();
    if (seen[key]) continue;
    seen[key] = true;
    out.push(t);
  }
  return out;
}

/**
 * Valida y prepara el payload del archivo para subir a Globant.
 * @param {{name:string,mimeType:string,dataBase64:string}} payload
 * @return {{name:string,mimeType:string,blob:GoogleAppsScript.Base.Blob}}
 */
function ContentExtraction_validateAndPrepareBlob_(payload) {
  var who = ContentCatalog_requireContributor_();
  if (!payload || typeof payload !== 'object') {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_admin_agent_payload'));
  }
  var name = String(payload.name || 'document').trim();
  var mime = String(payload.mimeType || '').trim();
  var b64 = String(payload.dataBase64 || '');
  if (!b64) throw new Error('Archivo vacio');
  if (!DriveDocuments_mimeEligibleForGlobantRag(mime)) {
    throw new Error(
      UiStrings_fmt_('err_admin_upload_mime', {
        name: name,
        mime: mime || UiStrings_t(UiStrings_activeLocale_(), 'label_em_dash'),
      }),
    );
  }
  var bytes = Utilities.base64Decode(b64);
  if (!bytes || bytes.length === 0) throw new Error('Archivo vacio');
  if (bytes.length > CONTENT_UPLOAD_LOCAL_MAX_BYTES) {
    throw new Error(
      UiStrings_fmt_('err_contents_upload_too_large', {
        name: name,
        max_mb: String(
          Math.floor(CONTENT_UPLOAD_LOCAL_MAX_BYTES / (1024 * 1024)),
        ),
      }),
    );
  }
  var stem = DriveDocuments_safeFileStem_(name);
  if ((mime === MimeType.PDF || mime === 'application/pdf') && !/\.pdf$/i.test(stem)) {
    stem += '.pdf';
  }
  var blob = Utilities.newBlob(bytes, mime, stem);
  return {
    name: stem,
    mimeType: mime,
    blob: blob,
    uploadedBy: who.email,
  };
}

/** @type {Array<string>} Valores válidos para stage en propuestas */
var CONTENT_PROPOSAL_STAGES = ['PRESENTED', 'NEGOTIATION', 'WIN', 'LOST', 'ON_HOLD'];
/** @type {Array<string>} Valores válidos para pricing_model */
var CONTENT_PRICING_MODELS = ['TIME_AND_MATERIALS', 'STAFF_AUGMENTATION', 'FIXED_PRICE', 'SUBSCRIPTION'];
/** @type {Array<string>} Valores válidos para industria del cliente */
var CONTENT_ALLOWED_CLIENT_INDUSTRIES = [
  'Agencias de Turismo',
  'Logistica',
  'Agencias AeroEspaciales',
  'Aeropuertos',
  'Aerolineas',
];

/**
 * @param {string} contentType
 * @return {string}
 */
function ContentExtraction_promptForType_(contentType) {
  var existingTags = ContentCatalog_getAllTags();
  var tagsHint = existingTags.length
    ? 'EXISTING TAGS (reuse these, do NOT create synonyms): ' + existingTags.join(', ')
    : '';

  var commonInstructions = [
    'Analyze the document and return ONLY valid JSON.',
    'No markdown, no comments.',
    'If a value is missing, use empty string unless a field is explicitly mandatory below.',
    'TAGS RULES:',
    '- Always in English',
    '- camelCase format (e.g. #dataAnalytics, #cloudMigration)',
    '- No spaces, no special chars except #',
    '- Reuse existing tags when meaning matches. Do NOT create synonyms.',
    tagsHint,
    'INDUSTRY RULES:',
    '- common.industry MUST be one of: ' + CONTENT_ALLOWED_CLIENT_INDUSTRIES.join(', '),
    '- No synonyms, no translations, no free text.',
    'Common structure:',
    '{"common":{"title":"","summary":"","client_name":"","industry":"","tags":[]},"specific":{},"confidence":"high|medium|low","warnings":[]}',
  ];
  if (contentType === 'proposal') {
    commonInstructions.push(
      'specific for proposal: {"stage":"","pricing_model":"","effort_estimate":"","timeline":"","win_probability":"","notes":""}',
      'stage MUST be one of: ' + CONTENT_PROPOSAL_STAGES.join(', ') + '. If unclear, use PRESENTED.',
      'pricing_model MUST be one of: ' + CONTENT_PRICING_MODELS.join(', ') + '. If unclear, use TIME_AND_MATERIALS.',
      'For proposal, common.industry is mandatory and MUST be one of the allowed values.',
    );
  } else if (contentType === 'success_case') {
    commonInstructions.push(
      'specific for success_case: {"challenge":"","solution":"","impact_metric":"","impact_value":"","evidence":"","notes":""}',
      'For success_case, common.industry is mandatory and MUST be one of the allowed values.',
    );
  } else if (contentType === 'client') {
    commonInstructions.push(
      'specific for client: {"account_status":"","active_projects":"","health_score":"","renewal_date":"","notes":""}',
    );
  } else {
    throw new Error('content_type invalido');
  }
  commonInstructions.push('Prioritize accuracy and traceability.');
  return commonInstructions.join('\n');
}

/**
 * Finds the end index (inclusive) of the first balanced JSON object starting at `start`
 * in `raw`, correctly skipping `{` and `}` inside string literals.
 * Returns -1 if no balanced closing brace is found.
 * @param {string} raw
 * @param {number} start index of the opening `{`
 * @return {number}
 */
function ContentExtraction_findJsonEnd_(raw, start) {
  var depth = 0;
  var inStr = false;
  var escape = false;
  for (var i = start; i < raw.length; i++) {
    var c = raw[i];
    if (escape) { escape = false; continue; }
    if (c === '\\' && inStr) { escape = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === '{') { depth++; continue; }
    if (c === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/**
 * @param {string} text
 * @return {Object}
 */
function ContentExtraction_parseJson_(text) {
  var raw = String(text || '').trim();
  if (!raw) throw new Error('Extraccion vacia');
  var start = raw.indexOf('{');
  if (start < 0) throw new Error('Extraccion invalida');
  var end = ContentExtraction_findJsonEnd_(raw, start);
  if (end < 0) throw new Error('Extraccion invalida');
  var body = raw.substring(start, end + 1);
  var parsed = JSON.parse(body);
  if (!parsed || typeof parsed !== 'object') throw new Error('Extraccion invalida');
  if (!parsed.common || typeof parsed.common !== 'object') parsed.common = {};
  if (!parsed.specific || typeof parsed.specific !== 'object') parsed.specific = {};
  if (!Array.isArray(parsed.common.tags)) {
    var legacyTags = [].concat(
      parsed.common.tags_controlled || [],
      parsed.common.tags_free || [],
    );
    parsed.common.tags = legacyTags;
  }
  parsed.common.tags = ContentExtraction_normalizeTags_(parsed.common.tags);
  parsed.common.industry = ClientsMaster_resolveIndustry_(parsed.common.industry || '');
  delete parsed.common.tags_controlled;
  delete parsed.common.tags_free;
  if (!Array.isArray(parsed.warnings)) parsed.warnings = [];
  parsed.confidence = String(parsed.confidence || 'low').toLowerCase();
  if (parsed.confidence !== 'high' && parsed.confidence !== 'medium') parsed.confidence = 'low';
  return parsed;
}

/** @type {string} Modelo multimodal para extracción (Gemini con soporte PDF) */
var CONTENT_EXTRACTION_MODEL = 'vertex_ai/gemini-2.0-flash-exp';

/**
 * Extrae metadata enviando el archivo inline (base64) al LLM multimodal.
 * Un solo paso: no necesita upload/indexación/borrado temporal.
 * @param {string} payloadJson {name, mimeType, dataBase64}
 * @param {string} contentType
 * @return {{ok:boolean, file:{name:string, mimeType:string}, draft:Object}}
 */
function ContentExtraction_extractInline(payloadJson, contentType) {
  ContentCatalog_requireContributor_();
  var raw = String(payloadJson || '').trim();
  var payload = JSON.parse(raw);
  var prepared = ContentExtraction_validateAndPrepareBlob_(payload);

  var props = PropertiesService.getScriptProperties();
  var apiKey = (props.getProperty(LLM_PROP.GLOBANT_API_KEY) || '').trim();
  if (!apiKey) throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_falta_globant_key'));
  var baseUrl = (props.getProperty(LLM_PROP.GLOBANT_BASE_URL) || '').trim();

  var client = GlobantAssistantApiClient_create({
    apiKey: apiKey,
    baseUrl: baseUrl || undefined,
  });

  var prompt = ContentExtraction_promptForType_(contentType);
  var b64 = payload.dataBase64 || '';
  var mime = prepared.mimeType || 'application/pdf';

  var result = client.chatWithFileInline(
    CONTENT_EXTRACTION_MODEL,
    '',
    prompt,
    b64,
    mime,
  );

  var draft = ContentExtraction_parseJson_(result.text || '');
  return {
    ok: true,
    file: { name: prepared.name, mimeType: prepared.mimeType },
    draft: draft,
  };
}

