/**
 * @fileoverview Extraccion de metadata desde un archivo (Globant /v1/files + /v1/assistant/chat).
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

/** Máximo de tags por documento (nube de tags). */
var CONTENT_TAGS_MAX = 16;

/** @type {Object<string,string>} */
var CONTENT_INDUSTRY_TAG_MAP_ = {
  Logistica: '#logistics',
  'Agencias de Turismo': '#travelAgencies',
  'Agencias AeroEspaciales': '#aerospace',
  Aeropuertos: '#airports',
};

/** @type {Object<string,string>} */
var CONTENT_TYPE_TAG_MAP_ = {
  success_case: '#successCase',
  proposal: '#commercialProposal',
  client: '#clientProfile',
  onboarding: '#onboarding',
};

/**
 * @param {string} raw
 * @return {string} clave estable sin #
 */
function ContentExtraction_tagKey_(raw) {
  return String(raw || '')
    .replace(/^#+/, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();
}

/**
 * @param {string} raw
 * @return {string} #camelCase o ''
 */
function ContentExtraction_toCamelTag_(raw) {
  var s = String(raw || '')
    .replace(/^#+/, '')
    .trim()
    .replace(/[^a-zA-Z0-9\s\-_]/g, ' ');
  if (!s) return '';
  var parts = s.split(/[\s\-_]+/);
  var words = [];
  var i;
  for (i = 0; i < parts.length; i++) {
    var p = String(parts[i] || '').trim();
    if (p.length >= 1) words.push(p);
  }
  if (!words.length) return '';
  var camel = words[0].toLowerCase();
  for (i = 1; i < words.length; i++) {
    var w = words[i].toLowerCase();
    if (!w) continue;
    camel += w.charAt(0).toUpperCase() + w.slice(1);
  }
  if (camel.length < 2) return '';
  return '#' + camel;
}

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
    var t = ContentExtraction_toCamelTag_(tags[i]);
    if (!t) continue;
    var key = ContentExtraction_tagKey_(t);
    if (!key || seen[key]) continue;
    seen[key] = true;
    out.push(t);
  }
  return out;
}

/**
 * @return {Object<string,string>} tagKey → display #tag (catálogo)
 */
function ContentExtraction_buildCatalogTagIndex_() {
  var index = {};
  var addDisplay = function (raw) {
    var display = ContentExtraction_toCamelTag_(raw);
    if (!display) return;
    index[ContentExtraction_tagKey_(display)] = display;
  };
  var cloud = [];
  try {
    cloud = ContentCatalog_getTagsCloud_();
  } catch (ignoreCloud) {
    cloud = [];
  }
  var ci;
  for (ci = 0; ci < cloud.length; ci++) {
    addDisplay(cloud[ci].tag);
  }
  var controlled = [];
  try {
    controlled = ContentCatalog_getControlledTags();
  } catch (ignoreCtrl) {
    controlled = [];
  }
  for (ci = 0; ci < controlled.length; ci++) {
    addDisplay(controlled[ci]);
  }
  var aliases = {};
  try {
    aliases = ContentCatalog_getTagAliasIndex_();
  } catch (ignoreAlias) {
    aliases = {};
  }
  var ak;
  for (ak in aliases) {
    if (!aliases.hasOwnProperty(ak)) continue;
    index[ak] = aliases[ak];
    addDisplay(aliases[ak]);
  }
  return index;
}

/**
 * Si un tag nuevo es casi igual a uno del catálogo, usa el del catálogo (cohesión nube).
 * @param {string} tag
 * @param {Object<string,string>} catalogIndex
 * @return {string}
 */
function ContentExtraction_preferCatalogTag_(tag, catalogIndex) {
  var normalized = ContentExtraction_toCamelTag_(tag);
  if (!normalized) return '';
  var key = ContentExtraction_tagKey_(normalized);
  if (catalogIndex[key]) return catalogIndex[key];

  var best = '';
  var bestScore = 0;
  var ck;
  for (ck in catalogIndex) {
    if (!catalogIndex.hasOwnProperty(ck)) continue;
    var score = 0;
    if (key === ck) return catalogIndex[ck];
    if (key.indexOf(ck) >= 0 || ck.indexOf(key) >= 0) {
      score =
        Math.min(key.length, ck.length) / Math.max(key.length, ck.length);
    } else if (typeof ClientsMaster_nameMatchScore_ === 'function') {
      score = ClientsMaster_nameMatchScore_(key, ck);
    }
    if (score > bestScore && score >= 0.82) {
      bestScore = score;
      best = catalogIndex[ck];
    }
  }
  return best || normalized;
}

/**
 * @param {Array<string>} tags
 * @param {Object<string,string>} catalogIndex
 * @return {Array<string>}
 */
function ContentExtraction_alignTagsToCatalog_(tags, catalogIndex) {
  var out = [];
  var seen = {};
  var i;
  for (i = 0; i < tags.length; i++) {
    var aligned = ContentExtraction_preferCatalogTag_(tags[i], catalogIndex);
    if (!aligned) continue;
    var k = ContentExtraction_tagKey_(aligned);
    if (seen[k]) continue;
    seen[k] = true;
    out.push(aligned);
  }
  return out;
}

/**
 * @return {string}
 */
function ContentExtraction_getTagsHintForPrompt_() {
  var cloud = [];
  try {
    cloud = ContentCatalog_getTagsCloud_();
  } catch (ignoreCloud) {
    return '';
  }
  if (!cloud.length) return '';
  var top = cloud.slice(0, 55);
  var parts = [];
  var i;
  for (i = 0; i < top.length; i++) {
    parts.push(String(top[i].tag || '') + '(' + String(top[i].count || 0) + ')');
  }
  return 'FREQUENT CATALOG TAGS (reuse when meaning matches; counts help the tag cloud): ' + parts.join(', ');
}

/**
 * @param {string} contentType
 * @return {string}
 */
function ContentExtraction_buildTagPromptBlock_(contentType) {
  var minTags = contentType === 'success_case' ? 8 : 5;
  var maxTags = contentType === 'success_case' ? 14 : 10;
  return [
    'TAG STRATEGY — tags feed the Aviators tag cloud (search, filters, discovery). Be thoughtful and varied.',
    'Output ' + minTags + '-' + maxTags + ' tags in common.tags when the document supports them.',
    'Mix several DIMENSIONS (English camelCase, leading # only):',
    '- Capability: #customerExperience, #dataAnalytics, #applicationModernization, #enterpriseIntegration, #cybersecurity',
    '- Technology: #cloudComputing, #generativeAI, #machineLearning, #sap, #salesforce, #apiFirst, #microservices',
    '- Aviation domain: #aviation, #airlines, #airports, #cargo, #groundHandling, #loyalty, #ancillaries, #ndc, #pss, #dcs, #revenueManagement',
    '- Engagement: #staffAugmentation, #fixedPrice, #timeAndMaterials, #discovery, #mvp, #transformationProgram',
    '- Outcome: #costReduction, #revenueGrowth, #timeToMarket, #operationalEfficiency, #customerSatisfaction, #automation',
    '- Geography or segment (only if explicit): #latam, #emea, #enterprise, #lowCostCarrier',
    'Rules:',
    '- REUSE a FREQUENT CATALOG TAG when the meaning matches (keeps the cloud cohesive).',
    '- Only add a NEW tag when no catalog/alias tag fits; prefer an existing tag over inventing a synonym.',
    '- No duplicate synonyms (#analytics vs #dataAnalytics — pick the catalog one). No filler (#document, #pdf, #business).',
    '- Scan logos, tech stacks, chapter titles, KPI callouts, and methodology boxes for tag ideas.',
    ContentExtraction_getTagsHintForPrompt_(),
  ]
    .filter(function (line) {
      return !!line;
    })
    .join('\n');
}

/**
 * @param {string} blob
 * @return {Array<string>}
 */
function ContentExtraction_inferTagsFromText_(blob) {
  var text = String(blob || '');
  if (!text) return [];
  /** @type {Array<{re:RegExp, tag:string}>} */
  var rules = [
    { re: /\b(cloud|aws|azure|gcp|kubernetes|k8s|serverless|microservices?)\b/i, tag: '#cloudComputing' },
    { re: /\b(gen(?:erative)?\s*ai|llm|chatgpt|copilot|rag|vector\s*search)\b/i, tag: '#generativeAI' },
    { re: /\b(machine\s*learning|mlops|predictive\s*analytics)\b/i, tag: '#machineLearning' },
    { re: /\b(data\s*(?:lake|warehouse|platform|analytics)|bi\b|snowflake|databricks)\b/i, tag: '#dataAnalytics' },
    { re: /\b(sap|s\/4hana|erp)\b/i, tag: '#sap' },
    { re: /\b(salesforce|crm)\b/i, tag: '#salesforce' },
    { re: /\b(ndc|new\s*distribution\s*capability)\b/i, tag: '#ndc' },
    { re: /\b(pss|passenger\s*service\s*system)\b/i, tag: '#pss' },
    { re: /\b(dcs|departure\s*control)\b/i, tag: '#dcs' },
    { re: /\b(loyalty|frequent\s*flyer|miles)\b/i, tag: '#loyalty' },
    { re: /\b(ancillar(?:y|ies)|merchandising)\b/i, tag: '#ancillaries' },
    { re: /\b(cargo|freight|logistics|supply\s*chain)\b/i, tag: '#cargo' },
    { re: /\b(airport|ground\s*handling|aeropuerto)\b/i, tag: '#airports' },
    { re: /\b(airline|aerolinea|aerolínea|carrier)\b/i, tag: '#airlines' },
    { re: /\b(mobile|app\s*store|ios|android)\b/i, tag: '#mobile' },
    { re: /\b(devops|ci\/cd|platform\s*engineering)\b/i, tag: '#devops' },
    { re: /\b(cyber|security|soc\b|zero\s*trust)\b/i, tag: '#cybersecurity' },
    { re: /\b(customer\s*experience|cx\b|passenger\s*experience)\b/i, tag: '#customerExperience' },
    { re: /\b(cost\s*reduc|ahorro|opex|efficienc)/i, tag: '#costReduction' },
    { re: /\b(time\s*to\s*market|go-?live|faster\s*launch)/i, tag: '#timeToMarket' },
    { re: /\b(digital\s*transform|moderniz)/i, tag: '#digitalTransformation' },
    { re: /\b(staff\s*aug|time\s*and\s*materials|t&m)\b/i, tag: '#staffAugmentation' },
    { re: /\b(fixed\s*price|fixed\s*bid)\b/i, tag: '#fixedPrice' },
    { re: /\b(rfp|tender|propuesta|proposal)\b/i, tag: '#commercialProposal' },
    { re: /\b(success\s*case|caso\s*de\s*(?:éxito|exito))\b/i, tag: '#successCase' },
  ];
  var out = [];
  var seen = {};
  var ri;
  for (ri = 0; ri < rules.length; ri++) {
    if (!rules[ri].re.test(text)) continue;
    var k = ContentExtraction_tagKey_(rules[ri].tag);
    if (seen[k]) continue;
    seen[k] = true;
    out.push(rules[ri].tag);
  }
  return out;
}

/**
 * @param {string} contentType
 * @param {Object} common
 * @param {Object} specific
 * @return {Array<string>}
 */
function ContentExtraction_inferTagsFromDraft_(contentType, common, specific) {
  var parts = [
    String(common.title || ''),
    String(common.summary || ''),
  ];
  if (ContentExtraction_usesClientMetadata_(contentType)) {
    parts.push(String(common.client_name || ''), String(common.industry || ''));
  }
  parts.push(
    String(specific.challenge || ''),
    String(specific.solution || ''),
    String(specific.impact_metric || ''),
    String(specific.impact_value || ''),
    String(specific.evidence || ''),
    String(specific.notes || ''),
    String(specific.stage || ''),
    String(specific.pricing_model || ''),
    String(specific.topic || ''),
  );
  var inferred = ContentExtraction_inferTagsFromText_(parts.join('\n'));

  var typeTag = CONTENT_TYPE_TAG_MAP_[contentType];
  if (typeTag) inferred.push(typeTag);

  if (ContentExtraction_usesClientMetadata_(contentType)) {
    var ind = String(common.industry || '').trim();
    if (ind && CONTENT_INDUSTRY_TAG_MAP_[ind]) inferred.push(CONTENT_INDUSTRY_TAG_MAP_[ind]);
  }

  if (contentType === 'proposal') {
    var stage = String(specific.stage || '').trim().toUpperCase();
    if (stage === 'WIN') inferred.push('#win');
    if (stage === 'NEGOTIATION') inferred.push('#negotiation');
    var pm = String(specific.pricing_model || '').trim();
    if (pm === 'TIME_AND_MATERIALS') inferred.push('#timeAndMaterials');
    if (pm === 'FIXED_PRICE') inferred.push('#fixedPrice');
    if (pm === 'STAFF_AUGMENTATION') inferred.push('#staffAugmentation');
  }

  return ContentExtraction_normalizeTags_(inferred);
}

/**
 * Combina tags del LLM + heurísticas y alinea al catálogo para la nube.
 * @param {Array<string>} llmTags
 * @param {string} contentType
 * @param {Object} common
 * @param {Object} specific
 * @return {{tags:Array<string>, supplemented:boolean}}
 */
function ContentExtraction_enrichTags_(llmTags, contentType, common, specific) {
  var catalogIndex = ContentExtraction_buildCatalogTagIndex_();
  var merged = ContentExtraction_alignTagsToCatalog_(
    ContentExtraction_normalizeTags_(llmTags || []),
    catalogIndex,
  );
  var llmCount = merged.length;

  var inferred = ContentExtraction_inferTagsFromDraft_(contentType, common, specific);
  var inferredAligned = ContentExtraction_alignTagsToCatalog_(inferred, catalogIndex);

  var seen = {};
  var out = [];
  var i;
  for (i = 0; i < merged.length; i++) {
    var k = ContentExtraction_tagKey_(merged[i]);
    if (seen[k]) continue;
    seen[k] = true;
    out.push(merged[i]);
  }
  for (i = 0; i < inferredAligned.length; i++) {
    if (out.length >= CONTENT_TAGS_MAX) break;
    var ik = ContentExtraction_tagKey_(inferredAligned[i]);
    if (seen[ik]) continue;
    seen[ik] = true;
    out.push(inferredAligned[i]);
  }

  var minWant = contentType === 'success_case' ? 6 : 4;
  var supplemented = out.length > llmCount || (llmCount < minWant && out.length >= minWant);

  return { tags: out.slice(0, CONTENT_TAGS_MAX), supplemented: supplemented };
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

/** @type {Array<string>} Clasificación del material de propuestas / conocimiento comercial Globant */
var CONTENT_PROPOSAL_MATERIAL_KINDS = [
  'COMMERCIAL_PROPOSAL',
  'GLOBANT_STUDIO',
  'GLOBANT_OFFERING',
  'CORPORATE',
  'OTHER',
];

/** @type {Object<string,string>} Segmento de carpeta Drive por material_kind */
var CONTENT_PROPOSAL_MATERIAL_KIND_FOLDER_LABELS = {
  COMMERCIAL_PROPOSAL: 'Propuesta comercial',
  GLOBANT_STUDIO: 'Studio',
  GLOBANT_OFFERING: 'Offering',
  CORPORATE: 'Corporativo',
  OTHER: 'Otro',
};

/** @type {Array<string>} Valores válidos para stage en propuestas */
var CONTENT_PROPOSAL_STAGES = ['PRESENTED', 'NEGOTIATION', 'WIN', 'LOST', 'ON_HOLD'];
/** @type {Array<string>} Valores válidos para pricing_model */
var CONTENT_PRICING_MODELS = [
  'TIME_AND_MATERIALS',
  'STAFF_AUGMENTATION',
  'FIXED_PRICE',
  'SUBSCRIPTION',
  'AI_PODS',
];
/** @type {Array<string>} Valores válidos para industria del cliente */
var CONTENT_ALLOWED_CLIENT_INDUSTRIES =
  typeof CLIENTS_ALLOWED_INDUSTRIES !== 'undefined'
    ? CLIENTS_ALLOWED_INDUSTRIES
    : [
        'Agencias de Turismo',
        'Logistica',
        'Agencias AeroEspaciales',
        'Aeropuertos',
      ];

/** @type {Object<string,string>} Etiquetas legibles por content_type para el prompt */
var CONTENT_EXTRACTION_TYPE_LABELS = {
  proposal:
    'commercial proposal / RFP response / Globant Studio profile / offering (AI Pods, etc.) / corporate sales material',
  success_case: 'success case / case study / customer story',
  client: 'client profile / account overview / CRM export',
  onboarding: 'onboarding / training / enablement material',
};

/**
 * Onboarding es material interno de enablement: no lleva cliente ni industria.
 * @param {string} contentType
 * @return {boolean}
 */
function ContentExtraction_usesClientMetadata_(contentType) {
  return String(contentType || '').trim() !== 'onboarding';
}

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
      'KNOWN CLIENTS (use the closest catalog name when the document matches; small typos or accents OK): ' +
      names.slice(0, max).join(', ') +
      ' … and ' +
      String(names.length - max) +
      ' more.'
    );
  }
  return (
    'KNOWN CLIENTS (when the document refers to one of these accounts, use the closest catalog ' +
    'spelling; small typos or missing accents are OK — do NOT invent a new variant): ' +
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
 * @return {{client_name:string, industry:string, sub_industry:string, matched:boolean}}
 */
function ContentExtraction_matchClient_(rawName, fileName) {
  var m = ClientsMaster_matchFromHints_(rawName, fileName);
  return {
    client_name: m.client_name,
    industry: m.industry,
    sub_industry: m.sub_industry,
    matched: m.matched,
  };
}

/**
 * @return {string}
 */
function ContentExtraction_getIndustryCatalogHint_() {
  var catalog = ClientsMaster_listFilterOptions();
  var ind = catalog.industries || [];
  if (!ind.length) {
    return 'INDUSTRY: leave common.industry empty unless clearly stated and already known.';
  }
  return (
    'INDUSTRY (use ONLY one of these exact catalog values when applicable; otherwise empty string): ' +
    ind.join(', ')
  );
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
    sp.material_kind = ContentExtraction_normalizeEnum_(
      sp.material_kind,
      CONTENT_PROPOSAL_MATERIAL_KINDS,
      'COMMERCIAL_PROPOSAL',
    );
    sp.topic = String(sp.topic || '').trim();
    sp.globant_studio = String(sp.globant_studio || '').trim();
    sp.offering = ContentExtraction_normalizeEnum_(sp.offering, CONTENT_PRICING_MODELS, '');
    sp.stage = ContentExtraction_normalizeEnum_(sp.stage, CONTENT_PROPOSAL_STAGES, 'PRESENTED');
    sp.pricing_model = ContentExtraction_normalizeEnum_(
      sp.pricing_model,
      CONTENT_PRICING_MODELS,
      'TIME_AND_MATERIALS',
    );
    if (sp.material_kind === 'GLOBANT_OFFERING' && !sp.offering && sp.pricing_model) {
      sp.offering = sp.pricing_model;
    }
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
/**
 * @param {Object} payload
 * @param {string} contentType
 * @return {{fileName:string, clientsHint?:string, entryIndustry?:string}}
 */
function ContentExtraction_buildExtractHints_(payload, contentType) {
  var hints = {
    fileName: String((payload && payload.name) || '').trim(),
  };
  if (ContentExtraction_usesClientMetadata_(contentType)) {
    hints.clientsHint = ContentExtraction_getClientsHint_();
  }
  var entryIndustry = ClientsMaster_resolveIndustryFromCatalog_(
    String((payload && payload.entryIndustry) || '').trim(),
  );
  if (entryIndustry) hints.entryIndustry = entryIndustry;
  return hints;
}

/**
 * @param {Object} parsed
 * @param {string} contentType
 * @param {string} fileName
 * @param {{entryIndustry?:string}=} opts
 * @return {Object}
 */
function ContentExtraction_enrichDraft_(parsed, contentType, fileName, opts) {
  opts = opts || {};
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

  if (ContentExtraction_usesClientMetadata_(contentType)) {
    var llmClientEmpty = !String(common.client_name || '').trim();
    var clientMatch = ClientsMaster_matchFromHints_(common.client_name, fileName);
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
      var indFromClient = ClientsMaster_resolveIndustryFromCatalog_(clientMatch.industry);
      if (indFromClient) common.industry = indFromClient;
    } else {
      var nameToEnsure = String(clientMatch.client_name || '').trim();
      var skipFilenameClient =
        contentType === 'success_case' && llmClientEmpty;
      if (!skipFilenameClient && nameToEnsure.length >= 2) {
        var ensured = ClientsMaster_ensureByName(nameToEnsure, common.industry);
        common.client_name = ensured.item.client_name;
        if (ensured.created) {
          warnings.push(UiStrings_t(locale, 'contents_warn_client_created'));
        }
        var indNew = ClientsMaster_resolveIndustryFromCatalog_(
          String(ensured.item.industry || '').trim(),
        );
        if (indNew) common.industry = indNew;
      }
    }
    var llmIndustry = String(common.industry || '').trim();
    if (llmIndustry) {
      var catalogIndustry = ClientsMaster_resolveIndustryFromCatalog_(llmIndustry);
      if (catalogIndustry) common.industry = catalogIndustry;
      else {
        common.industry = '';
        warnings.push(UiStrings_t(locale, 'contents_warn_industry_not_in_catalog'));
      }
    }
    if (contentType === 'success_case' && !String(common.client_name || '').trim()) {
      var indForGeneric = String(common.industry || '').trim();
      if (indForGeneric) {
        var genericRes = ClientsMaster_ensureGenericForIndustry(indForGeneric);
        if (genericRes && genericRes.item) {
          common.client_name = String(genericRes.item.client_name || '').trim();
          common.industry = String(genericRes.item.industry || indForGeneric).trim();
          warnings.push(UiStrings_t(locale, 'contents_warn_client_generic_industry'));
        }
      }
    }
    var forcedIndustry = ClientsMaster_resolveIndustryFromCatalog_(
      String(opts.entryIndustry || '').trim(),
    );
    if (contentType === 'success_case' && forcedIndustry) {
      common.industry = forcedIndustry;
    }
  } else {
    common.client_name = '';
    common.industry = '';
  }

  var specificNorm = ContentExtraction_normalizeSpecific_(contentType, parsed.specific || {});
  var tagEnrich = ContentExtraction_enrichTags_(
    common.tags,
    contentType,
    common,
    specificNorm,
  );
  common.tags = tagEnrich.tags;
  if (tagEnrich.supplemented) {
    warnings.push(UiStrings_t(locale, 'contents_warn_tags_enriched'));
  }

  parsed.common = common;
  parsed.specific = specificNorm;

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
      var tagRetry = ContentExtraction_enrichTags_(
        common.tags,
        contentType,
        common,
        spEnriched,
      );
      common.tags = tagRetry.tags;
      parsed.common = common;
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
  var typeLabel = CONTENT_EXTRACTION_TYPE_LABELS[contentType] || contentType;
  var fileName = String(hints.fileName || '').trim();
  var clientsHint = String(hints.clientsHint || '').trim();

  var usesClient = ContentExtraction_usesClientMetadata_(contentType);
  var commonInstructions = [
    'Extract metadata for content type: ' + typeLabel + '.',
    fileName
      ? usesClient
        ? 'Original file name: "' + fileName + '". Use it as a hint when the document title or client is unclear.'
        : 'Original file name: "' + fileName + '". Use it as a hint when the document title is unclear.'
      : '',
    usesClient ? clientsHint : '',
    'Analyze the full document (cover, headers, footers, tables, logos, metadata blocks).',
    'Return ONLY valid JSON. No markdown fences, no comments outside JSON.',
    'If a value is missing or uncertain, use empty string and explain briefly in warnings[] (same language as the document).',
    usesClient
      ? 'Set confidence to high only when title and client_name are clearly supported by the document.'
      : 'Set confidence to high only when title is clearly supported by the document.',
    ContentExtraction_buildTagPromptBlock_(contentType),
  ];
  if (usesClient) {
    commonInstructions.push(
      ContentExtraction_getIndustryCatalogHint_(),
      '- Do NOT invent industry values; empty string if not in the catalog.',
      'Common structure:',
      '{"common":{"title":"","summary":"","client_name":"","industry":"","tags":[]},"specific":{},"confidence":"high|medium|low","warnings":[]}',
      'common.summary: 1-3 sentences describing the document purpose and scope.',
      'common.client_name: legal or commercial name of the customer/account when present.',
    );
  } else {
    commonInstructions.push(
      'Common structure:',
      '{"common":{"title":"","summary":"","tags":[]},"specific":{},"confidence":"high|medium|low","warnings":[]}',
      'common.summary: 1-3 sentences describing the document purpose and scope.',
      'Do NOT extract client_name or industry for this content type.',
    );
  }
  if (contentType === 'proposal') {
    commonInstructions.push(
      'specific for proposal: {"material_kind":"","topic":"","globant_studio":"","offering":"","stage":"","pricing_model":"","effort_estimate":"","timeline":"","win_probability":"","notes":""}',
      'material_kind MUST be one of: ' +
        CONTENT_PROPOSAL_MATERIAL_KINDS.join(', ') +
        '. Use COMMERCIAL_PROPOSAL for client RFP/proposal decks; GLOBANT_STUDIO for Studio capability decks; GLOBANT_OFFERING for AI Pods and engagement models; CORPORATE for general Globant commercial material; OTHER if none fit.',
      'topic: thematic subject (e.g. aviation, loyalty, cloud migration, AI transformation). Required when material_kind is CORPORATE or OTHER.',
      'globant_studio: name of the Globant Studio when the document is about or from a Studio (e.g. Aviation Studio, AI Studio). Required when material_kind is GLOBANT_STUDIO.',
      'offering MUST be one of: ' +
        CONTENT_PRICING_MODELS.join(', ') +
        ' when material_kind is GLOBANT_OFFERING; otherwise empty string.',
      'stage MUST be one of: ' + CONTENT_PROPOSAL_STAGES.join(', ') + '. Use PRESENTED when not a live deal artifact.',
      'pricing_model MUST be one of: ' + CONTENT_PRICING_MODELS.join(', ') + '. Prefer for COMMERCIAL_PROPOSAL; may mirror offering for GLOBANT_OFFERING.',
      'For COMMERCIAL_PROPOSAL, common.industry is mandatory and MUST be one of the allowed values. For other material_kind values, industry may be empty.',
      'effort_estimate and timeline: extract from SOW, staffing tables or commercial sections when available (mainly COMMERCIAL_PROPOSAL).',
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
    'For tags: be creative and specific — they power a tag cloud used for search and discovery across the portfolio.',
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
  parsed.common.industry = ClientsMaster_resolveIndustryFromCatalog_(parsed.common.industry || '');
  delete parsed.common.tags_controlled;
  delete parsed.common.tags_free;
  if (!Array.isArray(parsed.warnings)) parsed.warnings = [];
  parsed.confidence = String(parsed.confidence || 'low').toLowerCase();
  if (parsed.confidence !== 'high' && parsed.confidence !== 'medium') parsed.confidence = 'low';
  return parsed;
}

/**
 * @deprecated Solo referencia histórica; la extracción usa /v1/assistant/chat vía GlobantDocumentChatService.
 * @return {string}
 */
function ContentExtraction_resolveChatModel_() {
  return GlobantAssistant_resolveChatModel_();
}

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
 * @param {GoogleAppsScript.Base.Blob} blob
 * @param {{client:Object,fileId:string,folder:string}=} session sesión con archivo ya subido
 * @return {{text:string, parsed:Object}}
 */
function ContentExtraction_chatFilePass_(client, systemPrompt, userPrompt, blob, session) {
  if (session) {
    return GlobantDocumentChat_sessionChat_(session, systemPrompt, userPrompt);
  }
  return GlobantDocumentChat_chatWithBlob_(client, blob, systemPrompt, userPrompt);
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
  var entryIndustry = String(hints.entryIndustry || '').trim();
  var fileHint = fileName
    ? 'Original file name: "' + fileName + '". Use as hint for title/client when unclear.\n'
    : '';
  var entryIndustryHint = entryIndustry
    ? 'User pre-selected industry for this upload: "' +
      entryIndustry +
      '". Set common.industry to this exact value unless the document clearly contradicts it.\n'
    : '';

  if (passId === 'common') {
    return [
      'Extract COMMON catalog metadata from this success case / case study PDF.',
      fileHint,
      entryIndustryHint,
      clientsHint,
      'Read cover, headers, footers, logos, tables, and metadata blocks.',
      'Return ONLY valid JSON. No markdown.',
      ContentExtraction_buildTagPromptBlock_('success_case'),
      'INDUSTRY must be one of: ' + CONTENT_ALLOWED_CLIENT_INDUSTRIES.join(', '),
      'Schema:',
      '{"common":{"title":"","summary":"","client_name":"","industry":"","tags":[]},"confidence":"high|medium|low","warnings":[]}',
      'common.summary: 1-3 sentences — document purpose only (NOT challenge/solution detail).',
      'common.tags: rich set for tag-cloud discovery (capabilities, tech, aviation domain, outcomes).',
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
      '{"solution":"<2-6 sentences from the document>","tags":["#optionalCamelTag"],"confidence":"high|medium|low","warnings":[]}',
      'Rules:',
      '- solution MUST describe what Globant/the team delivered — approach, scope, technologies.',
      '- tags (optional): 0-4 English #camelCase tags for tech stack, methods, or capabilities visible in this section only.',
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
      '{"impact_metric":"","impact_value":"","evidence":"","notes":"","tags":["#optionalCamelTag"],"confidence":"high|medium|low","warnings":[]}',
      'Field rules:',
      '- tags (optional): 0-3 #camelCase outcome or domain tags (e.g. #costReduction, #customerSatisfaction) if supported here.',
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
    if (Array.isArray(parsed.tags) && parsed.tags.length) {
      var commonForTags = draft.common || {};
      var prevTags = Array.isArray(commonForTags.tags) ? commonForTags.tags : [];
      commonForTags.tags = prevTags.concat(parsed.tags);
      draft.common = commonForTags;
    }
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
 * @param {GoogleAppsScript.Base.Blob} blob
 * @param {{fileName?:string, clientsHint?:string}} hints
 * @param {string} passId
 * @param {Object} draft
 * @param {string} locale
 * @param {{client:Object,fileId:string,folder:string}=} session
 */
function ContentExtraction_runSuccessCasePass_(client, blob, hints, passId, draft, locale, session) {
  try {
    var prompt = ContentExtraction_promptSuccessCasePass_(passId, hints);
    var systemPrompt = ContentExtraction_systemPromptForPass_(passId);
    var result = ContentExtraction_chatFilePass_(client, systemPrompt, prompt, blob, session);
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
 * @param {GoogleAppsScript.Base.Blob} blob
 * @param {{fileName?:string, clientsHint?:string}} hints
 * @return {Object}
 */
function ContentExtraction_extractSuccessCaseMultiPass_(client, blob, hints) {
  var locale = UiStrings_activeLocale_();
  var draft = ContentExtraction_emptyDraft_('success_case');
  var session = GlobantDocumentChat_beginSession_(client, blob);
  try {
    var pi;
    for (pi = 0; pi < CONTENT_SUCCESS_CASE_PASSES.length; pi++) {
      ContentExtraction_runSuccessCasePass_(
        client,
        blob,
        hints,
        CONTENT_SUCCESS_CASE_PASSES[pi],
        draft,
        locale,
        session,
      );
    }
  } finally {
    GlobantDocumentChat_endSession_(session);
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

  var hints = ContentExtraction_buildExtractHints_(payload, type);
  var locale = UiStrings_activeLocale_();
  var draft = ContentExtraction_parseDraftState_(draftJson, type);

  ContentExtraction_runSuccessCasePass_(client, prepared.blob, hints, pid, draft, locale);

  var isLast = passIndex === CONTENT_SUCCESS_CASE_PASSES.length - 1;
  if (isLast) {
    if (draft.common && typeof draft.common === 'object') {
      draft.common.content_type = type;
    }
    ContentExtraction_resolveSpecific_(draft, type);
    draft = ContentExtraction_enrichDraft_(draft, type, prepared.name, {
      entryIndustry: hints.entryIndustry || '',
    });
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
 * Extrae metadata subiendo el archivo a Globant Files y consultando /v1/assistant/chat.
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

  var hints = ContentExtraction_buildExtractHints_(payload, contentType);

  var draft;
  if (contentType === 'success_case') {
    draft = ContentExtraction_extractSuccessCaseMultiPass_(client, prepared.blob, hints);
    if (draft.common && typeof draft.common === 'object') {
      draft.common.content_type = contentType;
    }
    ContentExtraction_resolveSpecific_(draft, contentType);
    draft = ContentExtraction_enrichDraft_(draft, contentType, prepared.name, {
      entryIndustry: hints.entryIndustry || '',
    });
  } else {
    var prompt = ContentExtraction_promptForType_(contentType, hints);
    var result = ContentExtraction_chatFilePass_(
      client,
      ContentExtraction_systemPrompt_(),
      prompt,
      prepared.blob,
    );
    draft = ContentExtraction_parseJson_(result.text || '');
    if (draft.common && typeof draft.common === 'object') {
      draft.common.content_type = contentType;
    }
    ContentExtraction_resolveSpecific_(draft, contentType);
    draft = ContentExtraction_enrichDraft_(draft, contentType, prepared.name, {
      entryIndustry: hints.entryIndustry || '',
    });
  }

  return {
    ok: true,
    file: { name: prepared.name, mimeType: prepared.mimeType },
    draft: draft,
  };
}

/**
 * Obtiene el PDF en Drive de un contenido existente como payload base64 para extracción.
 *
 * @param {string} contentId
 * @return {{ok:boolean, contentType:string, file:{name:string,mimeType:string,dataBase64:string}}}
 */
function ContentExtraction_getPdfPayloadFromContentId(contentId) {
  ContentCatalog_requireContributor_();
  var id = String(contentId || '').trim();
  if (!id) throw new Error('content_id requerido');

  var item = ContentCatalog_get(id).item;
  var common = item.common || {};
  var contentType = String(common.content_type || '').trim();
  if (!ContentCatalog_isValidType_(contentType)) throw new Error('content_type invalido');

  var driveFileId = String(common.drive_file_id || '').trim();
  if (!driveFileId) {
    AviatorsError_throw_('ERR_CONTENT_REEXTRACT_NO_FILE', 'ContentExtraction_getPdfPayloadFromContentId', {
      contentId: id,
    });
  }

  var driveFile = ContentIngestion_getLiveDriveFile_(driveFileId);
  if (!driveFile) {
    AviatorsError_throw_('ERR_CONTENT_REEXTRACT_FILE_MISSING', 'ContentExtraction_getPdfPayloadFromContentId', {
      contentId: id,
      driveFileId: driveFileId,
    });
  }

  var blob = DriveDocuments_getPdfBlobForGlobant(driveFileId);
  var bytes = blob.getBytes();
  if (!bytes || bytes.length === 0) throw new Error('Archivo vacio');
  if (bytes.length > CONTENT_UPLOAD_LOCAL_MAX_BYTES) {
    throw new Error(
      UiStrings_fmt_('err_contents_upload_too_large', {
        name: String(common.file_name || driveFile.getName() || 'document.pdf'),
        max_mb: String(Math.floor(CONTENT_UPLOAD_LOCAL_MAX_BYTES / (1024 * 1024))),
      }),
    );
  }

  var fileName = String(common.file_name || driveFile.getName() || 'document.pdf').trim();
  var mimeType = String(blob.getContentType() || common.mime_type || 'application/pdf').trim();
  return {
    ok: true,
    contentType: contentType,
    file: {
      name: fileName,
      mimeType: mimeType,
      dataBase64: Utilities.base64Encode(bytes),
    },
  };
}

