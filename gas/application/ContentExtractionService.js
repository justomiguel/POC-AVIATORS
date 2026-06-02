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
 * @param {*} value
 * @return {string}
 */
function ContentExtraction_valueToText_(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value).trim();
  if (Array.isArray(value)) {
    var parts = [];
    var i;
    for (i = 0; i < value.length; i++) {
      var part = ContentExtraction_valueToText_(value[i]);
      if (part) parts.push(part);
    }
    return parts.join('\n').trim();
  }
  if (typeof value === 'object') {
    return ContentExtraction_pickString_(value, [
      'text',
      'value',
      'content',
      'description',
      'body',
      'summary',
    ]);
  }
  return String(value).trim();
}

/**
 * @param {Object} obj
 * @param {Array<string>} keys
 * @return {string}
 */
function ContentExtraction_pickString_(obj, keys) {
  if (!obj || typeof obj !== 'object') return '';
  var i;
  for (i = 0; i < keys.length; i++) {
    var v = ContentExtraction_valueToText_(obj[keys[i]]);
    if (v) return v;
  }
  return '';
}

/**
 * Unifica `specific` cuando el LLM anida campos o los deja fuera del objeto.
 * @param {Object} parsed
 * @param {string} contentType
 * @return {Object}
 */
function ContentExtraction_resolveSpecific_(parsed, contentType) {
  if (!parsed || typeof parsed !== 'object') return {};
  var specific = parsed.specific;
  if (typeof specific === 'string') {
    var trimmed = specific.trim();
    if (trimmed.charAt(0) === '{') {
      try {
        specific = JSON.parse(trimmed);
      } catch (ignoreParse) {
        specific = {};
      }
    } else {
      specific = {};
    }
  }
  if (!specific || typeof specific !== 'object' || Array.isArray(specific)) {
    specific = {};
  }

  var nestedKeys = [contentType, 'success_case', 'successCase', 'SuccessCase'];
  var ni;
  for (ni = 0; ni < nestedKeys.length; ni++) {
    var nested = specific[nestedKeys[ni]];
    if (!nested || typeof nested !== 'object' || Array.isArray(nested)) continue;
    var nk;
    for (nk in nested) {
      if (!Object.prototype.hasOwnProperty.call(nested, nk)) continue;
      if (specific[nk] == null || specific[nk] === '') specific[nk] = nested[nk];
    }
  }

  if (contentType === 'success_case') {
    var hoistKeys = [
      'challenge',
      'solution',
      'impact_metric',
      'impact_value',
      'evidence',
      'notes',
      'impact',
      'impacto',
      'desafio',
      'desafío',
      'reto',
      'solucion',
      'solución',
    ];
    var hi;
    for (hi = 0; hi < hoistKeys.length; hi++) {
      var hk = hoistKeys[hi];
      if (parsed[hk] != null && (specific[hk] == null || specific[hk] === '')) {
        specific[hk] = parsed[hk];
      }
    }
  }

  parsed.specific = specific;
  return specific;
}

/**
 * Combina métrica + valor para mostrar/guardar cuando el LLM los separa.
 * @param {string} metric
 * @param {string} value
 * @return {string}
 */
function ContentExtraction_formatImpactDisplay_(metric, value) {
  var m = String(metric || '').trim();
  var v = String(value || '').trim();
  if (m && v) {
    if (v.toLowerCase().indexOf(m.toLowerCase()) >= 0) return v;
    return m + ': ' + v;
  }
  return v || m;
}

/**
 * Normaliza claves alternativas (ES/EN) y campos partidos del LLM en success cases.
 * @param {Object} specific
 * @return {Object}
 */
function ContentExtraction_normalizeSuccessCaseSpecific_(specific) {
  var sp = specific && typeof specific === 'object' ? specific : {};
  var out = {
    challenge: ContentExtraction_pickString_(sp, [
      'challenge',
      'Challenge',
      'desafio',
      'desafío',
      'reto',
      'problem',
      'context',
      'contexto',
      'situation',
      'business_challenge',
    ]),
    solution: ContentExtraction_pickString_(sp, [
      'solution',
      'Solution',
      'solucion',
      'solución',
      'approach',
      'what_we_did',
      'delivery',
      'implementation',
    ]),
    impact_metric: ContentExtraction_pickString_(sp, [
      'impact_metric',
      'impactMetric',
      'kpi',
      'metric',
      'metrica',
      'métrica',
    ]),
    impact_value: ContentExtraction_pickString_(sp, [
      'impact_value',
      'impactValue',
      'impact',
      'impacto',
      'results',
      'resultados',
      'outcome',
      'value',
      'benefits',
      'beneficios',
    ]),
    evidence: ContentExtraction_pickString_(sp, [
      'evidence',
      'proof',
      'evidencia',
      'testimonial',
      'quote',
      'citation',
    ]),
    notes: ContentExtraction_pickString_(sp, ['notes', 'notas', 'comments', 'other']),
  };

  if (!out.challenge) {
    out.challenge = ContentExtraction_pickString_(sp, ['summary', 'resumen', 'background']);
  }

  out.impact_value = ContentExtraction_formatImpactDisplay_(out.impact_metric, out.impact_value);

  if (out.evidence && out.notes && out.notes.indexOf(out.evidence) < 0) {
    out.notes = out.notes + '\n\n' + out.evidence;
  } else if (out.evidence && !out.notes) {
    out.notes = out.evidence;
  }

  return out;
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
    return sp;
  }
  if (contentType === 'success_case') {
    return ContentExtraction_normalizeSuccessCaseSpecific_(sp);
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

  if (contentType === 'success_case') {
    var spEnriched = parsed.specific || {};
    var summaryText = String(common.summary || '').trim();
    if (
      summaryText &&
      !String(spEnriched.challenge || '').trim() &&
      !String(spEnriched.solution || '').trim()
    ) {
      spEnriched.challenge = summaryText;
      parsed.specific = spEnriched;
      warnings.push(UiStrings_t(locale, 'contents_warn_challenge_from_summary'));
    }
  }

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
      'SUCCESS CASE FIELD RULES (use exact JSON keys above):',
      '- challenge: 2-5 sentences — business problem, pain points, context BEFORE the project. Look for sections titled Challenge, Reto, Desafío, Context, Situación, Problem.',
      '- solution: 2-5 sentences — what Globant/the team delivered, approach, technologies, scope. Look for Solution, Solución, Approach, What we did, Our response.',
      '- impact_metric: KPI name only (e.g. "cost reduction", "time to market", "NPS").',
      '- impact_value: quantified outcome (e.g. "30%", "$2M saved", "6 months faster"). Include numbers when present.',
      '- evidence: quotes, awards, client testimonial, or proof points if stated.',
      '- notes: anything else relevant not captured above.',
      'Do NOT put challenge/solution text in common.summary only — they belong in specific.challenge and specific.solution.',
      'Documents may be in Spanish or English; always output JSON keys in English as specified.',
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
  ContentExtraction_resolveSpecific_(parsed, String(parsed.common.content_type || '').trim());
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

/** @type {Array<string>} Pasadas de extracción para success cases (PDF reenviado en cada una). */
var CONTENT_SUCCESS_CASE_PASSES = ['common', 'challenge', 'solution', 'impact'];

/**
 * @param {string} text
 * @return {Object}
 */
function ContentExtraction_parseLooseJson_(text) {
  var raw = String(text || '').trim();
  if (!raw) return {};
  var start = raw.indexOf('{');
  if (start < 0) return {};
  var end = ContentExtraction_findJsonEnd_(raw, start);
  if (end < 0) return {};
  try {
    var parsed = JSON.parse(raw.substring(start, end + 1));
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (ignoreParse) {
    return {};
  }
}

/**
 * @param {GlobantAssistantApiClient} client
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {string} b64
 * @param {string} mime
 * @return {{text:string}}
 */
function ContentExtraction_chatFilePass_(client, systemPrompt, userPrompt, b64, mime) {
  return client.chatWithFileInline(
    CONTENT_EXTRACTION_MODEL,
    systemPrompt,
    userPrompt,
    b64,
    mime,
  );
}

/**
 * @param {string} passId
 * @param {{fileName?:string, clientsHint?:string}=} hints
 * @return {string}
 */
function ContentExtraction_promptSuccessCasePass_(passId, hints) {
  hints = hints || {};
  var fileName = String(hints.fileName || '').trim();
  var clientsHint = String(hints.clientsHint || '').trim();
  var fileHint = fileName
    ? 'Original file name: "' + fileName + '". Use as hint for title/client when unclear.\n'
    : '';

  if (passId === 'common') {
    var existingTags = ContentCatalog_getAllTags();
    var tagsHint = existingTags.length
      ? 'EXISTING TAGS (reuse, no synonyms): ' + existingTags.join(', ')
      : '';
    return [
      'Extract COMMON catalog metadata from this success case / case study PDF.',
      fileHint,
      clientsHint,
      'Read cover, headers, footers, logos, tables, and metadata blocks.',
      'Return ONLY valid JSON. No markdown.',
      tagsHint,
      'INDUSTRY must be one of: ' + CONTENT_ALLOWED_CLIENT_INDUSTRIES.join(', '),
      'Schema:',
      '{"common":{"title":"","summary":"","client_name":"","industry":"","tags":[]},"confidence":"high|medium|low","warnings":[]}',
      'common.summary: 1-3 sentences — document purpose only (NOT challenge/solution detail).',
      'Do NOT extract challenge, solution, or impact here — other passes handle those.',
    ]
      .filter(function (line) {
        return !!line;
      })
      .join('\n');
  }

  if (passId === 'challenge') {
    return [
      'Extract ONLY the business CHALLENGE from this success case PDF.',
      fileHint,
      'Search the FULL document including slides, sidebars, callouts, and two-column layouts.',
      'Section titles to look for (any language):',
      'Challenge, Reto, Desafío, Desafio, Problem, Context, Contexto, Situation, Situación, Background,',
      'Need, Pain points, Objetivo, Business challenge, The client faced, El cliente enfrentaba.',
      'Return ONLY valid JSON:',
      '{"challenge":"<2-6 sentences from the document>","confidence":"high|medium|low","warnings":[]}',
      'Rules:',
      '- challenge MUST describe the problem/context BEFORE the project — not the solution or results.',
      '- Do NOT leave challenge empty if any section describes the client problem or pain points.',
      '- Use the document language (Spanish or English). Quote or paraphrase faithfully; do not invent.',
      '- If truly absent, use "" and explain in warnings[].',
    ].join('\n');
  }

  if (passId === 'solution') {
    return [
      'Extract ONLY the SOLUTION from this success case PDF.',
      fileHint,
      'Search the FULL document including slides, sidebars, callouts, and two-column layouts.',
      'Section titles to look for (any language):',
      'Solution, Solución, Solucion, Approach, What we did, Lo que hicimos, Our response,',
      'Delivery, Implementation, Scope, How we helped, Services, Technologies, Equipo.',
      'Return ONLY valid JSON:',
      '{"solution":"<2-6 sentences from the document>","confidence":"high|medium|low","warnings":[]}',
      'Rules:',
      '- solution MUST describe what Globant/the team delivered — approach, scope, technologies.',
      '- Do NOT leave solution empty if any section describes the work done or approach.',
      '- Do NOT repeat the challenge or impact/results here.',
      '- Use the document language. Quote or paraphrase faithfully; do not invent.',
      '- If truly absent, use "" and explain in warnings[].',
    ].join('\n');
  }

  if (passId === 'impact') {
    return [
      'Extract IMPACT, RESULTS, and supplementary notes from this success case PDF.',
      fileHint,
      'Search for: Impact, Impacto, Results, Resultados, Outcomes, Benefits, Beneficios, KPI, Metrics,',
      'Métricas, Value, ROI, testimonial quotes, awards, proof points.',
      'Return ONLY valid JSON:',
      '{"impact_metric":"","impact_value":"","evidence":"","notes":"","confidence":"high|medium|low","warnings":[]}',
      'Field rules:',
      '- impact_metric: KPI name only (e.g. "cost reduction", "time to market", "NPS").',
      '- impact_value: quantified outcome with numbers when present (e.g. "30%", "$2M", "6 months faster").',
      '- evidence: client quotes, awards, testimonials, or proof points if stated.',
      '- notes: other relevant facts not captured above.',
      '- Prefer filling impact_value from bullet lists and stat callouts in the PDF.',
      '- Use document language. Do not invent metrics.',
    ].join('\n');
  }

  throw new Error('success_case pass invalido');
}

/**
 * @param {string} passId
 * @return {string}
 */
function ContentExtraction_systemPromptForPass_(passId) {
  if (passId === 'common') {
    return ContentExtraction_systemPrompt_();
  }
  return [
    'You are a precision extractor for Aviators success case documents (aviation, airlines, airports, logistics).',
    'You receive a PDF and extract ONE focused field group only.',
    'Read every page. Follow section headers and visual layout.',
    'Return ONLY valid JSON as requested. No markdown.',
    'Never invent facts not supported by the document.',
  ].join('\n');
}

/**
 * @param {string} passId
 * @param {Object} parsed
 * @param {Object} draft
 * @param {string} locale
 */
function ContentExtraction_mergeSuccessCasePass_(passId, parsed, draft, locale) {
  var warnings = draft.warnings || [];
  var conf = String(parsed.confidence || '').toLowerCase();

  if (passId === 'common') {
    var commonIn =
      parsed.common && typeof parsed.common === 'object' ? parsed.common : parsed;
    var commonOut = draft.common || {};
    var commonKeys = ['title', 'summary', 'client_name', 'industry', 'tags'];
    var cki;
    for (cki = 0; cki < commonKeys.length; cki++) {
      var ckey = commonKeys[cki];
      if (!Object.prototype.hasOwnProperty.call(commonIn, ckey)) continue;
      if (ckey === 'tags' && Array.isArray(commonIn.tags)) {
        commonOut.tags = ContentExtraction_normalizeTags_(commonIn.tags);
      } else if (commonIn[ckey] != null && String(commonIn[ckey]).trim()) {
        commonOut[ckey] = commonIn[ckey];
      }
    }
    draft.common = commonOut;
    if (conf === 'high' || conf === 'medium') draft.confidence = conf;
  } else {
    var specific = draft.specific || {};
    if (passId === 'challenge') {
      var ch = ContentExtraction_valueToText_(parsed.challenge);
      if (ch) specific.challenge = ch;
    } else if (passId === 'solution') {
      var sol = ContentExtraction_valueToText_(parsed.solution);
      if (sol) specific.solution = sol;
    } else if (passId === 'impact') {
      var im = ContentExtraction_valueToText_(parsed.impact_metric);
      var iv = ContentExtraction_valueToText_(parsed.impact_value);
      var ev = ContentExtraction_valueToText_(parsed.evidence);
      var nt = ContentExtraction_valueToText_(parsed.notes);
      if (im) specific.impact_metric = im;
      if (iv) specific.impact_value = iv;
      if (ev) specific.evidence = ev;
      if (nt) specific.notes = nt;
    }
    draft.specific = specific;
  }

  if (Array.isArray(parsed.warnings)) {
    var wi;
    for (wi = 0; wi < parsed.warnings.length; wi++) {
      var w = String(parsed.warnings[wi] || '').trim();
      if (w) warnings.push(w);
    }
  }

  draft.warnings = warnings;
}

/**
 * @param {string} contentType
 * @return {Object}
 */
function ContentExtraction_emptyDraft_(contentType) {
  if (contentType === 'success_case') {
    return {
      common: { title: '', summary: '', client_name: '', industry: '', tags: [] },
      specific: {
        challenge: '',
        solution: '',
        impact_metric: '',
        impact_value: '',
        evidence: '',
        notes: '',
      },
      confidence: 'low',
      warnings: [],
    };
  }
  return { common: {}, specific: {}, confidence: 'low', warnings: [] };
}

/**
 * @param {string} draftJson
 * @param {string} contentType
 * @return {Object}
 */
function ContentExtraction_parseDraftState_(draftJson, contentType) {
  var raw = String(draftJson || '').trim();
  if (!raw) return ContentExtraction_emptyDraft_(contentType);
  try {
    var parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed;
  } catch (ignoreDraft) {
    // fall through
  }
  return ContentExtraction_emptyDraft_(contentType);
}

/**
 * @param {string} contentType
 * @return {Array<string>}
 */
function ContentExtraction_listPassIds_(contentType) {
  if (contentType === 'success_case') return CONTENT_SUCCESS_CASE_PASSES.slice();
  return [];
}

/**
 * Una pasada de extracción success_case (LLM + merge en draft).
 * @param {Object} client
 * @param {string} b64
 * @param {string} mime
 * @param {{fileName?:string, clientsHint?:string}} hints
 * @param {string} passId
 * @param {Object} draft
 * @param {string} locale
 */
function ContentExtraction_runSuccessCasePass_(client, b64, mime, hints, passId, draft, locale) {
  try {
    var prompt = ContentExtraction_promptSuccessCasePass_(passId, hints);
    var systemPrompt = ContentExtraction_systemPromptForPass_(passId);
    var result = ContentExtraction_chatFilePass_(client, systemPrompt, prompt, b64, mime);
    var parsed = ContentExtraction_parseLooseJson_(result.text || '');
    if (!parsed || !Object.keys(parsed).length) {
      draft.warnings.push(
        UiStrings_fmt_('contents_warn_extraction_pass_empty', { pass: passId }),
      );
      return;
    }
    ContentExtraction_mergeSuccessCasePass_(passId, parsed, draft, locale);
  } catch (ePass) {
    console.log(
      '[CONTENT-EXTRACT] success_case pass failed: ' +
        passId +
        ' — ' +
        String(ePass.message || ePass).slice(0, 200),
    );
    draft.warnings.push(
      UiStrings_fmt_('contents_warn_extraction_pass_failed', {
        pass: passId,
        detail: String(ePass.message || ePass).slice(0, 120),
      }),
    );
  }
}

/**
 * Extracción multi-pasada para success cases: common + challenge + solution + impact.
 * @param {Object} client
 * @param {string} b64
 * @param {string} mime
 * @param {{fileName?:string, clientsHint?:string}} hints
 * @return {Object}
 */
function ContentExtraction_extractSuccessCaseMultiPass_(client, b64, mime, hints) {
  var locale = UiStrings_activeLocale_();
  var draft = ContentExtraction_emptyDraft_('success_case');
  var pi;
  for (pi = 0; pi < CONTENT_SUCCESS_CASE_PASSES.length; pi++) {
    ContentExtraction_runSuccessCasePass_(
      client,
      b64,
      mime,
      hints,
      CONTENT_SUCCESS_CASE_PASSES[pi],
      draft,
      locale,
    );
  }
  return draft;
}

/**
 * Ejecuta una pasada de extracción (success_case) o devuelve plan vacío si no aplica.
 * @param {string} payloadJson {name, mimeType, dataBase64}
 * @param {string} contentType
 * @param {string} passId common|challenge|solution|impact
 * @param {string} draftJson estado acumulado (vacío en la primera pasada)
 * @return {{ok:boolean, file:Object, draft:Object, passId:string, passIndex:number, passTotal:number, extractionComplete:boolean}}
 */
function ContentExtraction_extractPass(payloadJson, contentType, passId, draftJson) {
  ContentCatalog_requireContributor_();
  var type = String(contentType || '').trim();
  var pid = String(passId || '').trim();
  if (type !== 'success_case') {
    throw new Error('ERR_CONTENT_EXTRACT_PASS_TYPE');
  }
  var passIndex = CONTENT_SUCCESS_CASE_PASSES.indexOf(pid);
  if (passIndex < 0) throw new Error('ERR_CONTENT_EXTRACT_PASS_INVALID');

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

  var b64 = payload.dataBase64 || '';
  var mime = prepared.mimeType || 'application/pdf';
  var hints = {
    fileName: prepared.name,
    clientsHint: ContentExtraction_getClientsHint_(),
  };
  var locale = UiStrings_activeLocale_();
  var draft = ContentExtraction_parseDraftState_(draftJson, type);

  ContentExtraction_runSuccessCasePass_(client, b64, mime, hints, pid, draft, locale);

  var isLast = passIndex === CONTENT_SUCCESS_CASE_PASSES.length - 1;
  if (isLast) {
    if (draft.common && typeof draft.common === 'object') {
      draft.common.content_type = type;
    }
    ContentExtraction_resolveSpecific_(draft, type);
    draft = ContentExtraction_enrichDraft_(draft, type, prepared.name);
  }

  return {
    ok: true,
    file: { name: prepared.name, mimeType: prepared.mimeType },
    draft: draft,
    passId: pid,
    passIndex: passIndex,
    passTotal: CONTENT_SUCCESS_CASE_PASSES.length,
    extractionComplete: isLast,
  };
}

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

  var b64 = payload.dataBase64 || '';
  var mime = prepared.mimeType || 'application/pdf';
  var hints = {
    fileName: prepared.name,
    clientsHint: ContentExtraction_getClientsHint_(),
  };

  var draft;
  if (contentType === 'success_case') {
    draft = ContentExtraction_extractSuccessCaseMultiPass_(client, b64, mime, hints);
    if (draft.common && typeof draft.common === 'object') {
      draft.common.content_type = contentType;
    }
    ContentExtraction_resolveSpecific_(draft, contentType);
    draft = ContentExtraction_enrichDraft_(draft, contentType, prepared.name);
  } else {
    var prompt = ContentExtraction_promptForType_(contentType, hints);
    var result = ContentExtraction_chatFilePass_(
      client,
      ContentExtraction_systemPrompt_(),
      prompt,
      b64,
      mime,
    );
    draft = ContentExtraction_parseJson_(result.text || '');
    if (draft.common && typeof draft.common === 'object') {
      draft.common.content_type = contentType;
    }
    ContentExtraction_resolveSpecific_(draft, contentType);
    draft = ContentExtraction_enrichDraft_(draft, contentType, prepared.name);
  }

  return {
    ok: true,
    file: { name: prepared.name, mimeType: prepared.mimeType },
    draft: draft,
  };
}

