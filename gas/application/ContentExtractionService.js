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
var CONTENT_ALLOWED_CLIENT_INDUSTRIES =
  typeof CLIENTS_ALLOWED_INDUSTRIES !== 'undefined'
    ? CLIENTS_ALLOWED_INDUSTRIES
    : [
        'Agencias de Turismo',
        'Logistica',
        'Agencias AeroEspaciales',
        'Aeropuertos',
        'Aerolineas',
      ];

/** @type {Object<string,string>} Etiquetas legibles por content_type para el prompt */
var CONTENT_EXTRACTION_TYPE_LABELS = {
  proposal: 'commercial proposal / RFP response / sales deck',
  success_case: 'success case / case study / customer story',
  client: 'client profile / account overview / CRM export',
  onboarding: 'onboarding / training / enablement material',
};

/**
 * @return {string}
 */
function ContentExtraction_getClientsHint_() {
  var rows = ClientsMasterStore_listAll();
  if (!rows.length) return '';
  var names = [];
  var i;
  for (i = 0; i < rows.length; i++) {
    var n = String(rows[i].client_name || '').trim();
    if (n) names.push(n);
  }
  if (!names.length) return '';
  names.sort(function (a, b) {
    return a.localeCompare(b);
  });
  var max = 80;
  if (names.length > max) {
    return (
      'KNOWN CLIENTS (use exact spelling when the document matches; do NOT invent variants): ' +
      names.slice(0, max).join(', ') +
      ' … and ' +
      String(names.length - max) +
      ' more.'
    );
  }
  return (
    'KNOWN CLIENTS (use exact spelling when the document matches; do NOT invent variants): ' +
    names.join(', ')
  );
}

/**
 * @param {string} fileName
 * @return {string}
 */
function ContentExtraction_titleFromFileName_(fileName) {
  var stem = String(fileName || '')
    .replace(/\.[^.]+$/i, '')
    .trim();
  if (!stem) return '';
  stem = stem.replace(/[_–—]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (/^(document|scan|file|untitled|propuesta|proposal|rfp|draft|borrador)$/i.test(stem)) {
    return '';
  }
  return stem;
}

/**
 * @param {string} rawName
 * @param {string} fileName
 * @return {{client_name:string, industry:string, matched:boolean}}
 */
function ContentExtraction_matchClient_(rawName, fileName) {
  var empty = {
    client_name: String(rawName || '').trim(),
    industry: '',
    matched: false,
  };
  var rows = ClientsMasterStore_listAll();
  if (!rows.length) return empty;

  var candidates = [];
  var raw = String(rawName || '').trim();
  if (raw) candidates.push(raw);

  var stem = String(fileName || '').replace(/\.[^.]+$/i, '');
  var segs = stem.split(/[\s_\-–—]+/);
  var si;
  for (si = 0; si < segs.length; si++) {
    var seg = String(segs[si] || '').trim();
    if (seg.length >= 2) candidates.push(seg);
  }
  if (segs.length >= 2) {
    candidates.push((String(segs[0] || '') + ' ' + String(segs[1] || '')).trim());
  }

  var seenC = {};
  var uniq = [];
  var ci;
  for (ci = 0; ci < candidates.length; ci++) {
    var key = ClientsMaster_normalizeName_(candidates[ci]);
    if (!key || seenC[key]) continue;
    seenC[key] = true;
    uniq.push(candidates[ci]);
  }

  for (ci = 0; ci < uniq.length; ci++) {
    var exact = ClientsMaster_findByName(uniq[ci]);
    if (exact) {
      return {
        client_name: exact.client_name,
        industry: String(exact.industry || '').trim(),
        matched: true,
      };
    }
  }

  var best = null;
  var bestScore = 0;
  var ri;
  for (ri = 0; ri < rows.length; ri++) {
    var client = ClientsMasterStore_toApiItem_(rows[ri]);
    var cn = ClientsMaster_normalizeName_(client.client_name);
    if (!cn || cn.length < 3) continue;
    for (var uj = 0; uj < uniq.length; uj++) {
      var cand = ClientsMaster_normalizeName_(uniq[uj]);
      if (!cand || cand.length < 3) continue;
      if (cand === cn) {
        return {
          client_name: client.client_name,
          industry: String(client.industry || '').trim(),
          matched: true,
        };
      }
      if (cand.indexOf(cn) >= 0 || cn.indexOf(cand) >= 0) {
        var score = Math.min(cand.length, cn.length) / Math.max(cand.length, cn.length);
        if (score > bestScore && score >= 0.6) {
          bestScore = score;
          best = client;
        }
      }
    }
  }
  if (best) {
    return {
      client_name: best.client_name,
      industry: String(best.industry || '').trim(),
      matched: true,
    };
  }
  return empty;
}

/**
 * @param {string} value
 * @param {Array<string>} allowed
 * @param {string=} fallback
 * @return {string}
 */
function ContentExtraction_normalizeEnum_(value, allowed, fallback) {
  var v = String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
  var i;
  for (i = 0; i < allowed.length; i++) {
    if (allowed[i] === v) return allowed[i];
  }
  var compact = v.replace(/_/g, '');
  for (i = 0; i < allowed.length; i++) {
    if (allowed[i].replace(/_/g, '') === compact) return allowed[i];
  }
  return fallback || '';
}

/**
 * @param {string} contentType
 * @param {Object} specific
 * @return {Object}
 */
function ContentExtraction_normalizeSpecific_(contentType, specific) {
  var sp = specific && typeof specific === 'object' ? specific : {};
  if (contentType === 'proposal') {
    sp.stage = ContentExtraction_normalizeEnum_(sp.stage, CONTENT_PROPOSAL_STAGES, 'PRESENTED');
    sp.pricing_model = ContentExtraction_normalizeEnum_(
      sp.pricing_model,
      CONTENT_PRICING_MODELS,
      'TIME_AND_MATERIALS',
    );
  }
  return sp;
}

/**
 * Post-procesa el draft del LLM: catálogo de clientes, título desde filename, enums.
 * @param {Object} parsed
 * @param {string} contentType
 * @param {string} fileName
 * @return {Object}
 */
function ContentExtraction_enrichDraft_(parsed, contentType, fileName) {
  var locale = UiStrings_activeLocale_();
  var common = parsed.common || {};
  var warnings = Array.isArray(parsed.warnings) ? parsed.warnings.slice() : [];

  if (!String(common.title || '').trim()) {
    var fromFile = ContentExtraction_titleFromFileName_(fileName);
    if (fromFile) {
      common.title = fromFile;
      warnings.push(UiStrings_t(locale, 'contents_warn_title_from_filename'));
    }
  }

  var clientMatch = ContentExtraction_matchClient_(common.client_name, fileName);
  if (clientMatch.matched) {
    if (
      String(common.client_name || '').trim() &&
      common.client_name !== clientMatch.client_name
    ) {
      warnings.push(UiStrings_t(locale, 'contents_warn_client_from_catalog'));
    } else if (!String(common.client_name || '').trim()) {
      warnings.push(UiStrings_t(locale, 'contents_warn_client_from_filename'));
    }
    common.client_name = clientMatch.client_name;
    if (!String(common.industry || '').trim() && clientMatch.industry) {
      common.industry = ClientsMaster_resolveIndustry_(clientMatch.industry);
    }
  }

  parsed.common = common;
  parsed.specific = ContentExtraction_normalizeSpecific_(contentType, parsed.specific || {});
  parsed.warnings = warnings;
  return parsed;
}

/**
 * @param {string} contentType
 * @param {{fileName?:string, clientsHint?:string}=} hints
 * @return {string}
 */
function ContentExtraction_promptForType_(contentType, hints) {
  hints = hints || {};
  var existingTags = ContentCatalog_getAllTags();
  var tagsHint = existingTags.length
    ? 'EXISTING TAGS (reuse these, do NOT create synonyms): ' + existingTags.join(', ')
    : '';
  var typeLabel = CONTENT_EXTRACTION_TYPE_LABELS[contentType] || contentType;
  var fileName = String(hints.fileName || '').trim();
  var clientsHint = String(hints.clientsHint || '').trim();

  var commonInstructions = [
    'Extract metadata for content type: ' + typeLabel + '.',
    fileName ? 'Original file name: "' + fileName + '". Use it as a hint when the document title or client is unclear.' : '',
    clientsHint,
    'Analyze the full document (cover, headers, footers, tables, logos, metadata blocks).',
    'Return ONLY valid JSON. No markdown fences, no comments outside JSON.',
    'If a value is missing or uncertain, use empty string and explain briefly in warnings[] (same language as the document).',
    'Set confidence to high only when title and client_name are clearly supported by the document.',
    'TAGS RULES:',
    '- Always in English',
    '- camelCase format (e.g. #dataAnalytics, #cloudMigration)',
    '- No spaces, no special chars except #',
    '- Reuse existing tags when meaning matches. Do NOT create synonyms.',
    '- Suggest 3-8 relevant tags when the document supports them.',
    tagsHint,
    'INDUSTRY RULES:',
    '- common.industry MUST be one of: ' + CONTENT_ALLOWED_CLIENT_INDUSTRIES.join(', '),
    '- No synonyms, no translations, no free text.',
    'Common structure:',
    '{"common":{"title":"","summary":"","client_name":"","industry":"","tags":[]},"specific":{},"confidence":"high|medium|low","warnings":[]}',
    'common.summary: 1-3 sentences describing the document purpose and scope.',
    'common.client_name: legal or commercial name of the customer/account when present.',
  ];
  if (contentType === 'proposal') {
    commonInstructions.push(
      'specific for proposal: {"stage":"","pricing_model":"","effort_estimate":"","timeline":"","win_probability":"","notes":""}',
      'stage MUST be one of: ' + CONTENT_PROPOSAL_STAGES.join(', ') + '. If unclear, use PRESENTED.',
      'pricing_model MUST be one of: ' + CONTENT_PRICING_MODELS.join(', ') + '. If unclear, use TIME_AND_MATERIALS.',
      'For proposal, common.industry is mandatory and MUST be one of the allowed values.',
      'effort_estimate and timeline: extract from SOW, staffing tables or commercial sections when available.',
    );
  } else if (contentType === 'success_case') {
    commonInstructions.push(
      'specific for success_case: {"challenge":"","solution":"","impact_metric":"","impact_value":"","evidence":"","notes":""}',
      'For success_case, common.industry is mandatory and MUST be one of the allowed values.',
      'impact_metric: name of KPI (e.g. cost reduction, NPS). impact_value: quantified result when stated.',
    );
  } else if (contentType === 'client') {
    commonInstructions.push(
      'specific for client: {"account_status":"","active_projects":"","health_score":"","renewal_date":"","notes":""}',
      'account_status: active, prospect, churned, etc. health_score: green/yellow/red or numeric if present.',
    );
  } else if (contentType === 'onboarding') {
    commonInstructions.push(
      'specific for onboarding: {"topic":"","category":"","audience":"","notes":""}',
      'topic: main concept or theme (e.g. PSS, NDC, loyalty). category: business/domain/concept/studio as fits. audience: who the material is for.',
    );
  } else {
    throw new Error('content_type invalido');
  }
  commonInstructions.push('Prioritize accuracy and traceability over completeness.');
  return commonInstructions.filter(function (line) {
    return !!line;
  }).join('\n');
}

/**
 * @return {string}
 */
function ContentExtraction_systemPrompt_() {
  return [
    'You are a metadata extraction specialist for Aviators, a B2B knowledge base for aviation, airlines, airports, logistics and related industries.',
    'You receive business documents (often PDF) and extract structured catalog fields.',
    'Be conservative: never invent client names, dates, or metrics not supported by the document.',
    'Return ONLY valid JSON as requested. No markdown.',
  ].join('\n');
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

  var prompt = ContentExtraction_promptForType_(contentType, {
    fileName: prepared.name,
    clientsHint: ContentExtraction_getClientsHint_(),
  });
  var b64 = payload.dataBase64 || '';
  var mime = prepared.mimeType || 'application/pdf';

  var result = client.chatWithFileInline(
    CONTENT_EXTRACTION_MODEL,
    ContentExtraction_systemPrompt_(),
    prompt,
    b64,
    mime,
  );

  var draft = ContentExtraction_parseJson_(result.text || '');
  draft = ContentExtraction_enrichDraft_(draft, contentType, prepared.name);
  return {
    ok: true,
    file: { name: prepared.name, mimeType: prepared.mimeType },
    draft: draft,
  };
}

