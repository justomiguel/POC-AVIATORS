/**
 * @fileoverview Armado de propuestas: extracción de brief (RFP/chat) y construcción asistida.
 *
 * Decks: copia plantilla Slides → Propuestas/{cliente}/{propuesta}/ en DRIVE_ROOT_FOLDER_ID.
 * Sesiones por usuario en Drive (planilla índice + session.json por sesión).
 * Propiedades: PROPOSAL_DECK_AIRLINES_ID, PROPOSAL_DECK_LOGISTICS_ID.
 * Ver docs/PROPOSAL_BUILDING.md (placeholders, slide 17, permisos).
 */

var PROPOSAL_BUILDING_COMMERCIAL_MODELS = [
  'TIME_AND_MATERIALS',
  'STAFF_AUGMENTATION',
  'FIXED_PRICE',
  'SUBSCRIPTION',
  'AI_PODS',
];

var PROPOSAL_BUILDING_INDUSTRY_KEYS = ['Aerolineas', 'Logistica'];

/** Tokens de archivo/industria que no deben usarse como nombre de cliente. */
var PROPOSAL_BUILDING_GENERIC_CLIENT_TOKENS_ = {
  aerolineas: true,
  aerolneas: true,
  airlines: true,
  airline: true,
  aviacion: true,
  aviation: true,
  logistica: true,
  logistics: true,
  globant: true,
  propuesta: true,
  proposal: true,
  propuestas: true,
  rfp: true,
  rfq: true,
  brief: true,
  cliente: true,
  client: true,
  customer: true,
  empresa: true,
  company: true,
  documento: true,
  document: true,
  anexo: true,
  annex: true,
  draft: true,
  final: true,
  copy: true,
  copia: true,
};

/** Palabras geográficas que no convierten «Aerolíneas + país» en nombre de cliente. */
var PROPOSAL_BUILDING_GEO_CLIENT_TOKENS_ = {
  argentinas: true,
  argentina: true,
  brasil: true,
  brazil: true,
  chile: true,
  mexico: true,
  colombia: true,
  peru: true,
  uruguay: true,
  paraguay: true,
  espana: true,
  spain: true,
  usa: true,
};

/**
 * @param {string} name
 * @return {boolean}
 */
function ProposalBuilding_isWeakClientName_(name) {
  var raw = String(name || '').trim();
  if (!raw || raw.length < 2) return true;
  var tokens = ClientsMaster_extractNameTokens_(raw);
  if (!tokens.length) return true;
  if (
    tokens.length === 2 &&
    PROPOSAL_BUILDING_GENERIC_CLIENT_TOKENS_[tokens[0]] &&
    PROPOSAL_BUILDING_GEO_CLIENT_TOKENS_[tokens[1]]
  ) {
    return true;
  }
  var ti;
  for (ti = 0; ti < tokens.length; ti++) {
    if (!PROPOSAL_BUILDING_GENERIC_CLIENT_TOKENS_[tokens[ti]]) return false;
  }
  return true;
}

/**
 * @param {string} name
 * @return {string}
 */
function ProposalBuilding_sanitizeExtractedClientName_(name) {
  var raw = String(name || '').trim();
  if (!raw) return '';
  if (ProposalBuilding_isPlaceholderBriefText_(raw)) return '';
  if (ProposalBuilding_isWeakClientName_(raw)) return '';
  return raw;
}

/**
 * @param {string} extracted
 * @param {string} catalogName
 * @param {number} matchScore
 * @return {boolean}
 */
function ProposalBuilding_catalogClientMatchAllowed_(extracted, catalogName, matchScore) {
  var ex = ClientsMaster_normalizeName_(extracted);
  var cat = ClientsMaster_normalizeName_(catalogName);
  if (!ex || !cat) return false;
  if (ex === cat) return true;
  if (ProposalBuilding_isWeakClientName_(extracted)) return false;
  if (cat.indexOf(ex) >= 0 && ex.length < cat.length * 0.65) return false;
  if (ex.indexOf(cat) >= 0 && cat.length < ex.length * 0.65) return false;
  return Number(matchScore) >= 0.92 && ex.length >= 6;
}

/** Nombre canónico del studio digital para offering AI Pods (no usar «Globant AI»). */
var PROPOSAL_BUILDING_AI_PODS_STUDIO_NAME_ = 'Globant AI-PODs';

/** @type {Object<string, Array<string>>} */
var PROPOSAL_BUILDING_STUDIO_TAXONOMY_ = {
  digital: [
    'Globant AI-PODs',
    'Globant Data',
    'Globant Immersive Experiences',
    'Globant Cybersecurity',
    'Quality Engineering',
    'Globant Igniting Robotics',
    'Globant Engineering',
    'Globant CloudOps',
    'Globant Blockchain',
    'Globant Business Hacking',
    'Globant Cultural Hacking & Agility',
    'Globant Fast Code',
    'Globant Internet of Things',
    'Globant Digital Twins',
    'Globant Payments',
    'Globant Legal AI',
    'Globant Sustainable Business',
    'Globant Loyalty Studio',
    'Globant Private Equity',
  ],
  ai: [
    'Globant Automotive',
    'Globant Media & Entertainment',
    'Globant Healthcare & Life Sciences',
    'Globant Finance',
    'Globant Airlines',
    'Globant Hospitality & Leisure',
    'Globant Games',
    'Globant Education',
    'Globant Sports Studio',
    'Globant Retail',
    'Globant Consumer Goods & Manufacturing',
    'Globant Energy',
    'Globant High Tech',
  ],
  enterprise: [
    'Globant SAP',
    'Globant ServiceNow',
    'Globant Salesforce',
    'Globant Oracle',
    'Globant AWS Studio',
    'Globant Adobe Studio',
    'Globant Google Cloud',
    'Globant Microsoft',
    'Globant Process Optimization',
  ],
};

var PROPOSAL_BUILDING_IMAGE_MIMES_ = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
];

var PROPOSAL_BUILDING_TEXT_MIMES_ = [
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
];

var PROPOSAL_BUILDING_DOCX_MIME_ =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/**
 * @return {number}
 */
function ProposalBuilding_maxAttachmentBytes_() {
  return typeof GLOBANT_DOCUMENT_CHAT_MAX_BYTES !== 'undefined'
    ? GLOBANT_DOCUMENT_CHAT_MAX_BYTES
    : 50 * 1024 * 1024;
}

/** Carpeta bajo DRIVE_ROOT_FOLDER_ID donde se guardan decks armados. */
var PROPOSAL_BUILDING_DRIVE_FOLDER_NAME = 'Propuestas';

/** @type {string} */
var PROPOSAL_BUILDING_CLIENT_FALLBACK_ = 'Sin cliente';

/** @type {string} */
var PROPOSAL_BUILDING_SUBJECT_FALLBACK_ = 'Propuesta';

/** @type {number} Mínimo de casos propuestos en el paso de selección presale. */
var PROPOSAL_BUILDING_SUCCESS_CASE_MIN_CANDIDATES_ = 5;

/** @type {number} Máximo de casos propuestos para elegir en presale. */
var PROPOSAL_BUILDING_SUCCESS_CASE_CANDIDATE_MAX_ = 8;

/** @type {number} Máximo de casos de éxito insertados en el deck. */
var PROPOSAL_BUILDING_SUCCESS_CASE_MAX_ = 8;

/** @type {number} Umbral semántico para casos de éxito en propuestas. */
var PROPOSAL_BUILDING_SUCCESS_CASE_SEMANTIC_MIN_ = 0.62;

/** @type {number} Umbral combinado lexical/semántico. */
var PROPOSAL_BUILDING_SUCCESS_CASE_COMBINED_MIN_ = 0.32;

/**
 * @return {GlobantAssistantApiClient}
 */
function ProposalBuilding_createLlmClient_() {
  var props = PropertiesService.getScriptProperties();
  var apiKey = (props.getProperty(LLM_PROP.GLOBANT_API_KEY) || '').trim();
  if (!apiKey) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_falta_globant_key'));
  }
  var baseUrl = (props.getProperty(LLM_PROP.GLOBANT_BASE_URL) || '').trim();
  return GlobantAssistantApiClient_create({
    apiKey: apiKey,
    baseUrl: baseUrl || undefined,
  });
}

/**
 * @param {Object} attachment
 * @return {{name:string,mimeType:string,dataBase64:string,textContent:string}}
 */
function ProposalBuilding_normalizeAttachment_(attachment) {
  if (!attachment || typeof attachment !== 'object') {
    return { name: '', mimeType: '', dataBase64: '', textContent: '' };
  }
  var name = String(attachment.name || '').trim();
  var mime = String(attachment.mimeType || '').trim().toLowerCase();
  var textContent = String(attachment.textContent || '').trim();
  var b64 = String(attachment.dataBase64 || '');
  if (textContent && !b64) {
    return {
      name: name || 'transcript.txt',
      mimeType: 'text/plain',
      dataBase64: '',
      textContent: textContent,
    };
  }
  if (!b64) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_ephemeral_doc_empty'));
  }
  var bytes = Utilities.base64Decode(b64);
  if (!bytes || bytes.length === 0) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_ephemeral_doc_empty'));
  }
  var maxBytes = ProposalBuilding_maxAttachmentBytes_();
  if (bytes.length > maxBytes) {
    throw new Error(
      UiStrings_fmt_('err_ephemeral_doc_too_large', {
        max_mb: String(Math.floor(maxBytes / (1024 * 1024))),
      }),
    );
  }
  if (!mime && /\.pdf$/i.test(name)) mime = 'application/pdf';
  if (!mime && /\.(txt|md|csv)$/i.test(name)) mime = 'text/plain';
  if (!mime && /\.docx$/i.test(name)) mime = PROPOSAL_BUILDING_DOCX_MIME_;
  if (!mime && /\.(png|jpe?g|webp|gif)$/i.test(name)) {
    mime = 'image/' + (name.match(/\.jpe?g$/i) ? 'jpeg' : name.split('.').pop().toLowerCase());
  }
  if (ProposalBuilding_isTextMime_(mime)) {
    return {
      name: name,
      mimeType: mime,
      dataBase64: '',
      textContent: Utilities.newBlob(bytes).getDataAsString('UTF-8'),
    };
  }
  if (
    mime !== 'application/pdf' &&
    mime !== PROPOSAL_BUILDING_DOCX_MIME_ &&
    ProposalBuilding_isImageMime_(mime) === false
  ) {
    throw new Error(
      UiStrings_fmt_('pb_err_attachment_mime', {
        name: name,
        mime: mime || UiStrings_t(UiStrings_activeLocale_(), 'label_em_dash'),
      }),
    );
  }
  return { name: name, mimeType: mime, dataBase64: b64, textContent: '' };
}

/**
 * @param {string} sessionId
 * @param {string} driveFileId
 */
function ProposalBuilding_assertSessionMaterialDriveId_(sessionId, driveFileId) {
  var sid = String(sessionId || '').trim();
  var id = ChatReferences_extractDriveFileId_(driveFileId) || String(driveFileId || '').trim();
  if (!sid || !id) {
    AviatorsError_throw_('ERR_PROPOSAL_MATERIAL_DRIVE', 'ProposalBuilding_assertSessionMaterialDriveId_', id);
  }
  var email = String(Session.getActiveUser().getEmail() || '').trim();
  if (!email) {
    AviatorsError_throw_('ERR_AUTH', 'ProposalBuilding_assertSessionMaterialDriveId_', sid);
  }
  var row = ProposalBuildingStore_getByIdForUser(sid, email);
  if (!row) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'pb_err_session_not_found'));
  }
  var materials = Array.isArray(row.materials) ? row.materials : [];
  var i;
  for (i = 0; i < materials.length; i++) {
    var matId = ChatReferences_extractDriveFileId_(materials[i].driveFileId) || String(materials[i].driveFileId || '');
    if (matId === id) return;
  }
  AviatorsError_throw_('ERR_PROPOSAL_MATERIAL_DRIVE', 'ProposalBuilding_assertSessionMaterialDriveId_', id);
}

/**
 * @param {string} driveFileId
 * @param {string=} nameHint
 * @return {{name:string,mimeType:string,dataBase64:string,textContent:string}}
 */
function ProposalBuilding_attachmentFromDriveFile_(driveFileId, nameHint) {
  var id = ChatReferences_extractDriveFileId_(driveFileId) || String(driveFileId || '').trim();
  if (!id) {
    AviatorsError_throw_('ERR_PROPOSAL_MATERIAL_DRIVE', 'ProposalBuilding_attachmentFromDriveFile_', driveFileId);
  }
  var file;
  try {
    file = DriveApp.getFileById(id);
  } catch (eDrive) {
    AviatorsError_throw_(
      'ERR_PROPOSAL_MATERIAL_DRIVE',
      'ProposalBuilding_attachmentFromDriveFile_',
      String(eDrive && eDrive.message),
    );
  }
  var name = String(nameHint || file.getName() || 'material').trim() || 'material';
  var mime = String(file.getMimeType() || '').trim().toLowerCase();
  if (!mime && /\.pdf$/i.test(name)) mime = 'application/pdf';
  if (!mime && /\.(txt|md|csv)$/i.test(name)) mime = 'text/plain';
  if (!mime && /\.docx$/i.test(name)) mime = PROPOSAL_BUILDING_DOCX_MIME_;
  var bytes = file.getBlob().getBytes();
  if (!bytes || bytes.length === 0) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_ephemeral_doc_empty'));
  }
  var maxBytes = ProposalBuilding_maxAttachmentBytes_();
  if (bytes.length > maxBytes) {
    throw new Error(
      UiStrings_fmt_('err_ephemeral_doc_too_large', {
        max_mb: String(Math.floor(maxBytes / (1024 * 1024))),
      }),
    );
  }
  if (ProposalBuilding_isTextMime_(mime)) {
    return {
      name: name,
      mimeType: mime,
      dataBase64: '',
      textContent: Utilities.newBlob(bytes).getDataAsString('UTF-8'),
    };
  }
  if (
    mime !== 'application/pdf' &&
    mime !== PROPOSAL_BUILDING_DOCX_MIME_ &&
    ProposalBuilding_isImageMime_(mime) === false
  ) {
    throw new Error(
      UiStrings_fmt_('pb_err_attachment_mime', {
        name: name,
        mime: mime || UiStrings_t(UiStrings_activeLocale_(), 'label_em_dash'),
      }),
    );
  }
  return {
    name: name,
    mimeType: mime,
    dataBase64: Utilities.base64Encode(bytes),
    textContent: '',
  };
}

/**
 * @param {Object} payload
 * @return {{name:string,mimeType:string,dataBase64:string,textContent:string}}
 */
function ProposalBuilding_resolveExtractAttachment_(payload) {
  payload = payload && typeof payload === 'object' ? payload : {};
  var attachment = ProposalBuilding_normalizeAttachment_(payload.attachment || null);
  if (attachment.dataBase64 || attachment.textContent) return attachment;
  var driveFileId = String(payload.driveFileId || '').trim();
  if (!driveFileId) return attachment;
  var sessionId = String(payload.sessionId || '').trim();
  if (sessionId) {
    ProposalBuilding_assertSessionMaterialDriveId_(sessionId, driveFileId);
  }
  return ProposalBuilding_attachmentFromDriveFile_(driveFileId, payload.materialName);
}

/**
 * @param {string} mime
 * @return {boolean}
 */
function ProposalBuilding_isTextMime_(mime) {
  var m = String(mime || '').trim().toLowerCase();
  for (var i = 0; i < PROPOSAL_BUILDING_TEXT_MIMES_.length; i++) {
    if (PROPOSAL_BUILDING_TEXT_MIMES_[i] === m) return true;
  }
  return m.indexOf('text/') === 0;
}

/**
 * @param {string} mime
 * @return {boolean}
 */
function ProposalBuilding_isImageMime_(mime) {
  var m = String(mime || '').trim().toLowerCase();
  for (var i = 0; i < PROPOSAL_BUILDING_IMAGE_MIMES_.length; i++) {
    if (PROPOSAL_BUILDING_IMAGE_MIMES_[i] === m) return true;
  }
  return false;
}

/**
 * @param {Array<Object>} history
 * @return {string}
 */
function ProposalBuilding_formatChatHistory_(history) {
  var lines = [];
  var hist = Array.isArray(history) ? history : [];
  for (var i = 0; i < hist.length; i++) {
    var row = hist[i];
    if (!row || typeof row !== 'object') continue;
    var role = String(row.role || '').trim().toLowerCase();
    var content = String(row.content || '').trim();
    if (!content) continue;
    if (role === 'assistant') lines.push('ASSISTANT: ' + content);
    else lines.push('USER: ' + content);
  }
  return lines.join('\n');
}

/**
 * @param {string} model
 * @return {string}
 */
function ProposalBuilding_normalizeCommercialModel_(model) {
  var raw = String(model || '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
  if (raw === 'FIX_PRICE' || raw === 'FIXED') raw = 'FIXED_PRICE';
  if (raw === 'TM' || raw === 'T_AND_M') raw = 'TIME_AND_MATERIALS';
  if (raw === 'AI_POD' || raw === 'AIPODS' || raw === 'AI_POD_S') raw = 'AI_PODS';
  for (var i = 0; i < PROPOSAL_BUILDING_COMMERCIAL_MODELS.length; i++) {
    if (PROPOSAL_BUILDING_COMMERCIAL_MODELS[i] === raw) return raw;
  }
  return '';
}

/**
 * @param {string} text
 * @return {boolean}
 */
function ProposalBuilding_isPlaceholderBriefText_(text) {
  var t = String(text || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
  if (!t) return true;
  var exact = {
    nombre: true,
    name: true,
    cargo: true,
    role: true,
    'cargo / rol': true,
    empresa: true,
    organization: true,
    'empresa/área': true,
    'empresa o área': true,
    opcional: true,
    optional: true,
    contacto: true,
    contact: true,
    hito: true,
    milestone: true,
    'sin nombre': true,
    'no indicado': true,
    'not specified': true,
    n: true,
    na: true,
    'n/a': true,
    tbd: true,
    '—': true,
    '-': true,
    vacío: true,
    empty: true,
    ejemplo: true,
    example: true,
    'e.g.': true,
    'ej.': true,
  };
  if (exact[t]) return true;
  if (/^(nombre|name|cargo|role|contacto|contact|hito|milestone)(\s|$)/.test(t)) return true;
  return false;
}

/**
 * @param {string} email
 * @return {boolean}
 */
function ProposalBuilding_isValidBriefEmail_(email) {
  email = String(email || '').trim();
  if (!email || ProposalBuilding_isPlaceholderBriefText_(email)) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * @param {Object=} brief
 * @return {'es'|'en'}
 */
function ProposalBuilding_stakeholderLangCode_(brief) {
  brief = brief || {};
  if (String(brief.outputLocale || '').trim()) {
    return ProposalBuilding_outputLangCode_(brief);
  }
  var detected = String(brief.detectedLanguage || '').trim();
  if (detected) return ProposalBuilding_resolveLangCode_(detected);
  return UiStrings_activeLocale_();
}

/**
 * @param {{name:string,role:string,organization:string,email:string}} row
 * @param {'es'|'en'} langCode
 * @return {{name:string,role:string,organization:string,email:string}}
 */
function ProposalBuilding_finalizeStakeholderRow_(row, langCode) {
  row = row || {};
  var name = String(row.name || row.fullName || row.contact || '').trim();
  var role = String(row.role || row.title || row.position || '').trim();
  var org = String(row.organization || row.company || row.department || '').trim();
  var email = String(row.email || row.mail || '').trim();
  if ((!name || ProposalBuilding_isPlaceholderBriefText_(name)) && ProposalBuilding_isValidBriefEmail_(email)) {
    name = UiStrings_t(langCode || 'es', 'pb_stakeholder_email_only_fallback');
  }
  return {
    name: name,
    role: role,
    organization: org,
    email: email,
  };
}

/**
 * @param {Array<Object>} rows
 * @param {'es'|'en'} langCode
 * @return {Array<{name:string,role:string,organization:string,email:string}>}
 */
function ProposalBuilding_finalizeStakeholdersList_(rows, langCode) {
  var out = [];
  if (!Array.isArray(rows)) return out;
  var ri;
  for (ri = 0; ri < rows.length; ri++) {
    var row = ProposalBuilding_finalizeStakeholderRow_(rows[ri], langCode);
    if (ProposalBuilding_stakeholderHasEvidence_(row)) out.push(row);
  }
  return out;
}

/**
 * @param {{name:string,role:string,organization:string,email:string}} row
 * @return {boolean}
 */
function ProposalBuilding_stakeholderHasEvidence_(row) {
  row = row || {};
  var name = String(row.name || '').trim();
  if (name && !ProposalBuilding_isPlaceholderBriefText_(name)) return true;
  return ProposalBuilding_isValidBriefEmail_(row.email);
}

/**
 * @param {{amount:string,currency:string,notes:string}} budget
 * @return {boolean}
 */
function ProposalBuilding_budgetHasEvidence_(budget) {
  budget = budget || ProposalBuilding_normalizeBudget_(null);
  var amount = String(budget.amount || '').trim();
  var notes = String(budget.notes || '').trim();
  if (ProposalBuilding_isPlaceholderBriefText_(amount)) amount = '';
  if (ProposalBuilding_isPlaceholderBriefText_(notes)) notes = '';
  return !!(amount || notes);
}

/**
 * Elimina campos que el LLM suele rellenar con placeholders del esquema JSON.
 * @param {Object} brief
 * @return {Object}
 */
function ProposalBuilding_sanitizeInventedBriefFields_(brief) {
  brief = brief && typeof brief === 'object' ? brief : {};
  var out = {};
  var k;
  for (k in brief) {
    if (Object.prototype.hasOwnProperty.call(brief, k)) out[k] = brief[k];
  }

  out.stakeholders = ProposalBuilding_finalizeStakeholdersList_(
    out.stakeholders,
    ProposalBuilding_stakeholderLangCode_(out),
  );

  if (!ProposalBuilding_budgetHasEvidence_(out.budget)) {
    out.budget = { amount: '', currency: '', notes: '' };
  }

  var milestones = [];
  var msRows = Array.isArray(out.milestones) ? out.milestones : [];
  for (si = 0; si < msRows.length; si++) {
    var ms = msRows[si];
    if (!ms || typeof ms !== 'object') continue;
    var label = String(ms.label || '').trim();
    var date = String(ms.date || '').trim();
    var notes = String(ms.notes || '').trim();
    if (ProposalBuilding_isPlaceholderBriefText_(label)) label = '';
    if (!label && !date && !notes) continue;
    if (!label && date) label = date;
    milestones.push({ label: label, date: date, notes: notes });
  }
  out.milestones = milestones;

  if (ProposalBuilding_isPlaceholderBriefText_(out.rfpDeadline)) {
    out.rfpDeadline = '';
  }

  out.businessObjectives = ProposalBuilding_normalizeStringList_(out.businessObjectives).filter(function (row) {
    return !ProposalBuilding_isPlaceholderBriefText_(row);
  });
  out.constraints = ProposalBuilding_normalizeStringList_(out.constraints).filter(function (row) {
    return !ProposalBuilding_isPlaceholderBriefText_(row);
  });

  return out;
}

/**
 * @param {Object} parsed
 * @return {Object}
 */
function ProposalBuilding_normalizeBrief_(parsed) {
  var o = parsed && typeof parsed === 'object' ? parsed : {};
  var scopeItems = [];
  if (Array.isArray(o.scopeItems)) {
    for (var i = 0; i < o.scopeItems.length; i++) {
      var it = o.scopeItems[i];
      if (!it || typeof it !== 'object') continue;
      var title = String(it.title || it.name || '').trim();
      var desc = String(it.description || it.detail || it.summary || '').trim();
      if (!title && !desc) continue;
      scopeItems.push({ title: title, description: desc });
    }
  } else if (typeof o.scopeSummary === 'string' && o.scopeSummary.trim()) {
    scopeItems.push({ title: '', description: o.scopeSummary.trim() });
  }

  var milestones = [];
  if (Array.isArray(o.milestones)) {
    for (var j = 0; j < o.milestones.length; j++) {
      var ms = o.milestones[j];
      if (!ms || typeof ms !== 'object') continue;
      milestones.push({
        label: String(ms.label || ms.name || ms.title || '').trim(),
        date: String(ms.date || ms.deadline || ms.dueDate || '').trim(),
        notes: String(ms.notes || ms.description || '').trim(),
      });
    }
  }

  var lang = String(o.detectedLanguage || o.language || '').trim().toLowerCase();
  if (lang.indexOf('en') === 0) lang = 'en';
  else if (lang.indexOf('es') === 0) lang = 'es';
  else lang = '';

  var outputLocale = String(o.outputLocale || o.outputLanguage || '').trim().toLowerCase();
  if (outputLocale.indexOf('en') === 0) outputLocale = 'en';
  else if (outputLocale.indexOf('es') === 0) outputLocale = 'es';
  else outputLocale = '';

  var techHints = [];
  if (Array.isArray(o.technologyHints)) {
    for (var ti = 0; ti < o.technologyHints.length; ti++) {
      var th = String(o.technologyHints[ti] || '').trim();
      if (th) techHints.push(th);
    }
  }

  var brief = {
    clientName: ProposalBuilding_sanitizeExtractedClientName_(
      String(o.clientName || o.client_name || '').trim(),
    ),
    projectSummary: String(o.projectSummary || o.summary || o.overview || '').trim(),
    scopeItems: scopeItems,
    commercialModel: ProposalBuilding_normalizeCommercialModel_(o.commercialModel || o.pricing_model),
    milestones: milestones,
    technologyHints: techHints,
    stakeholders: ProposalBuilding_normalizeStakeholders_(o.stakeholders),
    budget: ProposalBuilding_normalizeBudget_(o.budget || o.budgetNotes),
    businessObjectives: ProposalBuilding_normalizeStringList_(o.businessObjectives || o.objectives),
    constraints: ProposalBuilding_normalizeStringList_(o.constraints || o.risks),
    submissionDeliverables: ProposalBuilding_normalizeSubmissionDeliverables_(
      o.submissionDeliverables || o.deliverables || o.submissionRequirements,
    ),
    rfpDeadline: String(o.rfpDeadline || o.proposalDeadline || o.submissionDeadline || '').trim(),
    detectedLanguage: lang,
    outputLocale: outputLocale,
    confidence: String(o.confidence || 'medium').trim().toLowerCase(),
    warnings: Array.isArray(o.warnings)
      ? o.warnings.map(function (w) {
          return String(w || '').trim();
        }).filter(function (w) {
          return !!w;
        })
      : [],
  };
  return ProposalBuilding_sanitizeInventedBriefFields_(brief);
}

/**
 * @param {*} value
 * @return {Array<string>}
 */
function ProposalBuilding_normalizeStringList_(value) {
  var out = [];
  var seen = {};
  if (Array.isArray(value)) {
    for (var i = 0; i < value.length; i++) {
      var row = String(value[i] || '').trim();
      if (!row) continue;
      var key = row.toLowerCase();
      if (!seen[key]) {
        out.push(row);
        seen[key] = true;
      }
    }
    return out;
  }
  var text = String(value || '').trim();
  if (!text) return out;
  var lines = text.split(/\n+/);
  for (var j = 0; j < lines.length; j++) {
    var line = String(lines[j] || '').trim();
    if (!line) continue;
    var lk = line.toLowerCase();
    if (!seen[lk]) {
      out.push(line);
      seen[lk] = true;
    }
  }
  return out;
}

/**
 * @param {*} rows
 * @return {Array<{name:string,role:string,organization:string,email:string}>}
 */
function ProposalBuilding_normalizeStakeholders_(rows) {
  var out = [];
  if (!Array.isArray(rows)) return out;
  var ri;
  for (ri = 0; ri < rows.length; ri++) {
    var row = rows[ri];
    if (!row || typeof row !== 'object') continue;
    var name = String(row.name || row.fullName || row.contact || '').trim();
    var role = String(row.role || row.title || row.position || '').trim();
    var org = String(row.organization || row.company || row.department || '').trim();
    var email = String(row.email || row.mail || '').trim();
    if (!name && !role && !email) continue;
    out.push({
      name: name,
      role: role,
      organization: org,
      email: email,
    });
  }
  return out;
}

/**
 * @param {*} raw
 * @return {{amount:string,currency:string,notes:string}}
 */
function ProposalBuilding_normalizeBudget_(raw) {
  if (typeof raw === 'string') {
    return { amount: '', currency: '', notes: String(raw || '').trim() };
  }
  var b = raw && typeof raw === 'object' ? raw : {};
  return {
    amount: String(b.amount || b.value || b.total || '').trim(),
    currency: String(b.currency || b.ccy || '').trim().toUpperCase(),
    notes: String(b.notes || b.description || b.range || '').trim(),
  };
}

/**
 * @param {Object} base
 * @param {Object} incoming
 * @return {Object}
 */
function ProposalBuilding_mergeBriefs_(base, incoming) {
  base = ProposalBuilding_normalizeBrief_(base || {});
  incoming = ProposalBuilding_normalizeBrief_(incoming || {});
  if (!base.clientName && incoming.clientName) base.clientName = incoming.clientName;
  if (!base.projectSummary && incoming.projectSummary) {
    base.projectSummary = incoming.projectSummary;
  } else if (base.projectSummary && incoming.projectSummary && base.projectSummary !== incoming.projectSummary) {
    base.projectSummary = base.projectSummary + '\n\n' + incoming.projectSummary;
  }
  if (!base.commercialModel && incoming.commercialModel) {
    base.commercialModel = incoming.commercialModel;
  }
  if (!base.detectedLanguage && incoming.detectedLanguage) {
    base.detectedLanguage = incoming.detectedLanguage;
  }
  if (incoming.outputLocale) {
    base.outputLocale = incoming.outputLocale;
  }
  if (!base.rfpDeadline && incoming.rfpDeadline) {
    base.rfpDeadline = incoming.rfpDeadline;
  }
  base.budget = base.budget || ProposalBuilding_normalizeBudget_(null);
  incoming.budget = incoming.budget || ProposalBuilding_normalizeBudget_(null);
  if (!base.budget.amount && incoming.budget.amount) base.budget.amount = incoming.budget.amount;
  if (!base.budget.currency && incoming.budget.currency) {
    base.budget.currency = incoming.budget.currency;
  }
  if (!base.budget.notes && incoming.budget.notes) {
    base.budget.notes = incoming.budget.notes;
  } else if (base.budget.notes && incoming.budget.notes && base.budget.notes !== incoming.budget.notes) {
    base.budget.notes = base.budget.notes + '\n' + incoming.budget.notes;
  }
  var shKey = function (s) {
    return (
      String(s.name || '').trim().toLowerCase() +
      '|' +
      String(s.role || '').trim().toLowerCase() +
      '|' +
      String(s.email || '').trim().toLowerCase()
    );
  };
  var shSeen = {};
  var sh;
  for (sh = 0; sh < base.stakeholders.length; sh++) {
    shSeen[shKey(base.stakeholders[sh])] = true;
  }
  for (sh = 0; sh < incoming.stakeholders.length; sh++) {
    var shRow = incoming.stakeholders[sh];
    var shk = shKey(shRow);
    if (!shSeen[shk]) {
      base.stakeholders.push(shRow);
      shSeen[shk] = true;
    }
  }
  base.businessObjectives = ProposalBuilding_mergeStringLists_(base.businessObjectives, incoming.businessObjectives);
  base.constraints = ProposalBuilding_mergeStringLists_(base.constraints, incoming.constraints);
  var scopeKey = function (it) {
    return (
      String(it.title || '').trim().toLowerCase() +
      '|' +
      String(it.description || '').trim().toLowerCase()
    );
  };
  var scopeSeen = {};
  var si;
  for (si = 0; si < base.scopeItems.length; si++) {
    scopeSeen[scopeKey(base.scopeItems[si])] = true;
  }
  for (si = 0; si < incoming.scopeItems.length; si++) {
    var scopeRow = incoming.scopeItems[si];
    var sk = scopeKey(scopeRow);
    if (!scopeSeen[sk]) {
      var mergedScope = false;
      var sj;
      for (sj = 0; sj < base.scopeItems.length; sj++) {
        var baseTitle = String(base.scopeItems[sj].title || '').trim().toLowerCase();
        var incTitle = String(scopeRow.title || '').trim().toLowerCase();
        if (!baseTitle || !incTitle || baseTitle !== incTitle) continue;
        var baseDesc = String(base.scopeItems[sj].description || '').trim();
        var incDesc = String(scopeRow.description || '').trim();
        if (incDesc && baseDesc.indexOf(incDesc) < 0 && incDesc.indexOf(baseDesc) < 0) {
          base.scopeItems[sj].description = baseDesc ? baseDesc + '\n\n' + incDesc : incDesc;
        } else if (incDesc && !baseDesc) {
          base.scopeItems[sj].description = incDesc;
        }
        mergedScope = true;
        break;
      }
      if (!mergedScope) {
        base.scopeItems.push(scopeRow);
        scopeSeen[sk] = true;
      }
    }
  }
  var msKey = function (m) {
    return (
      String(m.label || '').trim().toLowerCase() +
      '|' +
      String(m.date || '').trim().toLowerCase()
    );
  };
  var msSeen = {};
  var mj;
  for (mj = 0; mj < base.milestones.length; mj++) {
    msSeen[msKey(base.milestones[mj])] = true;
  }
  for (mj = 0; mj < incoming.milestones.length; mj++) {
    var msRow = incoming.milestones[mj];
    var mk = msKey(msRow);
    if (!msSeen[mk]) {
      base.milestones.push(msRow);
      msSeen[mk] = true;
    }
  }
  var techSeen = {};
  var tk;
  for (tk = 0; tk < base.technologyHints.length; tk++) {
    techSeen[String(base.technologyHints[tk] || '').trim().toLowerCase()] = true;
  }
  for (tk = 0; tk < incoming.technologyHints.length; tk++) {
    var thRow = String(incoming.technologyHints[tk] || '').trim();
    if (!thRow) continue;
    var thKey = thRow.toLowerCase();
    if (!techSeen[thKey]) {
      base.technologyHints.push(thRow);
      techSeen[thKey] = true;
    }
  }
  var warnSeen = {};
  var wi;
  for (wi = 0; wi < base.warnings.length; wi++) {
    warnSeen[String(base.warnings[wi] || '').trim()] = true;
  }
  for (wi = 0; wi < incoming.warnings.length; wi++) {
    var wRow = String(incoming.warnings[wi] || '').trim();
    if (wRow && !warnSeen[wRow]) {
      base.warnings.push(wRow);
      warnSeen[wRow] = true;
    }
  }
  var deliverableKey = function (d) {
    return (
      String(d.item || '').trim().toLowerCase() +
      '|' +
      String(d.dueDate || '').trim().toLowerCase() +
      '|' +
      String(d.category || '').trim().toLowerCase()
    );
  };
  var deliverableSeen = {};
  var di;
  for (di = 0; di < base.submissionDeliverables.length; di++) {
    deliverableSeen[deliverableKey(base.submissionDeliverables[di])] = true;
  }
  for (di = 0; di < incoming.submissionDeliverables.length; di++) {
    var deliverableRow = incoming.submissionDeliverables[di];
    var dk = deliverableKey(deliverableRow);
    if (!deliverableSeen[dk]) {
      base.submissionDeliverables.push(deliverableRow);
      deliverableSeen[dk] = true;
    }
  }
  return base;
}

/**
 * @param {Array<string>} a
 * @param {Array<string>} b
 * @return {Array<string>}
 */
function ProposalBuilding_mergeStringLists_(a, b) {
  return ProposalBuilding_normalizeStringList_((a || []).concat(b || []));
}

function ProposalBuilding_isAiPodsStudioName_(name) {
  var n = String(name || '').trim().toLowerCase().replace(/\s+/g, ' ');
  return n === 'globant ai' || n === 'globant ai-pods' || n === 'globant ai pods';
}

/**
 * @param {string} name
 * @return {string}
 */
function ProposalBuilding_normalizeStudioName_(name) {
  if (ProposalBuilding_isAiPodsStudioName_(name)) {
    return PROPOSAL_BUILDING_AI_PODS_STUDIO_NAME_;
  }
  return String(name || '').trim();
}

/**
 * @param {Array<Object>} studios
 * @return {Array<Object>}
 */
function ProposalBuilding_normalizeStudioRecommendationNames_(studios) {
  var out = [];
  var seenAiPods = false;
  var i;
  for (i = 0; i < studios.length; i++) {
    var st = studios[i];
    if (!st || typeof st !== 'object') continue;
    var name = ProposalBuilding_normalizeStudioName_(st.studioName);
    if (name === PROPOSAL_BUILDING_AI_PODS_STUDIO_NAME_) {
      if (seenAiPods) continue;
      seenAiPods = true;
    }
    var row = {};
    var k;
    for (k in st) {
      if (Object.prototype.hasOwnProperty.call(st, k)) row[k] = st[k];
    }
    row.studioName = name;
    out.push(row);
  }
  return out;
}

/**
 * @param {Array<string>} offerings
 * @return {Array<string>}
 */
function ProposalBuilding_ensureOfferingsIncludeAiPods_(offerings) {
  var out = Array.isArray(offerings) ? offerings.slice() : [];
  var has = false;
  var i;
  for (i = 0; i < out.length; i++) {
    if (String(out[i] || '').trim().toUpperCase() === 'AI_PODS') {
      has = true;
      break;
    }
  }
  if (!has) out.unshift('AI_PODS');
  return out;
}

/**
 * @param {Object} brief
 * @param {string=} industryKey
 * @return {Object} pitch normalizado
 */
function ProposalBuilding_buildAiPodsPitch_(brief, industryKey) {
  brief = ProposalBuilding_normalizeBrief_(brief || {});
  var industry = String(industryKey || '').trim();
  var prompt = PromptCatalog_render('pb.ai_pods_pitch.user', {
    briefJson: JSON.stringify(brief).slice(0, 80000),
    industry: industry || '(not specified)',
    outputLanguage: ProposalBuilding_briefOutputLanguageLabel_(brief),
  });
  var r = AgentOrchestrator_answerWith(prompt, _ADMIN_AGENT_ID_PROPOSALS, []);
  var text = String(r.answer || '').trim();
  if (!text || r.isUnanswered || text.indexOf('[[NO_RELEVANT_CONTENT]]') >= 0) {
    return ProposalBuilding_defaultAiPodsPitch_(brief);
  }
  var parsed = ContentExtraction_parseLooseJson_(text);
  return ProposalBuilding_normalizeAiPodsPitch_(parsed, brief);
}

function ProposalBuilding_resolveLangCode_(raw) {
  var lang = String(raw || '').trim().toLowerCase();
  if (lang.indexOf('en') === 0) return 'en';
  return 'es';
}

/**
 * Idioma de salida del LLM (UI del usuario / elección explícita). No usa el idioma del documento.
 * @param {Object=} brief
 * @return {'es'|'en'}
 */
function ProposalBuilding_outputLangCode_(brief) {
  brief = brief || {};
  var fromBrief = String(brief.outputLocale || brief.outputLanguage || '').trim();
  if (fromBrief) return ProposalBuilding_resolveLangCode_(fromBrief);
  return UiStrings_activeLocale_();
}

/**
 * @param {Object=} brief
 * @return {'es'|'en'}
 */
function ProposalBuilding_briefLangCode_(brief) {
  return ProposalBuilding_outputLangCode_(brief);
}

/**
 * @param {Object=} brief
 * @return {string}
 */
function ProposalBuilding_briefOutputLanguageLabel_(brief) {
  return ProposalBuilding_briefLangCode_(brief) === 'en' ? 'English' : 'Spanish';
}

/**
 * @param {Object} brief
 * @return {Object}
 */
function ProposalBuilding_defaultAiPodsPitch_(brief) {
  brief = ProposalBuilding_normalizeBrief_(brief || {});
  var lang = ProposalBuilding_briefLangCode_(brief);
  return {
    summary: UiStrings_t(lang, 'pb_studio_ai_pods_fallback_rationale'),
    whyReasons: [],
    slideHooks: [],
    vsTraditional: [],
    sellerTechniques: [],
  };
}

/**
 * @param {*} raw
 * @param {Object=} brief
 * @return {Object}
 */
function ProposalBuilding_normalizeAiPodsPitch_(raw, brief) {
  var o = raw && typeof raw === 'object' ? raw : {};
  var out = ProposalBuilding_defaultAiPodsPitch_(brief || {});
  out.summary = String(o.summary || out.summary || '').trim() || out.summary;

  function mapList(src, mapper, maxItems) {
    var list = Array.isArray(src) ? src : [];
    var items = [];
    var i;
    for (i = 0; i < list.length && items.length < maxItems; i++) {
      var row = mapper(list[i]);
      if (row) items.push(row);
    }
    return items;
  }

  out.whyReasons = mapList(
    o.whyReasons,
    function (row) {
      if (!row || typeof row !== 'object') return null;
      var title = String(row.title || row.headline || '').trim();
      var detail = String(row.detail || row.reason || row.description || '').trim();
      if (!title && !detail) return null;
      return {
        title: title || detail.slice(0, 80),
        detail: detail || title,
        briefAnchor: String(row.briefAnchor || row.anchor || row.brief_link || '').trim(),
      };
    },
    10,
  );

  out.slideHooks = mapList(
    o.slideHooks || o.hooks,
    function (row) {
      if (!row || typeof row !== 'object') return null;
      var headline = String(row.headline || row.title || '').trim();
      var talkTrack = String(row.talkTrack || row.talk_track || row.script || '').trim();
      if (!headline && !talkTrack) return null;
      return {
        headline: headline || talkTrack.slice(0, 80),
        talkTrack: talkTrack || headline,
        slideHint: String(row.slideHint || row.slide_hint || row.visual || '').trim(),
      };
    },
    7,
  );

  out.vsTraditional = mapList(
    o.vsTraditional || o.comparisons || o.vs_traditional,
    function (row) {
      if (!row || typeof row !== 'object') return null;
      var traditional = String(row.traditional || row.legacy || row.before || '').trim();
      var aiPods = String(row.aiPods || row.ai_pods || row.after || '').trim();
      if (!traditional && !aiPods) return null;
      return {
        traditional: traditional || UiStrings_t(UiStrings_activeLocale_(), 'label_em_dash'),
        aiPods: aiPods || UiStrings_t(UiStrings_activeLocale_(), 'label_em_dash'),
        sellerAngle: String(row.sellerAngle || row.seller_angle || row.angle || '').trim(),
      };
    },
    6,
  );

  out.sellerTechniques = mapList(
    o.sellerTechniques || o.techniques || o.seller_techniques,
    function (row) {
      if (!row || typeof row !== 'object') return null;
      var technique = String(row.technique || row.name || '').trim();
      if (!technique) return null;
      return {
        technique: technique,
        whenToUse: String(row.whenToUse || row.when_to_use || row.when || '').trim(),
        examplePhrase: String(row.examplePhrase || row.example_phrase || row.phrase || '').trim(),
      };
    },
    6,
  );

  return out;
}

/**
 * Texto plano del pitch para rationale / contexto del asesor.
 * @param {Object} pitch
 * @return {string}
 */
function ProposalBuilding_formatAiPodsPitchAsText_(pitch) {
  pitch = pitch && typeof pitch === 'object' ? pitch : {};
  var lines = [];
  var summary = String(pitch.summary || '').trim();
  if (summary) lines.push(summary);

  var wi;
  var why = Array.isArray(pitch.whyReasons) ? pitch.whyReasons : [];
  if (why.length) {
    lines.push('');
    lines.push(UiStrings_t(UiStrings_activeLocale_(), 'pb_ai_pods_pitch_why_heading') + ':');
    for (wi = 0; wi < why.length; wi++) {
      var w = why[wi];
      if (!w) continue;
      lines.push(
        String(wi + 1) +
          '. ' +
          String(w.title || '').trim() +
          (w.detail ? ' — ' + String(w.detail).trim() : ''),
      );
    }
  }

  var hi;
  var hooks = Array.isArray(pitch.slideHooks) ? pitch.slideHooks : [];
  if (hooks.length) {
    lines.push('');
    lines.push(UiStrings_t(UiStrings_activeLocale_(), 'pb_ai_pods_pitch_hooks_heading') + ':');
    for (hi = 0; hi < hooks.length; hi++) {
      var h = hooks[hi];
      if (!h) continue;
      lines.push('- ' + String(h.headline || '').trim() + ': ' + String(h.talkTrack || '').trim());
    }
  }

  return lines.join('\n').trim();
}

/**
 * @param {Object} brief
 * @param {string=} industryKey
 * @return {string}
 * @deprecated Usar ProposalBuilding_buildAiPodsPitch_ + formatAiPodsPitchAsText_.
 */
function ProposalBuilding_buildAiPodsRationale_(brief, industryKey) {
  var pitch = ProposalBuilding_buildAiPodsPitch_(brief, industryKey);
  return ProposalBuilding_formatAiPodsPitchAsText_(pitch);
}

/**
 * @param {Array<Object>} studios
 * @param {Object} brief
 * @param {string=} industryKey
 * @return {Array<Object>}
 */
function ProposalBuilding_enrichAiPodsStudioRationale_(studios, brief, industryKey) {
  var out = Array.isArray(studios) ? studios.slice() : [];
  var pitch = ProposalBuilding_buildAiPodsPitch_(brief, industryKey);
  var rationale = ProposalBuilding_formatAiPodsPitchAsText_(pitch);
  var i;
  for (i = 0; i < out.length; i++) {
    if (ProposalBuilding_normalizeStudioName_(out[i].studioName) !== PROPOSAL_BUILDING_AI_PODS_STUDIO_NAME_) {
      continue;
    }
    out[i].studioName = PROPOSAL_BUILDING_AI_PODS_STUDIO_NAME_;
    out[i].offerings = ProposalBuilding_ensureOfferingsIncludeAiPods_(out[i].offerings);
    out[i].rationale = rationale;
    out[i].aiPodsPitch = pitch;
    out[i].priority = 'high';
    out[i].studioType = 'digital';
    break;
  }
  return out;
}

/**
 * @param {Object} brief
 * @param {Array<string>} excludeLower
 * @return {string}
 */
function ProposalBuilding_pickSecondDigitalStudio_(brief, excludeLower) {
  var exclude = {};
  var i;
  for (i = 0; i < excludeLower.length; i++) {
    exclude[String(excludeLower[i] || '').trim().toLowerCase()] = true;
  }
  var candidates = [
    ProposalBuilding_defaultDigitalStudioForBrief_(brief, ''),
    'Globant Engineering',
    'Globant Data',
    'Globant CloudOps',
    'Quality Engineering',
    'Globant Cybersecurity',
  ];
  for (i = 0; i < candidates.length; i++) {
    var name = ProposalBuilding_normalizeStudioName_(candidates[i]);
    var key = name.toLowerCase();
    if (!name || exclude[key]) continue;
    if (name === PROPOSAL_BUILDING_AI_PODS_STUDIO_NAME_ && exclude[key]) continue;
    return name;
  }
  return 'Globant Engineering';
}

/**
 * @param {Array<Object>} studios
 * @param {Object} brief
 * @param {string=} industryKey
 * @return {Array<Object>}
 */
function ProposalBuilding_applyStudioRecommendationPolicy_(studios, brief, industryKey) {
  var out = ProposalBuilding_normalizeStudioRecommendationNames_(
    Array.isArray(studios) ? studios : [],
  );
  var i;
  var aiPodsIdx = -1;
  for (i = 0; i < out.length; i++) {
    out[i].studioName = ProposalBuilding_normalizeStudioName_(out[i].studioName);
    out[i].studioType = ProposalBuilding_normalizeStudioType_(out[i].studioType, out[i].studioName);
    out[i].priority = String(out[i].priority || 'medium').trim().toLowerCase();
    if (out[i].studioName === PROPOSAL_BUILDING_AI_PODS_STUDIO_NAME_) {
      aiPodsIdx = i;
    }
  }
  if (aiPodsIdx < 0) {
    out.unshift({
      studioName: PROPOSAL_BUILDING_AI_PODS_STUDIO_NAME_,
      studioType: 'digital',
      offerings: ['AI_PODS'],
      rationale: '',
      priority: 'high',
      contentId: '',
    });
  } else {
    out[aiPodsIdx].offerings = ProposalBuilding_ensureOfferingsIncludeAiPods_(out[aiPodsIdx].offerings);
    out[aiPodsIdx].priority = 'high';
    out[aiPodsIdx].studioType = 'digital';
  }

  var digitalNames = [];
  var aiCount = 0;
  for (i = 0; i < out.length; i++) {
    if (out[i].studioType === 'digital') {
      digitalNames.push(String(out[i].studioName || '').trim().toLowerCase());
    }
    if (out[i].studioType === 'ai') aiCount++;
  }
  if (digitalNames.length < 2) {
    out.push({
      studioName: ProposalBuilding_pickSecondDigitalStudio_(brief, digitalNames),
      studioType: 'digital',
      offerings: [],
      rationale: UiStrings_t(ProposalBuilding_briefLangCode_(brief), 'pb_studio_taxonomy_fallback_rationale'),
      priority: 'medium',
      contentId: '',
    });
  }
  if (aiCount < 1) {
    var aiDefault = ProposalBuilding_defaultAiStudioForBrief_(brief, industryKey);
    if (aiDefault) {
      out.push({
        studioName: aiDefault,
        studioType: 'ai',
        offerings: [],
        rationale: UiStrings_t(ProposalBuilding_briefLangCode_(brief), 'pb_studio_taxonomy_fallback_rationale'),
        priority: 'high',
        contentId: '',
      });
    }
  }

  var aiSeen = 0;
  for (i = 0; i < out.length; i++) {
    var row = out[i];
    if (row.studioName === PROPOSAL_BUILDING_AI_PODS_STUDIO_NAME_) {
      row.priority = 'high';
      row.studioType = 'digital';
      continue;
    }
    if (row.studioType === 'digital') {
      row.priority = 'medium';
      continue;
    }
    if (row.studioType === 'ai') {
      row.priority = aiSeen === 0 ? 'high' : 'medium';
      aiSeen++;
    }
  }

  return out;
}

/**
 * @param {string} studioName
 * @return {string}
 */
function ProposalBuilding_studioKgNodeId_(studioName) {
  var slug = KnowledgeGraph_slug_(studioName);
  if (!slug || slug === 'unknown') return '';
  return KnowledgeGraph_nodeId_('studio', slug);
}

/**
 * @param {string} name
 * @param {Array<Object>} catalogStudios
 * @return {Object|null}
 */
function ProposalBuilding_findCatalogStudio_(name, catalogStudios) {
  var lookupName = String(name || '').trim();
  if (ProposalBuilding_normalizeStudioName_(lookupName) === PROPOSAL_BUILDING_AI_PODS_STUDIO_NAME_) {
    lookupName = 'Globant AI';
  }
  var target = lookupName.toLowerCase();
  if (!target) return null;
  var list = Array.isArray(catalogStudios) ? catalogStudios : [];
  var i;
  for (i = 0; i < list.length; i++) {
    var row = list[i];
    if (String(row.studioName || '').trim().toLowerCase() === target) return row;
  }
  for (i = 0; i < list.length; i++) {
    var rowLoose = list[i];
    var cn = String(rowLoose.studioName || '').trim().toLowerCase();
    if (!cn) continue;
    if (cn.indexOf(target) >= 0 || target.indexOf(cn) >= 0) return rowLoose;
  }
  return null;
}

/**
 * Resuelve título y URL Drive del PDF de catálogo vinculado a un content_id.
 * @param {string} contentId
 * @return {{title:string,driveFileUrl:string}}
 */
function ProposalBuilding_resolveStudioDocumentFromCatalog_(contentId) {
  var id = String(contentId || '').trim();
  if (!id) return { title: '', driveFileUrl: '' };
  try {
    var got = ContentCatalog_get(id);
    var common = got && got.item && got.item.common ? got.item.common : {};
    return {
      title: String(common.title || '').trim(),
      driveFileUrl: String(common.drive_file_url || '').trim(),
    };
  } catch (eResolve) {
    return { title: '', driveFileUrl: '' };
  }
}

/**
 * @param {Array<Object>} studios
 * @param {Array<Object>} catalogStudios
 * @return {Array<Object>}
 */
function ProposalBuilding_enrichStudioRecommendations_(studios, catalogStudios) {
  var out = [];
  var i;
  for (i = 0; i < studios.length; i++) {
    var st = studios[i];
    if (!st || typeof st !== 'object') continue;
    var studioType = ProposalBuilding_normalizeStudioType_(
      st.studioType || st.studio_type || st.type,
      st.studioName,
    );
    var normalizedName = ProposalBuilding_normalizeStudioName_(String(st.studioName || '').trim());
    var enriched = {
      studioName: normalizedName,
      studioType: studioType,
      offerings: Array.isArray(st.offerings) ? st.offerings.slice() : [],
      rationale: String(st.rationale || '').trim(),
      priority: String(st.priority || 'medium').trim().toLowerCase(),
      contentId: String(st.contentId || '').trim(),
      catalogTitle: '',
      driveFileUrl: '',
      kgNodeId: ProposalBuilding_studioKgNodeId_(
        normalizedName === PROPOSAL_BUILDING_AI_PODS_STUDIO_NAME_ ? 'Globant AI' : normalizedName,
      ),
      contentIds: [],
    };
    if (st.aiPodsPitch && typeof st.aiPodsPitch === 'object') {
      enriched.aiPodsPitch = st.aiPodsPitch;
    }
    var whyFit = ProposalBuilding_normalizeWhyFit_(st.whyFit || st.why_fit);
    if (whyFit) {
      enriched.whyFit = whyFit;
      if (!enriched.rationale && whyFit.summary) enriched.rationale = whyFit.summary;
    }
    var cat = ProposalBuilding_findCatalogStudio_(enriched.studioName, catalogStudios);
    if (cat) {
      enriched.contentIds = Array.isArray(cat.contentIds) ? cat.contentIds.slice() : [];
      if (!enriched.contentId && enriched.contentIds.length) {
        enriched.contentId = enriched.contentIds[0];
      }
      if (cat.kgNodeId) enriched.kgNodeId = cat.kgNodeId;
      if (Array.isArray(cat.catalogItems) && enriched.contentId) {
        var ci;
        for (ci = 0; ci < cat.catalogItems.length; ci++) {
          var item = cat.catalogItems[ci];
          if (item && item.contentId === enriched.contentId) {
            enriched.catalogTitle = String(item.title || '').trim();
            enriched.driveFileUrl = String(item.driveFileUrl || '').trim();
            break;
          }
        }
      }
      if (!enriched.catalogTitle && cat.catalogItems && cat.catalogItems.length) {
        enriched.catalogTitle = String(cat.catalogItems[0].title || '').trim();
        enriched.driveFileUrl = String(cat.catalogItems[0].driveFileUrl || '').trim();
        if (!enriched.contentId) enriched.contentId = String(cat.catalogItems[0].contentId || '').trim();
      }
    }
    if (enriched.contentId && enriched.contentIds.indexOf(enriched.contentId) < 0) {
      enriched.contentIds.unshift(enriched.contentId);
    }
    if (enriched.contentId) {
      var docRef = ProposalBuilding_resolveStudioDocumentFromCatalog_(enriched.contentId);
      if (docRef.title && !enriched.catalogTitle) enriched.catalogTitle = docRef.title;
      if (docRef.driveFileUrl && !enriched.driveFileUrl) {
        enriched.driveFileUrl = docRef.driveFileUrl;
      }
    }
    out.push(enriched);
  }
  return out;
}

/**
 * @param {string} rawName
 * @param {string} fileHint
 * @param {number=} limit
 * @return {Array<Object>}
 */
function ProposalBuilding_listClientSuggestions_(rawName, fileHint, limit) {
  limit = Math.min(5, Math.max(1, Number(limit) || 3));
  var rows = ClientsMasterStore_listAll();
  if (!rows.length) return [];
  var uniq = ClientsMaster_buildMatchCandidates_(rawName, fileHint);
  var scored = [];
  var ri;
  for (ri = 0; ri < rows.length; ri++) {
    var client = ClientsMasterStore_toApiItem_(rows[ri]);
    var cn = ClientsMaster_normalizeName_(client.client_name);
    if (!cn || cn.length < 2) continue;
    var bestForClient = 0;
    var uj;
    for (uj = 0; uj < uniq.length; uj++) {
      var candRaw = uniq[uj];
      var cand = ClientsMaster_normalizeName_(candRaw);
      if (!cand || cand.length < 2) continue;
      var score = ClientsMaster_combinedMatchScore_(
        cand,
        cn,
        candRaw,
        client.client_name,
      );
      if (score > bestForClient) bestForClient = score;
    }
    if (bestForClient > 0.25) {
      scored.push({
        client_name: client.client_name,
        industry: String(client.industry || '').trim(),
        sub_industry: String(client.sub_industry || '').trim(),
        matchScore: bestForClient,
      });
    }
  }
  scored.sort(function (a, b) {
    return b.matchScore - a.matchScore;
  });
  return scored.slice(0, limit);
}

/**
 * @param {Object} brief
 * @param {Array<string>} sourceFileNames
 * @return {Object}
 */
function ProposalBuilding_enrichBriefWithClientMatch_(brief, sourceFileNames) {
  brief = ProposalBuilding_normalizeBrief_(brief || {});
  var extracted = String(brief.clientName || '').trim();
  brief.clientMatch = {
    extractedName: extracted,
    matched: false,
    catalogClientName: '',
    industry: '',
    subIndustry: '',
    matchScore: 0,
    suggestions: [],
  };
  brief.suggestedClientName = extracted;

  if (!extracted || ProposalBuilding_isWeakClientName_(extracted)) {
    return brief;
  }

  var match = ClientsMaster_matchFromHints_(extracted, '');
  if (
    match.matched &&
    match.client_name &&
    ProposalBuilding_catalogClientMatchAllowed_(extracted, match.client_name, match.matchScore)
  ) {
    brief.clientMatch = {
      extractedName: extracted,
      matched: true,
      catalogClientName: String(match.client_name || '').trim(),
      industry: String(match.industry || '').trim(),
      subIndustry: String(match.sub_industry || '').trim(),
      matchScore: Number(match.matchScore) || 1,
      suggestions: [],
    };
  } else {
    brief.clientMatch.suggestions = ProposalBuilding_listClientSuggestions_(extracted, '', 3);
  }
  return brief;
}

/**
 * @return {Array<Object>}
 */
function ProposalBuilding_listStudiosFromCatalog_() {
  var rows = ContentCatalogStore_listAllPages_({ contentType: 'proposal' }, 100, 5000);
  var byStudio = {};
  var i;
  for (i = 0; i < rows.length; i++) {
    var apiItem = ContentCatalogStore_toApiItem_(rows[i], ContentCatalog_csvToTags_);
    var spec = apiItem.specific || {};
    var common = apiItem.common || {};
    var mk = String(spec.material_kind || '').trim().toUpperCase();
    var studio = String(spec.globant_studio || '').trim();
    var ctype = String(common.content_type || '').trim();
    if (!studio && mk !== 'GLOBANT_STUDIO' && ctype !== 'proposal') continue;
    if (!studio) studio = String(common.title || '').trim();
    if (!studio) continue;
    var key = studio.toLowerCase();
    if (!byStudio[key]) {
      byStudio[key] = {
        studioName: studio,
        offerings: [],
        contentIds: [],
        summaries: [],
        catalogItems: [],
        kgNodeId: ProposalBuilding_studioKgNodeId_(studio),
      };
    }
    var off = String(spec.offering || spec.pricing_model || '').trim();
    if (off && byStudio[key].offerings.indexOf(off) < 0) {
      byStudio[key].offerings.push(off);
    }
    if (common.content_id && byStudio[key].contentIds.indexOf(common.content_id) < 0) {
      byStudio[key].contentIds.push(common.content_id);
      byStudio[key].catalogItems.push({
        contentId: common.content_id,
        title: String(common.title || '').trim(),
        driveFileUrl: String(common.drive_file_url || '').trim(),
        materialKind: mk,
      });
    }
    var sum = String(common.summary || '').trim();
    if (sum && byStudio[key].summaries.length < 2) {
      byStudio[key].summaries.push(sum.slice(0, 420));
    }
  }
  var out = [];
  var k;
  for (k in byStudio) {
    if (!Object.prototype.hasOwnProperty.call(byStudio, k)) continue;
    out.push(byStudio[k]);
  }
  out.sort(function (a, b) {
    return String(a.studioName || '').localeCompare(String(b.studioName || ''));
  });
  return out;
}

/**
 * @param {*} raw
 * @return {Object|null}
 */
function ProposalBuilding_normalizeWhyFit_(raw) {
  var o = raw && typeof raw === 'object' ? raw : {};
  var out = {
    summary: String(o.summary || o.overview || o.executiveSummary || '').trim(),
    fitScore: null,
    keyPoints: [],
    comparisons: [],
    briefLinks: [],
  };
  var scoreRaw = o.fitScore != null ? o.fitScore : o.fit_score != null ? o.fit_score : o.score;
  var score = parseInt(scoreRaw, 10);
  if (!isNaN(score)) {
    if (score > 0 && score <= 10) score = score * 10;
    if (score >= 0 && score <= 100) out.fitScore = score;
  }

  function mapList(src, mapper, maxItems) {
    var list = Array.isArray(src) ? src : [];
    var items = [];
    var i;
    for (i = 0; i < list.length && items.length < maxItems; i++) {
      var row = mapper(list[i]);
      if (row) items.push(row);
    }
    return items;
  }

  out.keyPoints = mapList(
    o.keyPoints || o.key_points || o.reasons || o.points,
    function (row) {
      if (!row || typeof row !== 'object') return null;
      var title = String(row.title || row.headline || row.label || '').trim();
      var detail = String(row.detail || row.reason || row.description || row.text || '').trim();
      if (!title && !detail) return null;
      return {
        title: title || detail.slice(0, 80),
        detail: detail || title,
        briefAnchor: String(row.briefAnchor || row.anchor || row.brief_link || row.briefNeed || '').trim(),
      };
    },
    6,
  );

  out.comparisons = mapList(
    o.comparisons || o.comparison || o.vs || o.tradeoffs,
    function (row) {
      if (!row || typeof row !== 'object') return null;
      var aspect = String(row.aspect || row.dimension || row.topic || row.label || '').trim();
      var withoutStudio = String(
        row.withoutStudio || row.without || row.before || row.traditional || row.legacy || '',
      ).trim();
      var withStudio = String(
        row.withStudio || row.with || row.after || row.studio || row.modern || '',
      ).trim();
      if (!aspect && !withoutStudio && !withStudio) return null;
      return {
        aspect: aspect || withoutStudio.slice(0, 60) || withStudio.slice(0, 60),
        withoutStudio: withoutStudio,
        withStudio: withStudio,
      };
    },
    5,
  );

  out.briefLinks = mapList(
    o.briefLinks || o.brief_links || o.links || o.anchors,
    function (row) {
      if (!row || typeof row !== 'object') return null;
      var briefNeed = String(row.briefNeed || row.brief_need || row.need || row.brief || '').trim();
      var studioOffer = String(
        row.studioOffer || row.studio_offer || row.offer || row.capability || row.studio || '',
      ).trim();
      if (!briefNeed && !studioOffer) return null;
      return { briefNeed: briefNeed, studioOffer: studioOffer };
    },
    6,
  );

  var hasStructured =
    !!out.summary ||
    out.fitScore != null ||
    out.keyPoints.length ||
    out.comparisons.length ||
    out.briefLinks.length;
  return hasStructured ? out : null;
}

/**
 * @param {string} answerText
 * @return {Array<Object>}
 */
function ProposalBuilding_parseStudioRecommendations_(answerText) {
  var raw = String(answerText || '').trim();
  if (!raw) return [];
  var parsed = ContentExtraction_parseLooseJson_(raw);
  var list = [];
  if (parsed && Array.isArray(parsed.studios)) {
    list = parsed.studios;
  } else if (parsed && Array.isArray(parsed.recommendations)) {
    list = parsed.recommendations;
  }
  var out = [];
  var i;
  for (i = 0; i < list.length; i++) {
    var row = list[i];
    if (!row || typeof row !== 'object') continue;
    var name = String(row.studioName || row.studio || row.name || '').trim();
    if (!name) continue;
    var offerings = [];
    if (Array.isArray(row.offerings)) {
      for (var oi = 0; oi < row.offerings.length; oi++) {
        var off = String(row.offerings[oi] || '').trim();
        if (off) offerings.push(off);
      }
    }
    var whyFit = ProposalBuilding_normalizeWhyFit_(row.whyFit || row.why_fit);
    var rationale = String(row.rationale || row.reason || row.why || '').trim();
    if (!rationale && whyFit && whyFit.summary) rationale = whyFit.summary;
    var entry = {
      studioName: name,
      studioType: ProposalBuilding_normalizeStudioType_(
        row.studioType || row.studio_type || row.type,
        name,
      ),
      offerings: offerings,
      rationale: rationale,
      priority: String(row.priority || 'medium').trim().toLowerCase(),
      contentId: String(row.contentId || row.content_id || '').trim(),
    };
    if (whyFit) entry.whyFit = whyFit;
    out.push(entry);
  }
  return out;
}

/**
 * @param {string} rawType
 * @param {string=} studioName
 * @return {'digital'|'ai'|'enterprise'}
 */
function ProposalBuilding_normalizeStudioType_(rawType, studioName) {
  var t = String(rawType || '').trim().toLowerCase();
  if (t === 'digital' || t === 'ai' || t === 'enterprise') return t;
  return ProposalBuilding_inferStudioType_(studioName);
}

/**
 * @param {string} studioName
 * @return {'digital'|'ai'|'enterprise'}
 */
function ProposalBuilding_inferStudioType_(studioName) {
  var name = String(studioName || '').trim().toLowerCase();
  if (!name) return 'digital';
  var tax = PROPOSAL_BUILDING_STUDIO_TAXONOMY_;
  var k;
  for (k = 0; k < tax.ai.length; k++) {
    if (name.indexOf(String(tax.ai[k]).toLowerCase()) >= 0) return 'ai';
  }
  for (k = 0; k < tax.enterprise.length; k++) {
    if (name.indexOf(String(tax.enterprise[k]).toLowerCase()) >= 0) return 'enterprise';
  }
  for (k = 0; k < tax.digital.length; k++) {
    if (name.indexOf(String(tax.digital[k]).toLowerCase()) >= 0) return 'digital';
  }
  return 'digital';
}

/**
 * @return {string}
 */
function ProposalBuilding_formatStudioTaxonomyForPrompt_() {
  var tax = PROPOSAL_BUILDING_STUDIO_TAXONOMY_;
  var lines = [
    'Studios digitales (capacidades transversales; elegí al menos uno):',
    tax.digital.join(', '),
    '',
    'Studios AI (verticales de industria; elegí si el brief/industria/cliente lo justifica):',
    tax.ai.join(', '),
    '',
    'Studios Enterprise (plataformas y partners; elegí si el brief menciona SAP, Salesforce, cloud, etc.):',
    tax.enterprise.join(', '),
  ];
  return lines.join('\n');
}

/**
 * @param {Object} brief
 * @param {string=} industryKey
 * @return {string}
 */
function ProposalBuilding_defaultDigitalStudioForBrief_(brief, industryKey) {
  brief = brief || {};
  var hints = ProposalBuilding_normalizeStringList_(brief.technologyHints || []);
  var blob = (hints.join(' ') + ' ' + String(brief.projectSummary || '')).toLowerCase();
  if (/data|analytics|bi\b|warehouse|lake/.test(blob)) return 'Globant Data';
  if (/\bai\b|machine learning|ml\b|genai|llm/.test(blob)) return PROPOSAL_BUILDING_AI_PODS_STUDIO_NAME_;
  if (/security|cyber|soc\b|pentest/.test(blob)) return 'Globant Cybersecurity';
  if (/robot|rpa|automation/.test(blob)) return 'Globant Igniting Robotics';
  if (/cloud|devops|sre\b|kubernetes/.test(blob)) return 'Globant CloudOps';
  if (/blockchain|web3|crypto/.test(blob)) return 'Globant Blockchain';
  if (/iot|internet of things|sensor/.test(blob)) return 'Globant Internet of Things';
  if (/payment|fintech|billing/.test(blob)) return 'Globant Payments';
  if (/quality|qa\b|testing/.test(blob)) return 'Quality Engineering';
  return 'Globant Engineering';
}

/**
 * @param {Object} brief
 * @param {string=} industryKey
 * @return {string}
 */
function ProposalBuilding_defaultAiStudioForBrief_(brief, industryKey) {
  var industry = String(industryKey || '').trim();
  if (industry === 'Aerolineas') return 'Globant Airlines';
  if (industry === 'Logistica') return 'Globant Consumer Goods & Manufacturing';
  var clientIndustry = String((brief.clientMatch && brief.clientMatch.industry) || '').toLowerCase();
  if (/airline|aviation|aerol/.test(clientIndustry)) return 'Globant Airlines';
  if (/health|pharma|life science/.test(clientIndustry)) return 'Globant Healthcare & Life Sciences';
  if (/finance|bank|insurance/.test(clientIndustry)) return 'Globant Finance';
  if (/retail|commerce/.test(clientIndustry)) return 'Globant Retail';
  if (/media|entertain/.test(clientIndustry)) return 'Globant Media & Entertainment';
  return '';
}

/**
 * @param {Object} brief
 * @return {string}
 */
function ProposalBuilding_defaultEnterpriseStudioForBrief_(brief) {
  brief = brief || {};
  var hints = ProposalBuilding_normalizeStringList_(brief.technologyHints || []);
  var blob = (hints.join(' ') + ' ' + String(brief.projectSummary || '')).toLowerCase();
  if (/sap\b/.test(blob)) return 'Globant SAP';
  if (/servicenow/.test(blob)) return 'Globant ServiceNow';
  if (/salesforce/.test(blob)) return 'Globant Salesforce';
  if (/oracle\b/.test(blob)) return 'Globant Oracle';
  if (/\baws\b|amazon web/.test(blob)) return 'Globant AWS Studio';
  if (/adobe\b/.test(blob)) return 'Globant Adobe Studio';
  if (/google cloud|\bgcp\b/.test(blob)) return 'Globant Google Cloud';
  if (/microsoft|azure|dynamics/.test(blob)) return 'Globant Microsoft';
  return '';
}

/**
 * @param {Array<Object>} studios
 * @param {Object} brief
 * @param {string=} industryKey
 * @return {Array<Object>}
 */
function ProposalBuilding_ensureStudioTaxonomyCoverage_(studios, brief, industryKey) {
  var out = Array.isArray(studios) ? studios.slice() : [];
  var hasType = { digital: false, ai: false, enterprise: false };
  var i;
  for (i = 0; i < out.length; i++) {
    var t = ProposalBuilding_normalizeStudioType_(out[i].studioType, out[i].studioName);
    out[i].studioType = t;
    hasType[t] = true;
  }
  function pushDefault_(name, type, priority) {
    if (!name) return;
    var exists = false;
    for (var j = 0; j < out.length; j++) {
      if (
        String(out[j].studioName || '').toLowerCase() === String(name).toLowerCase()
      ) {
        exists = true;
        break;
      }
    }
    if (exists) return;
    out.push({
      studioName: name,
      studioType: type,
      offerings: [],
      rationale: UiStrings_t(ProposalBuilding_briefLangCode_(brief), 'pb_studio_taxonomy_fallback_rationale'),
      priority: priority || 'medium',
      contentId: '',
    });
  }
  if (!hasType.digital) {
    pushDefault_(ProposalBuilding_defaultDigitalStudioForBrief_(brief, industryKey), 'digital', 'high');
  }
  var aiDefault = ProposalBuilding_defaultAiStudioForBrief_(brief, industryKey);
  if (!hasType.ai && aiDefault) {
    pushDefault_(aiDefault, 'ai', 'medium');
  }
  var entDefault = ProposalBuilding_defaultEnterpriseStudioForBrief_(brief);
  if (!hasType.enterprise && entDefault) {
    pushDefault_(entDefault, 'enterprise', 'medium');
  }
  return out;
}

/**
 * @param {GlobantAssistantApiClient} client
 * @param {string} userPrompt
 * @param {string} chatBlock
 * @param {{name:string,mimeType:string,dataBase64:string,textContent:string}} attachment
 * @param {{multiDocIndex?:number,multiDocTotal?:number}=} opts
 * @return {string}
 */
function ProposalBuilding_runExtraction_(client, userPrompt, chatBlock, attachment, opts) {
  var options = opts || {};
  var multiDocIndex = Number(options.multiDocIndex || 0);
  var multiDocTotal = Number(options.multiDocTotal || 0);
  var models = PROPOSAL_BUILDING_COMMERCIAL_MODELS.join(', ');
  var hasBinaryAttachment = !!(attachment.dataBase64 && attachment.mimeType);
  var attachmentMode = hasBinaryAttachment
    ? 'Analyze ONLY the attached document indicated in [ATTACHED DOCUMENT] (and user notes below if present).'
    : 'Analyze only the user notes below (no PDF attached in this turn).';

  var multiDocContext = '';
  if (multiDocTotal > 1 && multiDocIndex > 0) {
    multiDocContext = PromptCatalog_render('pb.extract.multi_doc_context', {
      multiDocIndex: String(multiDocIndex),
      multiDocTotal: String(multiDocTotal),
    });
  }

  var chatBlockParam = chatBlock
    ? PromptCatalog_render('pb.extract.chat_history_block', { chatHistory: chatBlock })
    : '';
  var userPromptParam = userPrompt
    ? PromptCatalog_render('pb.extract.user_message_block', { userMessage: userPrompt })
    : '';
  var attachmentContent = '';
  if (attachment.textContent) {
    attachmentContent = PromptCatalog_render('pb.extract.attachment_content_block', {
      fileName: attachment.name,
      fileContent: attachment.textContent.slice(0, 120000),
    });
  }
  var imageHint = '';
  if (hasBinaryAttachment && ProposalBuilding_isImageMime_(attachment.mimeType)) {
    imageHint = PromptCatalog_getTemplate('pb.extract.image_hint');
  }

  var extractPrompt = PromptCatalog_render('pb.extract_brief.user', {
    attachmentMode: attachmentMode,
    commercialModels: models,
    multiDocContext: multiDocContext,
    chatBlock: chatBlockParam,
    userPrompt: userPromptParam,
    attachmentContent: attachmentContent,
    imageHint: imageHint,
  });

  var systemPrompt = PromptCatalog_getTemplate('pb.extract_brief.system');

  var result;
  if (attachment.dataBase64 && attachment.mimeType) {
    var fileBytes = Utilities.base64Decode(attachment.dataBase64);
    var fileBlob = Utilities.newBlob(fileBytes, attachment.mimeType, attachment.name || 'attachment');
    result = GlobantDocumentChat_chatWithBlob_(client, fileBlob, systemPrompt, extractPrompt);
  } else {
    result = client.chatSimple(systemPrompt, extractPrompt, ContentExtraction_resolveChatModel_());
  }
  return String(result.text || '').trim();
}

/**
 * @param {string} payloadJson
 * @return {{ok:boolean, brief:Object}}
 */
function ProposalBuilding_extractBrief(payloadJson) {
  AdminAuth_requireProposalBuildingBuild();
  AgentOrchestrator_requireGlobant_();

  var payload = {};
  try {
    payload = JSON.parse(String(payloadJson || '{}'));
  } catch (eParse) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_ephemeral_doc_payload'));
  }

  var userPrompt = String(payload.userPrompt || '').trim();
  var history = Array.isArray(payload.chatHistory) ? payload.chatHistory : [];
  var chatBlock = ProposalBuilding_formatChatHistory_(history);
  var attachment = ProposalBuilding_resolveExtractAttachment_(payload);
  if (!userPrompt && !chatBlock && !attachment.dataBase64 && !attachment.textContent) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'pb_err_extract_empty'));
  }

  var client = ProposalBuilding_createLlmClient_();
  var raw = ProposalBuilding_runExtraction_(client, userPrompt, chatBlock, attachment, {
    multiDocIndex: Number(payload.multiDocIndex || 0),
    multiDocTotal: Number(payload.multiDocTotal || 0),
  });
  var parsed = ContentExtraction_parseLooseJson_(raw);
  var brief = ProposalBuilding_normalizeBrief_(parsed);
  if (!brief.detectedLanguage) {
    brief.detectedLanguage = 'es';
  }
  var requestedOutput = String(payload.outputLocale || payload.requestLocale || '').trim();
  if (requestedOutput) {
    brief.outputLocale = ProposalBuilding_resolveLangCode_(requestedOutput);
  }
  brief.stakeholders = ProposalBuilding_finalizeStakeholdersList_(
    brief.stakeholders,
    ProposalBuilding_outputLangCode_(brief),
  );
  if (
    !brief.scopeItems.length &&
    !brief.clientName &&
    !brief.milestones.length &&
    !brief.stakeholders.length &&
    !brief.projectSummary &&
    !brief.budget.amount &&
    !brief.businessObjectives.length
  ) {
    brief.warnings.push(UiStrings_t(UiStrings_activeLocale_(), 'pb_warn_extract_sparse'));
  }

  var sourceFiles = [];
  if (attachment.name) {
    sourceFiles.push(String(attachment.name).trim());
  }
  if (sourceFiles.length) {
    brief.sourceFileNames = sourceFiles.slice();
  }
  brief = ProposalBuilding_enrichBriefWithClientMatch_(brief, sourceFiles);

  var sessionId = '';
  try {
    sessionId = ProposalBuildingPersistence_recordBriefStep_(payload.sessionId, brief, {
      attachment: attachment.name || attachment.textContent || attachment.dataBase64 ? attachment : null,
      resetMaterials: !!payload.extractBatchStart,
      step: 'extract_brief',
      aiPayload: { brief: brief, sourceFileNames: sourceFiles },
      isDraft: true,
      builderStep: 'brief',
    });
  } catch (ePersist) {
    AviatorsError_log_('ProposalBuilding_extractBrief_persist', String(ePersist && ePersist.message));
  }

  return { ok: true, brief: brief, sessionId: sessionId };
}

/**
 * Unifica briefs parciales con LLM conservando el máximo detalle de cada documento.
 * @param {Array<Object>} briefList
 * @param {Array<string>} fileNames
 * @return {Object}
 */
function ProposalBuilding_mergeBriefsWithLlm_(briefList, fileNames) {
  AgentOrchestrator_requireGlobant_();
  if (!Array.isArray(briefList) || briefList.length < 2) {
    return ProposalBuilding_normalizeBrief_(briefList && briefList[0]);
  }
  var client = ProposalBuilding_createLlmClient_();
  var models = PROPOSAL_BUILDING_COMMERCIAL_MODELS.join(', ');
  var labeled = [];
  var i;
  for (i = 0; i < briefList.length; i++) {
    var sourceName = String((fileNames && fileNames[i]) || briefList[i].__sourceFile || '').trim();
    if (!sourceName) sourceName = 'documento_' + String(i + 1);
    var row = ProposalBuilding_normalizeBrief_(briefList[i]);
    delete row.__sourceFile;
    labeled.push({ sourceFile: sourceName, brief: row });
  }
  var mergePrompt = PromptCatalog_render('pb.merge_briefs.user', {
    briefCount: String(briefList.length),
    commercialModels: models,
    partialBriefsJson: JSON.stringify(labeled).slice(0, 110000),
  });
  var systemPrompt = PromptCatalog_getTemplate('pb.merge_briefs.system');
  var result = client.chatSimple(systemPrompt, mergePrompt, ContentExtraction_resolveChatModel_());
  var parsed = ContentExtraction_parseLooseJson_(String(result.text || '').trim());
  return ProposalBuilding_normalizeBrief_(parsed);
}

/**
 * @param {string} briefsJson
 * @return {{ok:boolean, brief:Object}}
 */
function ProposalBuilding_mergeExtractedBriefs(briefsJson, sessionId) {
  AdminAuth_requireProposalBuildingBuild();
  var list = [];
  try {
    list = JSON.parse(String(briefsJson || '[]'));
  } catch (eList) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_ephemeral_doc_payload'));
  }
  if (!Array.isArray(list) || !list.length) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'pb_err_extract_empty'));
  }
  var fileNames = [];
  var normalizedList = [];
  var li;
  for (li = 0; li < list.length; li++) {
    var row = list[li];
    if (!row || typeof row !== 'object') continue;
    var sourceName = String(row.__sourceFile || '').trim();
    if (!sourceName && Array.isArray(row.__sourceFiles) && row.__sourceFiles.length) {
      sourceName = String(row.__sourceFiles[row.__sourceFiles.length - 1] || '').trim();
    }
    if (sourceName) fileNames.push(sourceName);
    delete row.__sourceFile;
    delete row.__sourceFiles;
    normalizedList.push(ProposalBuilding_normalizeBrief_(row));
  }
  if (!normalizedList.length) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'pb_err_extract_empty'));
  }
  var merged;
  if (normalizedList.length === 1) {
    merged = normalizedList[0];
  } else {
    try {
      merged = ProposalBuilding_mergeBriefsWithLlm_(normalizedList, fileNames);
    } catch (eMergeLlm) {
      AviatorsError_log_('ProposalBuilding_mergeBriefs_llm', String(eMergeLlm && eMergeLlm.message));
      merged = {};
      for (li = 0; li < normalizedList.length; li++) {
        merged = ProposalBuilding_mergeBriefs_(merged, normalizedList[li]);
      }
    }
  }
  merged = ProposalBuilding_enrichBriefWithClientMatch_(merged, fileNames);
  if (fileNames.length) {
    merged.sourceFileNames = fileNames.slice();
  }
  var sid = '';
  try {
    sid = ProposalBuildingPersistence_recordBriefStep_(sessionId, merged, {
      step: 'merge_briefs',
      aiPayload: { brief: merged, sourceFileNames: fileNames },
      isDraft: true,
      builderStep: 'brief',
    });
  } catch (ePersistMerge) {
    AviatorsError_log_('ProposalBuilding_mergeBriefs_persist', String(ePersistMerge && ePersistMerge.message));
  }
  return { ok: true, brief: merged, sessionId: sid };
}

/** @type {Array<string>} */
var PROPOSAL_BUILDING_STUDIO_LANE_ORDER_ = ['ai_pods', 'digital', 'ai_vertical', 'enterprise'];

/**
 * @param {Array<Object>} catalogStudios
 * @param {string} lane
 * @return {Array<string>}
 */
function ProposalBuilding_formatStudioCatalogLinesForLane_(catalogStudios, lane) {
  var list = Array.isArray(catalogStudios) ? catalogStudios : [];
  var lines = [];
  var ci;
  for (ci = 0; ci < list.length; ci++) {
    var st = list[ci];
    var name = ProposalBuilding_normalizeStudioName_(st.studioName);
    if (!name) continue;
    if (lane === 'digital' && name === PROPOSAL_BUILDING_AI_PODS_STUDIO_NAME_) continue;
    var studioType = ProposalBuilding_inferStudioType_(name);
    if (lane === 'digital' && studioType !== 'digital') continue;
    if (lane === 'ai_vertical' && studioType !== 'ai') continue;
    if (lane === 'enterprise' && studioType !== 'enterprise') continue;
    var line = '- ' + name;
    if (st.contentIds && st.contentIds.length) line += ' · contentId=' + st.contentIds[0];
    if (st.kgNodeId) line += ' · kgNodeId=' + st.kgNodeId;
    if (st.offerings && st.offerings.length) line += ' · offerings: ' + st.offerings.join(', ');
    if (st.summaries && st.summaries.length) line += ' · ' + st.summaries[0];
    lines.push(line);
  }
  return lines;
}

/**
 * @param {string} lane
 * @param {Object} brief
 * @param {string=} industryKey
 * @param {Array<Object>} catalogStudios
 * @return {string}
 */
function ProposalBuilding_buildStudioLanePrompt_(lane, brief, industryKey, catalogStudios) {
  var industry = String(industryKey || '').trim();
  brief = ProposalBuilding_normalizeBrief_(brief || {});
  var outputLanguage = ProposalBuilding_briefOutputLanguageLabel_(brief);
  var langRule =
    'Output language: ' +
    outputLanguage +
    '. The validated brief JSON may be written in another language; write ALL text fields (rationale, whyFit, summaries) in ' +
    outputLanguage +
    ' only.\n';
  var tax = PROPOSAL_BUILDING_STUDIO_TAXONOMY_;
  var studioLines = ProposalBuilding_formatStudioCatalogLinesForLane_(catalogStudios, lane);
  var catalogBlock =
    studioLines.length ? studioLines.join('\n') : '(no indexed studios; rely on official taxonomy)';
  var commonTail = [
    'Proposal industry: ' + (industry || '(not specified)'),
    'Validated brief:',
    JSON.stringify(brief),
    '',
    'Studios in Aviators catalog (indexed material):',
    catalogBlock,
  ].join('\n');
  var whyFitRules =
    '- whyFit.fitScore: integer 0-100 for brief-studio fit.\n' +
    '- whyFit.keyPoints: 3-5 items with title, detail and briefAnchor tied to the brief.\n' +
    '- whyFit.comparisons: 2-4 rows (aspect, withoutStudio, withStudio).\n' +
    '- whyFit.briefLinks: 2-4 rows mapping briefNeed to studioOffer.\n' +
    '- rationale: 1-2 sentence plain summary (same language as whyFit).';

  if (lane === 'digital') {
    var digitalNames = tax.digital.filter(function (n) {
      return n !== PROPOSAL_BUILDING_AI_PODS_STUDIO_NAME_;
    });
    return PromptCatalog_render('pb.studio_lane.digital.user', {
      laneRules:
        langRule +
        'Recommend ONLY transversal digital Globant Studios (studioType=digital) for this proposal.\n' +
        'Do NOT include Globant AI-PODs (generated in a separate call).\n' +
        'Rules:\n' +
        '- Recommend 1-3 distinct digital studios, prioritizing brief relevance.\n' +
        '- Use canonical taxonomy names; do not invent studios.\n' +
        '- Include Aviators catalog contentId when there is a match.\n' +
        whyFitRules,
      digitalTaxonomy: digitalNames.join(', '),
      outputLanguage: outputLanguage,
      commonTail: commonTail,
    });
  }
  if (lane === 'ai_vertical') {
    return PromptCatalog_render('pb.studio_lane.ai_vertical.user', {
      laneRules:
        langRule +
        'Recommend ONLY industry-vertical AI Globant Studios (studioType=ai) for this proposal.\n' +
        'Rules:\n' +
        '- Recommend 1-2 AI studios that fit the brief industry/client.\n' +
        '- The first must have priority=high; the rest medium.\n' +
        '- Use canonical names; include catalog contentId when applicable.\n' +
        whyFitRules,
      aiTaxonomy: tax.ai.join(', '),
      outputLanguage: outputLanguage,
      commonTail: commonTail,
    });
  }
  if (lane === 'enterprise') {
    return PromptCatalog_render('pb.studio_lane.enterprise.user', {
      laneRules:
        langRule +
        'Recommend ONLY Globant Enterprise studios (studioType=enterprise) if the brief justifies it.\n' +
        'Rules:\n' +
        '- Include studios ONLY if the brief mentions SAP, ServiceNow, Salesforce, Oracle, AWS, Adobe, Google Cloud, Microsoft or process optimization.\n' +
        '- If no enterprise applies, respond {"studios":[]}.\n' +
        '- Maximum 2 enterprise studios.\n' +
        whyFitRules,
      enterpriseTaxonomy: tax.enterprise.join(', '),
      outputLanguage: outputLanguage,
      commonTail: commonTail,
    });
  }
  return '';
}

/**
 * @param {string} lane
 * @param {Array<Object>} studios
 * @return {Array<Object>}
 */
function ProposalBuilding_filterStudiosForLane_(lane, studios) {
  var out = [];
  var i;
  for (i = 0; i < studios.length; i++) {
    var st = studios[i];
    if (!st || typeof st !== 'object') continue;
    var name = ProposalBuilding_normalizeStudioName_(st.studioName);
    if (!name) continue;
    var type = ProposalBuilding_normalizeStudioType_(st.studioType, name);
    if (lane === 'digital') {
      if (name === PROPOSAL_BUILDING_AI_PODS_STUDIO_NAME_) continue;
      if (type !== 'digital') continue;
      st.studioType = 'digital';
    } else if (lane === 'ai_vertical') {
      if (type !== 'ai') continue;
      st.studioType = 'ai';
    } else if (lane === 'enterprise') {
      if (type !== 'enterprise') continue;
      st.studioType = 'enterprise';
    } else {
      continue;
    }
    st.studioName = name;
    out.push(st);
  }
  return out;
}

/**
 * @param {Array<Object>} studios
 * @return {Array<Object>}
 */
function ProposalBuilding_normalizeStudioPriorities_(studios) {
  var out = Array.isArray(studios) ? studios.slice() : [];
  var aiSeen = 0;
  var i;
  for (i = 0; i < out.length; i++) {
    var row = out[i];
    row.studioName = ProposalBuilding_normalizeStudioName_(row.studioName);
    row.studioType = ProposalBuilding_normalizeStudioType_(row.studioType, row.studioName);
    row.priority = String(row.priority || 'medium').trim().toLowerCase();
    if (row.studioName === PROPOSAL_BUILDING_AI_PODS_STUDIO_NAME_) {
      row.priority = 'high';
      row.studioType = 'digital';
      row.offerings = ProposalBuilding_ensureOfferingsIncludeAiPods_(row.offerings);
      continue;
    }
    if (row.studioType === 'digital') {
      row.priority = 'medium';
      continue;
    }
    if (row.studioType === 'ai') {
      row.priority = aiSeen === 0 ? 'high' : 'medium';
      aiSeen++;
    }
  }
  return out;
}

/**
 * @param {Array<Object>} studios
 * @return {Object<string, Array<Object>>}
 */
function ProposalBuilding_splitStudiosIntoLanes_(studios) {
  var out = { ai_pods: [], digital: [], ai_vertical: [], enterprise: [] };
  var list = Array.isArray(studios) ? studios : [];
  var i;
  for (i = 0; i < list.length; i++) {
    var st = list[i];
    if (!st || typeof st !== 'object') continue;
    var name = ProposalBuilding_normalizeStudioName_(st.studioName);
    if (!name) continue;
    if (name === PROPOSAL_BUILDING_AI_PODS_STUDIO_NAME_) {
      out.ai_pods.push(st);
      continue;
    }
    var type = ProposalBuilding_normalizeStudioType_(st.studioType, name);
    if (type === 'ai') out.ai_vertical.push(st);
    else if (type === 'enterprise') out.enterprise.push(st);
    else out.digital.push(st);
  }
  return out;
}

/**
 * @param {Object<string, Array<Object>>} lanesPayload
 * @param {Object} brief
 * @param {string=} industryKey
 * @return {Array<Object>}
 */
/**
 * Combina lanes del cliente con borradores persistidos en la sesión (finalize liviano).
 * @param {string=} sessionId
 * @param {Object<string, Array<Object>>} clientLanes
 * @return {Object<string, Array<Object>>}
 */
function ProposalBuilding_resolveStudioLanesPayload_(sessionId, clientLanes) {
  clientLanes = clientLanes && typeof clientLanes === 'object' ? clientLanes : {};
  var sid = String(sessionId || '').trim();
  var draft = {};
  if (sid) {
    try {
      var email = ProposalBuildingPersistence_requireEmail_();
      var row = ProposalBuildingStore_getByIdForUser(sid, email);
      if (row && row.context && row.context.studioLaneDraft) {
        draft = row.context.studioLaneDraft;
      }
    } catch (eDraft) {
      AviatorsError_log_('ProposalBuilding_studio_lane_draft', String(eDraft && eDraft.message));
    }
  }
  var out = {};
  var li;
  for (li = 0; li < PROPOSAL_BUILDING_STUDIO_LANE_ORDER_.length; li++) {
    var lane = PROPOSAL_BUILDING_STUDIO_LANE_ORDER_[li];
    if (Array.isArray(clientLanes[lane]) && clientLanes[lane].length) {
      out[lane] = clientLanes[lane];
    } else if (Array.isArray(draft[lane]) && draft[lane].length) {
      out[lane] = draft[lane];
    } else {
      out[lane] = Array.isArray(clientLanes[lane]) ? clientLanes[lane] : [];
    }
  }
  return out;
}

function ProposalBuilding_mergeStudioLanes_(lanesPayload, brief, industryKey) {
  lanesPayload = lanesPayload && typeof lanesPayload === 'object' ? lanesPayload : {};
  var seen = {};
  var out = [];
  var li;
  var i;
  for (li = 0; li < PROPOSAL_BUILDING_STUDIO_LANE_ORDER_.length; li++) {
    var lane = PROPOSAL_BUILDING_STUDIO_LANE_ORDER_[li];
    var list = Array.isArray(lanesPayload[lane]) ? lanesPayload[lane] : [];
    for (i = 0; i < list.length; i++) {
      var st = list[i];
      if (!st || typeof st !== 'object') continue;
      var key = ProposalBuilding_normalizeStudioName_(st.studioName).toLowerCase();
      if (!key || seen[key]) continue;
      seen[key] = true;
      out.push(st);
    }
  }
  out = ProposalBuilding_ensureStudioTaxonomyCoverage_(out, brief, industryKey);
  return ProposalBuilding_normalizeStudioPriorities_(out);
}

/**
 * @param {string} lane ai_pods|digital|ai_vertical|enterprise
 * @param {Object} brief
 * @param {string=} industryKey
 * @return {{studios:Array<Object>}}
 */
function ProposalBuilding_runStudioRecommendationLane_(lane, brief, industryKey) {
  lane = String(lane || '').trim().toLowerCase();
  brief = ProposalBuilding_normalizeBrief_(brief || {});
  var industry = String(industryKey || '').trim();

  if (lane === 'ai_pods') {
    AgentOrchestrator_requireGlobant_();
    var pitch = ProposalBuilding_buildAiPodsPitch_(brief, industry);
    var rationale = ProposalBuilding_formatAiPodsPitchAsText_(pitch);
    return {
      studios: [
        {
          studioName: PROPOSAL_BUILDING_AI_PODS_STUDIO_NAME_,
          studioType: 'digital',
          offerings: ['AI_PODS'],
          rationale: rationale,
          priority: 'high',
          contentId: '',
          aiPodsPitch: pitch,
        },
      ],
    };
  }

  if (lane !== 'digital' && lane !== 'ai_vertical' && lane !== 'enterprise') {
    throw new Error('ERR_PB_STUDIO_LANE_INVALID');
  }

  AgentOrchestrator_requireGlobant_();
  var catalogStudios = ProposalBuilding_listStudiosFromCatalog_();
  var prompt = ProposalBuilding_buildStudioLanePrompt_(lane, brief, industry, catalogStudios);
  var r = AgentOrchestrator_answerWith(prompt, _ADMIN_AGENT_ID_PROPOSALS, []);
  var studios = ProposalBuilding_parseStudioRecommendations_(r.answer || '');
  studios = ProposalBuilding_filterStudiosForLane_(lane, studios);
  return { studios: studios };
}

/**
 * @param {Object} brief
 * @param {string=} industryKey
 * @param {Object<string, Array<Object>>} lanesPayload
 * @param {string=} sessionId
 * @param {{persist?:boolean, returnSession?:boolean, aiEvent?:string}=} opts
 * @return {{ok:boolean, studios:Array<Object>, catalogStudios:Array<Object>, session?:Object}}
 */
function ProposalBuilding_finalizeStudioRecommendations_(
  brief,
  industryKey,
  lanesPayload,
  sessionId,
  opts,
) {
  opts = opts || {};
  brief = ProposalBuilding_normalizeBrief_(brief || {});
  var industry = String(industryKey || '').trim();
  var sid = String(sessionId || '').trim();
  lanesPayload = ProposalBuilding_resolveStudioLanesPayload_(sid, lanesPayload);
  var merged = ProposalBuilding_mergeStudioLanes_(lanesPayload, brief, industry);
  var catalogStudios = ProposalBuilding_listStudiosFromCatalog_();
  merged = ProposalBuilding_enrichStudioRecommendations_(merged, catalogStudios);
  merged = ProposalBuildingPersistence_normalizeStudiosPatch_(merged);
  var result = { ok: true, studios: merged, sessionId: sid };
  var shouldPersist = opts.persist !== false;
  if (!shouldPersist) return result;

  var aiEvent = String(opts.aiEvent || 'studios_lanes_finalize').trim();
  try {
    if (sid) {
      var email = ProposalBuildingPersistence_requireEmail_();
      var row = ProposalBuildingStore_getByIdForUser(sid, email) || {};
      ProposalBuildingPersistence_beginStep_(sid, { builderStep: 'studios' });
      var ctx =
        row.context && typeof row.context === 'object' ? Object.assign({}, row.context) : {};
      delete ctx.studioLaneDraft;
      ProposalBuildingPersistence_patchSession_(sid, {
        validatedBrief: brief,
        industryKey: industry,
        studioRecommendations: merged,
        context: ctx,
        aiResponses: ProposalBuildingPersistence_appendAiEvent_(row.aiResponses, aiEvent, {
          industry: industry,
          studioCount: merged.length,
        }),
      });
      result.builderStep = 'studios';
    } else {
      ProposalBuildingPersistence_recordStudiosStep_(sid, brief, industry, { studios: merged });
    }
  } catch (ePersist) {
    AviatorsError_log_('ProposalBuilding_studios_finalize', String(ePersist && ePersist.message));
  }
  return result;
}

/**
 * Ejecuta una lane de recomendación de studios (llamada IA específica).
 * @param {string} lane ai_pods|digital|ai_vertical|enterprise
 * @param {string} briefJson
 * @param {string=} industryKey
 * @param {string=} sessionId
 * @return {{ok:boolean, lane:string, studios:Array<Object>}}
 */
function ProposalBuilding_recommendStudiosLane(lane, briefJson, industryKey, sessionId) {
  AdminAuth_requireProposalBuildingBuild();
  var brief = {};
  try {
    brief = JSON.parse(String(briefJson || '{}'));
  } catch (eBrief) {
    brief = {};
  }
  brief = ProposalBuilding_normalizeBrief_(brief);
  var laneKey = String(lane || '').trim().toLowerCase();
  var laneResult = ProposalBuilding_runStudioRecommendationLane_(lane, brief, industryKey);
  var studios = laneResult.studios || [];
  try {
    ProposalBuildingPersistence_storeStudioLaneDraft_(sessionId, laneKey, studios);
  } catch (eStoreLane) {
    AviatorsError_log_('ProposalBuilding_studio_lane_store', String(eStoreLane && eStoreLane.message));
  }
  return {
    ok: true,
    lane: laneKey,
    studios: studios,
  };
}

/**
 * Fusiona lanes, enriquece catálogo y persiste recomendaciones de studios.
 * @param {string} briefJson
 * @param {string=} industryKey
 * @param {string} lanesJson
 * @param {string=} sessionId
 * @return {{ok:boolean, studios:Array<Object>, catalogStudios:Array<Object>, session?:Object}}
 */
function ProposalBuilding_finalizeStudioRecommendations(briefJson, industryKey, lanesJson, sessionId) {
  var sid = String(sessionId || '').trim();
  if (sid) AdminAuth_requireProposalBuildingSave();
  else AdminAuth_requireProposalBuildingBuild();
  var brief = {};
  try {
    brief = JSON.parse(String(briefJson || '{}'));
  } catch (eBrief) {
    brief = {};
  }
  brief = ProposalBuilding_normalizeBrief_(brief);
  var lanesPayload = {};
  try {
    lanesPayload = JSON.parse(String(lanesJson || '{}'));
  } catch (eLanes) {
    lanesPayload = {};
  }
  return ProposalBuilding_finalizeStudioRecommendations_(
    brief,
    industryKey,
    lanesPayload,
    sessionId,
    { persist: true, returnSession: !!String(sessionId || '').trim(), aiEvent: 'studios_lanes_finalize' },
  );
}

/**
 * Regenera una lane y fusiona con el resto de studios existentes.
 * @param {string} sessionId
 * @param {string} lane
 * @param {string=} briefJson
 * @param {string=} studiosJson
 * @return {{ok:boolean, lane:string, studios:Array<Object>, session?:Object}}
 */
function ProposalBuilding_refreshStudiosLane(sessionId, lane, briefJson, studiosJson) {
  AdminAuth_requireProposalBuildingSave();
  var email = ProposalBuildingPersistence_requireEmail_();
  var sid = String(sessionId || '').trim();
  if (!sid) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'pb_err_session_missing'));
  }
  var row = ProposalBuildingStore_getByIdForUser(sid, email);
  if (!row) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'pb_err_session_not_found'));
  }

  var brief = {};
  try {
    brief = JSON.parse(String(briefJson || '{}'));
  } catch (eBrief) {
    brief = {};
  }
  if (!brief || typeof brief !== 'object' || !Object.keys(brief).length) {
    brief = row.validatedBrief || row.draftBrief || {};
  }
  brief = ProposalBuilding_normalizeBrief_(brief);
  var industry = String(row.industryKey || '').trim();

  var current = [];
  try {
    current = JSON.parse(String(studiosJson || '[]'));
  } catch (eStudios) {
    current = [];
  }
  if (!Array.isArray(current) || !current.length) {
    current = Array.isArray(row.studioRecommendations) ? row.studioRecommendations.slice() : [];
  }

  var lanesPayload = ProposalBuilding_splitStudiosIntoLanes_(current);
  var laneKey = String(lane || '').trim().toLowerCase();
  var laneResult = ProposalBuilding_runStudioRecommendationLane_(laneKey, brief, industry);
  lanesPayload[laneKey] = laneResult.studios || [];
  try {
    ProposalBuildingPersistence_storeStudioLaneDraft_(sid, laneKey, laneResult.studios || []);
  } catch (eStoreLane) {
    AviatorsError_log_('ProposalBuilding_studio_lane_store', String(eStoreLane && eStoreLane.message));
  }

  var finalized = ProposalBuilding_finalizeStudioRecommendations_(brief, industry, lanesPayload, sid, {
    persist: true,
    aiEvent: 'studios_lane_refresh_' + laneKey,
  });
  return {
    ok: true,
    lane: laneKey,
    studios: finalized.studios || [],
    sessionId: sid,
    builderStep: finalized.builderStep || 'studios',
  };
}

/**
 * @param {string} briefJson
 * @param {string=} industryKey
 * @param {string=} sessionId
 * @return {{ok:boolean, studios:Array<Object>, catalogStudios:Array<Object>}}
 */
function ProposalBuilding_recommendStudios(briefJson, industryKey, sessionId) {
  AdminAuth_requireProposalBuildingBuild();
  var brief = {};
  try {
    brief = JSON.parse(String(briefJson || '{}'));
  } catch (eBrief) {
    brief = {};
  }
  brief = ProposalBuilding_normalizeBrief_(brief);
  var industry = String(industryKey || '').trim();
  var lanesPayload = {};
  var li;
  for (li = 0; li < PROPOSAL_BUILDING_STUDIO_LANE_ORDER_.length; li++) {
    var lane = PROPOSAL_BUILDING_STUDIO_LANE_ORDER_[li];
    lanesPayload[lane] = ProposalBuilding_runStudioRecommendationLane_(lane, brief, industry).studios || [];
  }
  return ProposalBuilding_finalizeStudioRecommendations_(brief, industry, lanesPayload, sessionId, {
    persist: true,
    aiEvent: 'studios',
  });
}

/**
 * Regenera el pitch AI-PODs (presale) para una sesión guardada sin re-recomendar todos los studios.
 * @param {string} sessionId
 * @param {string=} briefJson Brief opcional (p. ej. edits locales en vista propuesta).
 * @param {string=} studiosJson Lista actual de studios opcional (conserva filas manuales).
 * @return {{ok:boolean,studios:Array<Object>,session:Object}}
 */
function ProposalBuilding_refreshAiPodsPitch(sessionId, briefJson, studiosJson) {
  return ProposalBuilding_refreshStudiosLane(sessionId, 'ai_pods', briefJson, studiosJson);
}

/**
 * @param {GoogleAppsScript.Drive.Folder} parent
 * @param {string} name
 * @return {GoogleAppsScript.Drive.Folder}
 */
function ProposalBuilding_getOrCreateChildFolder_(parent, name) {
  var it = parent.getFoldersByName(name);
  if (it.hasNext()) return it.next();
  return parent.createFolder(name);
}

/**
 * @return {GoogleAppsScript.Drive.Folder}
 */
function ProposalBuilding_getProposalsDriveFolder_() {
  var projectRoot = DriveApp.getFolderById(AviatorsConfig_requireDriveRootFolderId_());
  return ProposalBuilding_getOrCreateChildFolder_(projectRoot, PROPOSAL_BUILDING_DRIVE_FOLDER_NAME);
}

/**
 * @param {Object} brief
 * @return {string}
 */
function ProposalBuilding_buildClientFolderName_(brief) {
  brief = brief || {};
  return ContentIngestion_safeDriveFolderName_(brief.clientName, PROPOSAL_BUILDING_CLIENT_FALLBACK_);
}

/**
 * @param {Object} brief
 * @return {string}
 */
function ProposalBuilding_buildProposalSubjectName_(brief) {
  brief = brief || {};
  var items = Array.isArray(brief.scopeItems) ? brief.scopeItems : [];
  var subjectParts = [];
  var i;
  for (i = 0; i < items.length; i++) {
    var it = items[i];
    if (!it || typeof it !== 'object') continue;
    var chunk = String(it.title || '').trim();
    if (!chunk) chunk = String(it.description || '').trim();
    if (chunk) subjectParts.push(chunk);
  }
  var subjectRaw = subjectParts.join('; ');
  if (!subjectRaw && brief.projectSummary) subjectRaw = String(brief.projectSummary || '').trim();
  if (!subjectRaw) subjectRaw = PROPOSAL_BUILDING_SUBJECT_FALLBACK_;
  return ContentIngestion_safeDriveFolderName_(subjectRaw, PROPOSAL_BUILDING_SUBJECT_FALLBACK_);
}

/**
 * Carpeta Propuestas/{cliente}/{propuesta}/ para deck y checklist.
 * @param {Object} brief
 * @return {{folder:GoogleAppsScript.Drive.Folder,id:string,url:string,name:string,clientName:string,proposalName:string}}
 */
function ProposalBuilding_getProposalPackageFolder_(brief) {
  brief = brief || {};
  var proposalsRoot = ProposalBuilding_getProposalsDriveFolder_();
  var clientName = ProposalBuilding_buildClientFolderName_(brief);
  var proposalName = ProposalBuilding_buildProposalSubjectName_(brief);
  var clientFolder = ProposalBuilding_getOrCreateChildFolder_(proposalsRoot, clientName);
  var packageFolder = ProposalBuilding_getOrCreateChildFolder_(clientFolder, proposalName);
  return {
    folder: packageFolder,
    id: String(packageFolder.getId() || ''),
    url: String(packageFolder.getUrl() || ''),
    name: String(packageFolder.getName() || proposalName),
    clientName: clientName,
    proposalName: proposalName,
  };
}

/**
 * @param {string} raw
 * @return {string}
 */
function ProposalBuilding_normalizeSubmissionDeliverableCategory_(raw) {
  var c = String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  if (c === 'doc' || c === 'docs' || c === 'documento' || c === 'documentos') c = 'document';
  if (c === 'admin' || c === 'administrativo') c = 'administrative';
  if (c === 'fecha' || c === 'deadline' || c === 'due_date') c = 'deadline';
  if (c === 'contenido' || c === 'content' || c === 'scope') c = 'content';
  var allowed = {
    document: true,
    format: true,
    administrative: true,
    deadline: true,
    content: true,
    other: true,
  };
  return allowed[c] ? c : 'other';
}

/**
 * @param {*} value
 * @return {Array<{item:string,dueDate:string,notes:string,category:string}>}
 */
function ProposalBuilding_normalizeSubmissionDeliverables_(value) {
  var out = [];
  var seen = {};
  var rows = Array.isArray(value) ? value : [];
  var i;
  for (i = 0; i < rows.length; i++) {
    var row = rows[i];
    if (!row) continue;
    var item = '';
    var dueDate = '';
    var notes = '';
    var category = 'other';
    if (typeof row === 'string') {
      item = String(row || '').trim();
    } else if (typeof row === 'object') {
      item = String(row.item || row.title || row.label || row.name || '').trim();
      dueDate = String(row.dueDate || row.date || row.deadline || '').trim();
      notes = String(row.notes || row.description || row.detail || '').trim();
      category = ProposalBuilding_normalizeSubmissionDeliverableCategory_(row.category || row.type);
    }
    if (!item) continue;
    var key = item.toLowerCase() + '|' + dueDate.toLowerCase() + '|' + category;
    if (seen[key]) continue;
    seen[key] = true;
    out.push({ item: item, dueDate: dueDate, notes: notes, category: category });
  }
  return out;
}

/**
 * @param {string} category
 * @return {string}
 */
function ProposalBuilding_checklistCategoryLabel_(category) {
  var key = 'pb_checklist_cat_' + ProposalBuilding_normalizeSubmissionDeliverableCategory_(category);
  var label = UiStrings_t(UiStrings_activeLocale_(), key);
  if (label === key) {
    return UiStrings_t(UiStrings_activeLocale_(), 'pb_checklist_cat_other');
  }
  return label;
}

/**
 * @param {Object} brief
 * @param {{deckName:string,deckUrl:string}=} deckMeta
 * @return {Array<{item:string,dueDate:string,notes:string,category:string,status:string}>}
 */
function ProposalBuilding_buildChecklistItemsFromBrief_(brief, deckMeta) {
  brief = ProposalBuilding_normalizeBrief_(brief || {});
  deckMeta = deckMeta || {};
  var items = [];
  var seen = {};
  function push_(item, dueDate, notes, category, status) {
    var text = String(item || '').trim();
    if (!text) return;
    var key = text.toLowerCase() + '|' + String(dueDate || '').trim().toLowerCase();
    if (seen[key]) return;
    seen[key] = true;
    items.push({
      item: text,
      dueDate: String(dueDate || '').trim(),
      notes: String(notes || '').trim(),
      category: ProposalBuilding_normalizeSubmissionDeliverableCategory_(category),
      status: String(status || '').trim() || UiStrings_t(UiStrings_activeLocale_(), 'pb_checklist_status_pending'),
    });
  }

  var subs = Array.isArray(brief.submissionDeliverables) ? brief.submissionDeliverables : [];
  var si;
  for (si = 0; si < subs.length; si++) {
    var sub = subs[si];
    push_(sub.item, sub.dueDate, sub.notes, sub.category, '');
  }
  if (brief.rfpDeadline) {
    push_(
      UiStrings_fmt_('pb_checklist_item_rfp_deadline', { date: brief.rfpDeadline }),
      brief.rfpDeadline,
      '',
      'deadline',
      '',
    );
  }
  var milestones = Array.isArray(brief.milestones) ? brief.milestones : [];
  for (si = 0; si < milestones.length; si++) {
    var ms = milestones[si];
    if (!ms || typeof ms !== 'object') continue;
    var msLabel = String(ms.label || '').trim();
    if (!msLabel || ProposalBuilding_isPlaceholderBriefText_(msLabel)) continue;
    push_(msLabel, String(ms.date || '').trim(), String(ms.notes || '').trim(), 'deadline', '');
  }
  if (ProposalBuilding_budgetHasEvidence_(brief.budget)) {
    var budget = brief.budget || ProposalBuilding_normalizeBudget_(null);
    var budgetLabel = UiStrings_t(UiStrings_activeLocale_(), 'pb_checklist_item_pricing');
    var budgetNotes = String(budget.amount || '').trim();
    if (budget.currency) budgetNotes += (budgetNotes ? ' ' : '') + budget.currency;
    if (budget.notes) budgetNotes += (budgetNotes ? ' — ' : '') + budget.notes;
    push_(budgetLabel, '', budgetNotes, 'content', '');
  }
  push_(
    UiStrings_t(UiStrings_activeLocale_(), 'pb_checklist_item_deck'),
    '',
    deckMeta.deckUrl ? deckMeta.deckUrl : deckMeta.deckName || '',
    'document',
    UiStrings_t(UiStrings_activeLocale_(), 'pb_checklist_status_done'),
  );
  return items;
}

/**
 * @param {Object} brief
 * @return {string}
 */
function ProposalBuilding_buildProposalDeckFileName_(brief) {
  return UiStrings_t(UiStrings_activeLocale_(), 'pb_checklist_deck_file_name');
}

/**
 * @param {Object} brief
 * @return {string}
 */
function ProposalBuilding_buildChecklistFileName_(brief) {
  return UiStrings_t(UiStrings_activeLocale_(), 'pb_checklist_file_name');
}

/**
 * @param {Object} brief
 * @return {string}
 */
function ProposalBuilding_buildProposalFileName_(brief) {
  return ProposalBuilding_buildProposalDeckFileName_(brief);
}

/**
 * @param {Object} brief
 * @param {GoogleAppsScript.Drive.Folder} packageFolder
 * @param {{deckName:string,deckUrl:string}=} deckMeta
 * @return {{id:string,url:string,name:string,itemCount:number}}
 */
function ProposalBuilding_createDeliveryChecklistSpreadsheet_(brief, packageFolder, deckMeta) {
  brief = ProposalBuilding_normalizeBrief_(brief || {});
  deckMeta = deckMeta || {};
  if (!packageFolder) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'pb_err_checklist_folder_missing'));
  }
  var desiredName = ProposalBuilding_buildChecklistFileName_(brief);
  var fileName = ProposalBuilding_uniqueFileNameInFolder_(packageFolder, desiredName);
  var checklistItems = ProposalBuilding_buildChecklistItemsFromBrief_(brief, deckMeta);
  var ss = SpreadsheetApp.create(fileName);
  var ssId = String(ss.getId() || '');
  var ssFile = DriveApp.getFileById(ssId);
  ssFile.moveTo(packageFolder);

  var sheet = ss.getSheets()[0];
  sheet.setName(UiStrings_t(UiStrings_activeLocale_(), 'pb_checklist_sheet_name'));
  sheet.getRange(1, 1).setValue(
    UiStrings_fmt_('pb_checklist_meta_client', {
      client:
        String(brief.clientName || '').trim() ||
        UiStrings_t(UiStrings_activeLocale_(), 'pb_client_fallback_label'),
    }),
  );
  sheet.getRange(2, 1).setValue(
    UiStrings_fmt_('pb_checklist_meta_proposal', {
      proposal: ProposalBuilding_buildProposalSubjectName_(brief),
    }),
  );

  var headerRow = 4;
  var headers = [
    '#',
    UiStrings_t(UiStrings_activeLocale_(), 'pb_checklist_col_item'),
    UiStrings_t(UiStrings_activeLocale_(), 'pb_checklist_col_due_date'),
    UiStrings_t(UiStrings_activeLocale_(), 'pb_checklist_col_status'),
    UiStrings_t(UiStrings_activeLocale_(), 'pb_checklist_col_notes'),
    UiStrings_t(UiStrings_activeLocale_(), 'pb_checklist_col_category'),
  ];
  sheet.getRange(headerRow, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(headerRow, 1, 1, headers.length).setFontWeight('bold');
  sheet.setFrozenRows(headerRow);

  var rows = [];
  var ri;
  for (ri = 0; ri < checklistItems.length; ri++) {
    var row = checklistItems[ri];
    rows.push([
      ri + 1,
      row.item,
      row.dueDate,
      row.status,
      row.notes,
      ProposalBuilding_checklistCategoryLabel_(row.category),
    ]);
  }
  if (rows.length) {
    sheet.getRange(headerRow + 1, 1, rows.length, headers.length).setValues(rows);
  }

  var statusCol = 4;
  var statusRange = sheet.getRange(headerRow + 1, statusCol, headerRow + rows.length, statusCol);
  var statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(
      [
        UiStrings_t(UiStrings_activeLocale_(), 'pb_checklist_status_pending'),
        UiStrings_t(UiStrings_activeLocale_(), 'pb_checklist_status_in_progress'),
        UiStrings_t(UiStrings_activeLocale_(), 'pb_checklist_status_done'),
        UiStrings_t(UiStrings_activeLocale_(), 'pb_checklist_status_na'),
      ],
      true,
    )
    .setAllowInvalid(false)
    .build();
  if (rows.length) statusRange.setDataValidation(statusRule);

  sheet.setColumnWidth(1, 42);
  sheet.setColumnWidth(2, 340);
  sheet.setColumnWidth(3, 120);
  sheet.setColumnWidth(4, 120);
  sheet.setColumnWidth(5, 220);
  sheet.setColumnWidth(6, 140);

  SpreadsheetApp.flush();
  return {
    id: ssId,
    url: String(ss.getUrl() || ''),
    name: String(ss.getName() || fileName),
    itemCount: checklistItems.length,
  };
}

/**
 * @param {GoogleAppsScript.Drive.Folder} folder
 * @param {string} desiredName
 * @return {string}
 */
function ProposalBuilding_uniqueFileNameInFolder_(folder, desiredName) {
  var base = String(desiredName || '').trim() || PROPOSAL_BUILDING_SUBJECT_FALLBACK_;
  var candidate = base;
  var n = 2;
  while (folder.getFilesByName(candidate).hasNext()) {
    candidate = base + ' (' + n + ')';
    n += 1;
    if (n > 50) break;
  }
  return candidate;
}

/**
 * @param {string} industryKey
 * @return {Object<string, boolean>}
 */
function ProposalBuilding_successCaseIndustryAllowlist_(industryKey) {
  var key = String(industryKey || '').trim();
  if (key === 'Logistica') {
    return { Logistica: true };
  }
  return {
    'Agencias de Turismo': true,
    'Agencias AeroEspaciales': true,
    Aeropuertos: true,
  };
}

/**
 * @param {Object} brief
 * @param {string} industryKey
 * @return {string}
 */
function ProposalBuilding_buildBriefSearchText_(brief, industryKey) {
  brief = brief || {};
  var parts = [String(industryKey || '').trim(), String(brief.clientName || '').trim()];
  var items = Array.isArray(brief.scopeItems) ? brief.scopeItems : [];
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    if (!it || typeof it !== 'object') continue;
    if (it.title) parts.push(String(it.title || '').trim());
    if (it.description) parts.push(String(it.description || '').trim());
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

/**
 * Título del deck ({Titulo}): línea corta del alcance (ej. «Desarrollo Plataforma de Gestión»).
 * @param {Object} brief
 * @return {string}
 */
function ProposalBuilding_buildDeckTitleText_(brief) {
  brief = brief || {};
  var items = Array.isArray(brief.scopeItems) ? brief.scopeItems : [];
  var titles = [];
  var i;
  for (i = 0; i < items.length; i++) {
    var it = items[i];
    if (!it || typeof it !== 'object') continue;
    var title = String(it.title || '').trim();
    if (title) titles.push(title);
  }
  if (titles.length === 1) return titles[0];
  if (titles.length > 1) return titles.slice(0, 3).join(' · ');
  if (items.length) {
    var desc = String(items[0].description || '').trim();
    if (desc) return desc.length > 90 ? desc.slice(0, 90).trim() + '…' : desc;
  }
  return UiStrings_t(UiStrings_activeLocale_(), 'pb_deck_title_fallback');
}

/**
 * @param {string} rawTitle
 * @param {Object} brief
 * @return {string}
 */
function ProposalBuilding_normalizeDeckTitle_(rawTitle, brief) {
  var title = String(rawTitle || '').trim();
  title = title.replace(/\s+/g, ' ');
  if (title.length > 90) {
    title = title.slice(0, 87).trim() + '…';
  }
  if (title) return title;
  return ProposalBuilding_buildDeckTitleText_(brief);
}

/**
 * @param {Object=} understanding
 * @param {Object} brief
 * @return {string}
 */
function ProposalBuilding_resolveDeckTitle_(understanding, brief) {
  if (understanding && typeof understanding === 'object') {
    return ProposalBuilding_normalizeDeckTitle_(understanding.deckTitle, brief);
  }
  return ProposalBuilding_buildDeckTitleText_(brief);
}

/**
 * @param {Object} parsed
 * @param {Object} brief
 * @return {{deckTitle:string, intro:string, items:Array<{title:string, description:string}>}}
 */
function ProposalBuilding_normalizeUnderstanding_(parsed, brief) {
  brief = brief || {};
  parsed = parsed && typeof parsed === 'object' ? parsed : {};
  var client = String(brief.clientName || '').trim();
  if (!client) {
    client = UiStrings_t(UiStrings_activeLocale_(), 'pb_client_fallback_label');
  }
  var deckTitle = ProposalBuilding_normalizeDeckTitle_(
    parsed.deckTitle || parsed.deck_title || parsed.title || parsed.titulo,
    brief,
  );
  var intro = String(parsed.intro || parsed.opening || '').trim();
  if (!intro) {
    intro = UiStrings_fmt_('pb_understanding_intro', { client: client });
  }

  var items = [];
  var rawItems = parsed.items;
  if (Array.isArray(rawItems)) {
    var i;
    for (i = 0; i < rawItems.length; i++) {
      var it = rawItems[i];
      if (!it || typeof it !== 'object') continue;
      var title = String(it.title || it.name || '').trim();
      var desc = String(it.description || it.detail || it.summary || '').trim();
      if (!title && !desc) continue;
      items.push({ title: title, description: desc });
    }
  }
  if (!items.length) {
    items = ProposalBuilding_briefScopeItems_(brief);
  }
  return { deckTitle: deckTitle, intro: intro, items: items };
}

/**
 * @param {Object} brief
 * @param {string=} industryKey
 * @return {{intro:string, items:Array<{title:string, description:string}>}}
 */
function ProposalBuilding_runUnderstandingComposition_(brief, industryKey) {
  brief = brief || {};
  try {
    var client = ProposalBuilding_createLlmClient_();
    var lang = ProposalBuilding_outputLangCode_(brief);

    var scopeBlock = [];
    var items = Array.isArray(brief.scopeItems) ? brief.scopeItems : [];
    var i;
    for (i = 0; i < items.length; i++) {
      var it = items[i];
      if (!it || typeof it !== 'object') continue;
      var row = '- ' + String(it.title || '').trim();
      if (it.description) row += ': ' + String(it.description || '').trim();
      if (row !== '- ') scopeBlock.push(row);
    }
    if (!scopeBlock.length) {
      scopeBlock.push('- (no detailed scope items in brief)');
    }

    var prompt = PromptCatalog_render('pb.understanding.user', {
      outputLanguage: lang === 'en' ? 'English' : 'Spanish',
      industry: String(industryKey || '').trim(),
      clientName: String(brief.clientName || '').trim(),
      commercialModel: String(brief.commercialModel || '').trim(),
      scopeBlock: scopeBlock.join('\n'),
    });

    var systemPrompt = PromptCatalog_getTemplate('pb.understanding.system');

    var result = client.chatSimple(systemPrompt, prompt, ContentExtraction_resolveChatModel_());
    var raw = String(result.text || '').trim();
    var parsed = ContentExtraction_parseLooseJson_(raw);
    return ProposalBuilding_normalizeUnderstanding_(parsed, brief);
  } catch (eCompose) {
    return ProposalBuilding_normalizeUnderstanding_({}, brief);
  }
}

/**
 * @param {string} briefJson
 * @param {string=} industryKey
 * @return {{ok:boolean, understanding:Object}}
 */
function ProposalBuilding_composeUnderstanding(briefJson, industryKey, sessionId) {
  AdminAuth_requireProposalBuildingBuild();
  AgentOrchestrator_requireGlobant_();
  var brief = {};
  try {
    brief = JSON.parse(String(briefJson || '{}'));
  } catch (eBrief) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_ephemeral_doc_payload'));
  }
  brief = ProposalBuilding_normalizeBrief_(brief);
  var industry = String(industryKey || '').trim();
  try {
    ProposalBuildingPersistence_recordConfigureStep_(sessionId, brief, industry);
  } catch (eCfgPersist) {
    AviatorsError_log_('ProposalBuilding_configure_persist', String(eCfgPersist && eCfgPersist.message));
  }
  var understanding = ProposalBuilding_runUnderstandingComposition_(brief, industryKey);
  try {
    ProposalBuildingPersistence_recordDeckAiStep_(sessionId, 'compose_understanding', {
      understanding: understanding,
    });
  } catch (eUndPersist) {
    AviatorsError_log_('ProposalBuilding_understanding_persist', String(eUndPersist && eUndPersist.message));
  }
  return { ok: true, understanding: understanding };
}

/**
 * @param {Object} brief
 * @return {Array<{title:string, description:string}>}
 */
function ProposalBuilding_briefScopeItems_(brief) {
  brief = brief || {};
  var items = Array.isArray(brief.scopeItems) ? brief.scopeItems : [];
  var out = [];
  var i;
  for (i = 0; i < items.length; i++) {
    var it = items[i];
    if (!it || typeof it !== 'object') continue;
    out.push({
      title: String(it.title || '').trim(),
      description: String(it.description || '').trim(),
    });
  }
  return out;
}

/**
 * @param {string} contentId
 * @return {Object|null}
 */
function ProposalBuilding_loadSuccessCaseForDeck_(contentId) {
  var id = String(contentId || '').trim();
  if (!id) return null;
  var row = ContentCatalogStore_getById(id);
  if (!row || String(row.content_type || '').trim() !== 'success_case') return null;
  var specific = ContentCatalogStore_rowToSpecific_(row);
  return {
    contentId: id,
    title: String(row.title || '').trim(),
    summary: String(row.summary || '').trim(),
    challenge: String(specific.challenge || '').trim(),
    solution: String(specific.solution || '').trim(),
    url: String(row.drive_file_url || '').trim(),
    industry: String(row.industry || '').trim(),
    client_name: String(row.client_name || '').trim(),
  };
}

/**
 * @param {Object} brief
 * @param {string} industryKey
 * @return {Array<Object>}
 */
function ProposalBuilding_findRelevantSuccessCases_(brief, industryKey) {
  var query = ProposalBuilding_buildBriefSearchText_(brief, industryKey);
  if (!query) return [];

  var allow = ProposalBuilding_successCaseIndustryAllowlist_(industryKey);
  var candTokens = ContentDuplicateCheck_tokenSet_(query);
  /** @type {Object<string, Object>} */
  var byId = {};

  function mergeHit_(id, patch) {
    if (!id) return;
    if (!byId[id]) {
      byId[id] = {
        content_id: id,
        similarity: 0,
        lexical: 0,
        semantic: 0,
      };
    }
    var cur = byId[id];
    if (patch.lexical != null) cur.lexical = Math.max(cur.lexical, patch.lexical);
    if (patch.semantic != null) cur.semantic = Math.max(cur.semantic, patch.semantic);
    cur.similarity = Math.max(cur.lexical, cur.semantic);
  }

  var rows = ContentCatalogStore_listAllPages_({ contentType: 'success_case' }, 100, 2000);
  var ri;
  for (ri = 0; ri < rows.length; ri++) {
    var row = rows[ri];
    var rid = String(row.content_id || '').trim();
    if (!rid) continue;

    var rowIndustry = String(row.industry || '').trim();
    if (rowIndustry && !allow[rowIndustry]) continue;

    var rowText = String(row.search_text || '').trim();
    if (!rowText) {
      rowText = ContentCatalog_buildSearchText_({
        title: row.title,
        summary: row.summary,
        client_name: row.client_name,
        industry: row.industry,
        tags_csv: row.tags_csv,
        content_type: row.content_type,
        file_name: row.file_name,
        specific: ContentCatalogStore_rowToSpecific_(row),
      });
    }
    var lex = ContentDuplicateCheck_jaccard_(
      candTokens,
      ContentDuplicateCheck_tokenSet_(rowText),
    );
    if (lex < 0.12) continue;
    mergeHit_(rid, { lexical: lex });
  }

  var semHits = ContentCatalog_findRowsSemantic_(query, {
    limit: PROPOSAL_BUILDING_SUCCESS_CASE_CANDIDATE_MAX_ + 2,
    threshold: PROPOSAL_BUILDING_SUCCESS_CASE_SEMANTIC_MIN_,
  });
  var si;
  for (si = 0; si < semHits.length; si++) {
    var doc = semHits[si].doc || {};
    if (String(doc.contentType || '').trim() !== 'success_case') continue;
    var semId = String(doc.contentId || '').trim();
    if (!semId) continue;
    var docIndustry = String(doc.industry || '').trim();
    if (docIndustry && !allow[docIndustry]) continue;
    mergeHit_(semId, { semantic: Number(semHits[si].similarity || 0) });
  }

  var ranked = [];
  var key;
  for (key in byId) {
    if (!Object.prototype.hasOwnProperty.call(byId, key)) continue;
    var hit = byId[key];
    if (hit.similarity < PROPOSAL_BUILDING_SUCCESS_CASE_COMBINED_MIN_) continue;
    var card = ProposalBuilding_loadSuccessCaseForDeck_(key);
    if (!card) continue;
    card.similarity = hit.similarity;
    ranked.push(card);
  }
  ranked.sort(function (a, b) {
    return Number(b.similarity || 0) - Number(a.similarity || 0);
  });
  if (ranked.length > PROPOSAL_BUILDING_SUCCESS_CASE_CANDIDATE_MAX_) {
    ranked = ranked.slice(0, PROPOSAL_BUILDING_SUCCESS_CASE_CANDIDATE_MAX_);
  }

  if (!ranked.length) {
    var fallback = [];
    for (ri = 0; ri < rows.length && fallback.length < PROPOSAL_BUILDING_SUCCESS_CASE_MIN_CANDIDATES_; ri++) {
      var fbRow = rows[ri];
      if (String(fbRow.content_type || '').trim() !== 'success_case') continue;
      var fbIndustry = String(fbRow.industry || '').trim();
      if (fbIndustry && !allow[fbIndustry]) continue;
      var fbCard = ProposalBuilding_loadSuccessCaseForDeck_(String(fbRow.content_id || '').trim());
      if (fbCard) fallback.push(fbCard);
    }
    ranked = fallback;
  }

  return ProposalBuilding_padSuccessCaseCandidates_(
    ranked,
    allow,
    PROPOSAL_BUILDING_SUCCESS_CASE_MIN_CANDIDATES_,
    PROPOSAL_BUILDING_SUCCESS_CASE_CANDIDATE_MAX_,
  );
}

/**
 * Completa candidatos hasta un mínimo con casos del catálogo (misma industria permitida).
 * @param {Array<Object>} ranked
 * @param {Object<string, boolean>} allow
 * @param {number} minCount
 * @param {number} maxCount
 * @return {Array<Object>}
 */
function ProposalBuilding_padSuccessCaseCandidates_(ranked, allow, minCount, maxCount) {
  ranked = Array.isArray(ranked) ? ranked.slice() : [];
  allow = allow && typeof allow === 'object' ? allow : {};
  minCount = Math.max(0, Number(minCount) || 0);
  maxCount = Math.max(minCount, Number(maxCount) || minCount);

  var seen = {};
  var i;
  for (i = 0; i < ranked.length; i++) {
    seen[String(ranked[i].contentId || '').trim()] = true;
  }

  if (ranked.length < minCount) {
    var rows = ContentCatalogStore_listAllPages_({ contentType: 'success_case' }, 100, 500);
    var ri;
    for (ri = 0; ri < rows.length && ranked.length < minCount; ri++) {
      var row = rows[ri];
      if (String(row.content_type || '').trim() !== 'success_case') continue;
      var rid = String(row.content_id || '').trim();
      if (!rid || seen[rid]) continue;
      var rowIndustry = String(row.industry || '').trim();
      if (rowIndustry && !allow[rowIndustry]) continue;
      var card = ProposalBuilding_loadSuccessCaseForDeck_(rid);
      if (!card) continue;
      card.similarity = Number(card.similarity || 0);
      ranked.push(card);
      seen[rid] = true;
    }
  }

  if (ranked.length > maxCount) ranked = ranked.slice(0, maxCount);
  return ranked;
}

/**
 * @param {Array<Object>} cases
 * @param {Object} parsed
 * @return {Array<Object>}
 */
function ProposalBuilding_mergeSuccessCaseRationales_(cases, parsed, brief) {
  cases = Array.isArray(cases) ? cases : [];
  parsed = parsed && typeof parsed === 'object' ? parsed : {};
  var fallback = UiStrings_t(ProposalBuilding_briefLangCode_(brief), 'pb_success_case_rationale_fallback');
  var rationales = [];
  if (Array.isArray(parsed.rationales)) rationales = parsed.rationales;
  else if (Array.isArray(parsed.items)) rationales = parsed.items;

  /** @type {Object<string, string>} */
  var byId = {};
  var ri;
  for (ri = 0; ri < rationales.length; ri++) {
    var row = rationales[ri];
    if (!row || typeof row !== 'object') continue;
    var id = String(row.contentId || row.content_id || '').trim();
    var text = String(row.rationale || row.reason || row.explanation || '').trim();
    if (id && text) byId[id] = text;
  }

  var out = [];
  var ci;
  for (ci = 0; ci < cases.length; ci++) {
    var c = cases[ci] || {};
    var contentId = String(c.contentId || '').trim();
    var idxText = '';
    if (rationales[ci] && typeof rationales[ci] === 'object') {
      idxText = String(
        rationales[ci].rationale || rationales[ci].reason || rationales[ci].explanation || '',
      ).trim();
    }
    var existing = String(c.rationale || '').trim();
    var rationale = (contentId && byId[contentId]) || idxText || existing || fallback;
    out.push({
      contentId: contentId,
      title: c.title,
      summary: c.summary,
      challenge: c.challenge,
      solution: c.solution,
      url: c.url,
      industry: c.industry,
      client_name: c.client_name,
      similarity: c.similarity,
      rationale: rationale,
      included: c.included !== false,
    });
  }
  return out;
}

/**
 * @param {Object} brief
 * @param {string=} industryKey
 * @param {Array<Object>} cases
 * @return {Array<Object>}
 */
function ProposalBuilding_buildSuccessCaseRationalesPrompt_(brief, industryKey, cases) {
  brief = ProposalBuilding_normalizeBrief_(brief || {});
  cases = Array.isArray(cases) ? cases : [];

  var scopeBlock = [];
  var items = Array.isArray(brief.scopeItems) ? brief.scopeItems : [];
  var i;
  for (i = 0; i < items.length; i++) {
    var it = items[i];
    if (!it || typeof it !== 'object') continue;
    var row = '- ' + String(it.title || '').trim();
    if (it.description) row += ': ' + String(it.description || '').trim();
    if (row !== '- ') scopeBlock.push(row);
  }
  if (!scopeBlock.length) {
    scopeBlock.push('- (no detailed scope items in brief)');
  }

  var caseBlocks = [];
  for (i = 0; i < cases.length; i++) {
    var c = cases[i] || {};
    caseBlocks.push(
      String(i + 1) +
        '. contentId=' +
        String(c.contentId || '').trim() +
        ' | title=' +
        String(c.title || '').trim() +
        ' | client=' +
        String(c.client_name || '').trim() +
        ' | industry=' +
        String(c.industry || '').trim() +
        ' | summary=' +
        String(c.summary || '').trim().slice(0, 420) +
        (c.challenge ? ' | challenge=' + String(c.challenge).trim().slice(0, 280) : '') +
        (c.solution ? ' | solution=' + String(c.solution).trim().slice(0, 280) : ''),
    );
  }

  return PromptCatalog_render('pb.success_rationales.user', {
    outputLanguage: ProposalBuilding_briefOutputLanguageLabel_(brief),
    industry: String(industryKey || '').trim(),
    clientName: String(brief.clientName || '').trim(),
    commercialModel: String(brief.commercialModel || '').trim(),
    scopeBlock: scopeBlock.join('\n'),
    caseBlocks: caseBlocks.join('\n'),
  });
}

/**
 * @param {Object} brief
 * @param {string=} industryKey
 * @param {Array<Object>} cases
 * @return {Array<Object>}
 */
function ProposalBuilding_runSuccessCaseRationalesComposition_(brief, industryKey, cases) {
  cases = Array.isArray(cases) ? cases : [];
  if (!cases.length) return [];
  try {
    var prompt = ProposalBuilding_buildSuccessCaseRationalesPrompt_(brief, industryKey, cases);
    var r = AgentOrchestrator_answerWith(prompt, _ADMIN_AGENT_ID_SUCCESS_CASES, []);
    var raw = String(r.answer || '').trim();
    if (!raw || r.isUnanswered || raw.indexOf('[[NO_RELEVANT_CONTENT]]') >= 0) {
      return ProposalBuilding_mergeSuccessCaseRationales_(cases, {}, brief);
    }
    var parsed = ContentExtraction_parseLooseJson_(raw);
    return ProposalBuilding_mergeSuccessCaseRationales_(cases, parsed, brief);
  } catch (eRationales) {
    AviatorsError_log_(
      'ProposalBuilding_success_rationales',
      String(eRationales && eRationales.message),
    );
    return ProposalBuilding_mergeSuccessCaseRationales_(cases, {}, brief);
  }
}

/**
 * @param {string} briefJson
 * @param {string=} industryKey
 * @param {string=} sessionId
 * @param {string=} casesJson Candidatos opcionales (p. ej. selección del paso presale).
 * @return {{ok:boolean, successCases:Array<Object>, count:number}}
 */
function ProposalBuilding_composeSuccessCaseRationales(briefJson, industryKey, sessionId, casesJson) {
  AdminAuth_requireProposalBuildingBuild();
  AgentOrchestrator_requireGlobant_();
  var brief = {};
  try {
    brief = JSON.parse(String(briefJson || '{}'));
  } catch (eBrief) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_ephemeral_doc_payload'));
  }
  brief = ProposalBuilding_normalizeBrief_(brief);
  var cases = [];
  try {
    cases = JSON.parse(String(casesJson || '[]'));
  } catch (eCases) {
    cases = [];
  }
  if (!Array.isArray(cases) || !cases.length) {
    cases = ProposalBuilding_findRelevantSuccessCases_(brief, industryKey);
  } else {
    cases = ProposalBuilding_normalizeSuccessCaseSelections_(cases);
    var includedOnly = [];
    var pi;
    for (pi = 0; pi < cases.length; pi++) {
      if (cases[pi].included !== false) includedOnly.push(cases[pi]);
    }
    cases = includedOnly;
  }
  if (!cases.length) {
    try {
      ProposalBuildingPersistence_recordDeckAiStep_(sessionId, 'compose_success_rationales', {
        successCases: [],
        count: 0,
      });
    } catch (eCasesEmptyPersist) {
      AviatorsError_log_('ProposalBuilding_cases_persist', String(eCasesEmptyPersist && eCasesEmptyPersist.message));
    }
    return { ok: true, successCases: [], count: 0 };
  }
  var withRationales = ProposalBuilding_runSuccessCaseRationalesComposition_(
    brief,
    industryKey,
    cases,
  );
  try {
    ProposalBuildingPersistence_recordDeckAiStep_(sessionId, 'compose_success_rationales', {
      successCases: withRationales,
      count: withRationales.length,
    });
  } catch (eCasesPersist) {
    AviatorsError_log_('ProposalBuilding_cases_persist', String(eCasesPersist && eCasesPersist.message));
  }
  return { ok: true, successCases: withRationales, count: withRationales.length };
}

/**
 * @param {Array<Object>} selections
 * @return {Array<Object>}
 */
function ProposalBuilding_normalizeSuccessCaseSelections_(selections) {
  var list = Array.isArray(selections) ? selections : [];
  var out = [];
  var i;
  for (i = 0; i < list.length; i++) {
    var c = list[i] || {};
    var contentId = String(c.contentId || c.content_id || '').trim();
    if (!contentId) continue;
    out.push({
      contentId: contentId,
      title: String(c.title || '').trim(),
      summary: String(c.summary || '').trim(),
      challenge: String(c.challenge || '').trim(),
      solution: String(c.solution || '').trim(),
      url: String(c.url || c.driveFileUrl || '').trim(),
      industry: String(c.industry || '').trim(),
      client_name: String(c.client_name || c.clientName || '').trim(),
      similarity: Number(c.similarity || 0),
      rationale: String(c.rationale || '').trim(),
      included: c.included !== false,
    });
  }
  return out;
}

/**
 * Propone casos de éxito para presale (mín. 5 candidatos) con rationale por agente.
 * @param {string} briefJson
 * @param {string=} industryKey
 * @param {string=} sessionId
 * @return {{ok:boolean,successCases:Array<Object>,count:number}}
 */
function ProposalBuilding_recommendSuccessCases(briefJson, industryKey, sessionId) {
  AdminAuth_requireProposalBuildingBuild();
  AgentOrchestrator_requireGlobant_();
  var brief = {};
  try {
    brief = JSON.parse(String(briefJson || '{}'));
  } catch (eBriefJson) {
    brief = {};
  }
  brief = ProposalBuilding_normalizeBrief_(brief);
  var industry = String(industryKey || '').trim();
  var cases = ProposalBuilding_findRelevantSuccessCases_(brief, industry);
  if (!cases.length) {
    try {
      ProposalBuildingPersistence_recordSuccessCasesStep_(sessionId, brief, industry, []);
    } catch (eEmpty) {
      AviatorsError_log_('ProposalBuilding_success_cases_persist', String(eEmpty && eEmpty.message));
    }
    return { ok: true, successCases: [], count: 0 };
  }
  var withRationales = ProposalBuilding_runSuccessCaseRationalesComposition_(brief, industry, cases);
  var selections = [];
  var si;
  for (si = 0; si < withRationales.length; si++) {
    var row = withRationales[si] || {};
    selections.push({
      contentId: row.contentId,
      title: row.title,
      summary: row.summary,
      challenge: row.challenge,
      solution: row.solution,
      url: row.url,
      industry: row.industry,
      client_name: row.client_name,
      similarity: row.similarity,
      rationale: row.rationale,
      included: true,
    });
  }
  try {
    ProposalBuildingPersistence_recordSuccessCasesStep_(sessionId, brief, industry, selections);
  } catch (ePersist) {
    AviatorsError_log_('ProposalBuilding_success_cases_persist', String(ePersist && ePersist.message));
  }
  return { ok: true, successCases: selections, count: selections.length };
}

/**
 * Persiste la selección de casos de éxito (incluidos/excluidos) antes de configurar el deck.
 * @param {string} sessionId
 * @param {string} selectionsJson
 * @return {{ok:boolean,successCases:Array<Object>,count:number}}
 */
function ProposalBuilding_saveSuccessCaseSelections(sessionId, selectionsJson) {
  AdminAuth_requireProposalBuildingBuild();
  var email = ProposalBuildingPersistence_requireEmail_();
  var sid = String(sessionId || '').trim();
  if (!sid) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'pb_err_session_missing'));
  }
  var row = ProposalBuildingStore_getByIdForUser(sid, email);
  if (!row) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'pb_err_session_not_found'));
  }
  var selections = [];
  try {
    selections = JSON.parse(String(selectionsJson || '[]'));
  } catch (eSel) {
    selections = [];
  }
  selections = ProposalBuilding_normalizeSuccessCaseSelections_(selections);
  var brief = row.validatedBrief || row.draftBrief || {};
  var industry = String(row.industryKey || '').trim();
  ProposalBuildingPersistence_recordSuccessCasesStep_(sid, brief, industry, selections);
  return { ok: true, successCases: selections, count: selections.length };
}

/**
 * @param {string} presentationId
 * @param {Object} brief
 * @param {string} industryKey
 * @param {Object=} understanding
 * @param {Array<Object>=} successCases casos con rationale (si se omiten, se buscan en catálogo)
 * @param {Object=} deckOptions includeGlobant / includeAirlinesStudio
 * @return {{successCasesApplied:number,warnings:Array<string>,successCases:Array<Object>}}
 */
function ProposalBuilding_customizeDeckContent_(
  presentationId,
  brief,
  industryKey,
  understanding,
  successCases,
  deckOptions,
) {
  var cases =
    Array.isArray(successCases) && successCases.length
      ? successCases
      : ProposalBuilding_findRelevantSuccessCases_(brief, industryKey);
  if (Array.isArray(successCases) && successCases.length) {
    var missingRationale = false;
    var mi;
    for (mi = 0; mi < cases.length; mi++) {
      if (!String(cases[mi].rationale || '').trim()) {
        missingRationale = true;
        break;
      }
    }
    if (missingRationale) {
      cases = ProposalBuilding_runSuccessCaseRationalesComposition_(brief, industryKey, cases);
    }
  } else if (cases.length) {
    cases = ProposalBuilding_runSuccessCaseRationalesComposition_(brief, industryKey, cases);
  }
  var deckCases = [];
  var ci;
  for (ci = 0; ci < cases.length; ci++) {
    deckCases.push({
      title: cases[ci].title,
      summary: cases[ci].summary,
      challenge: cases[ci].challenge,
      solution: cases[ci].solution,
      url: cases[ci].url,
      rationale: cases[ci].rationale,
    });
  }
  var understandingPayload =
    understanding && typeof understanding === 'object' ? understanding : null;
  if (!understandingPayload) {
    understandingPayload = {
      deckTitle: ProposalBuilding_buildDeckTitleText_(brief),
      intro: '',
      items: ProposalBuilding_briefScopeItems_(brief),
    };
  }
  var normalizedDeckOptions = ProposalBuilding_normalizeDeckOptions_(deckOptions, industryKey);
  var customized = ProposalBuildingSlides_customizeDeck_(presentationId, {
    clientName: String(brief.clientName || '').trim(),
    deckTitle: ProposalBuilding_resolveDeckTitle_(understandingPayload, brief),
    understanding: understandingPayload,
    scopeItems: understandingPayload.items,
    successCases: deckCases,
    deckOptions: normalizedDeckOptions,
  });
  return {
    successCasesApplied: customized.successCasesApplied || 0,
    warnings: customized.warnings || [],
    successCases: cases,
  };
}

/**
 * Copia la plantilla a Propuestas/ sin personalizar slides.
 * @param {string} baseDeckFileId
 * @param {Object} brief
 * @return {{id:string,url:string,name:string}}
 */
function ProposalBuilding_copyProposalDeckToDrive_(baseDeckFileId, brief) {
  var templateId = String(baseDeckFileId || '').trim();
  if (!templateId) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'pb_err_deck_template_missing'));
  }
  var packageInfo = ProposalBuilding_getProposalPackageFolder_(brief);
  var targetFolder = packageInfo.folder;
  var desiredName = ProposalBuilding_buildProposalDeckFileName_(brief);
  var copyName = ProposalBuilding_uniqueFileNameInFolder_(targetFolder, desiredName);
  var templateFile;
  try {
    templateFile = DriveApp.getFileById(templateId);
  } catch (eMissing) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'pb_err_deck_template_not_found'));
  }
  var mime = String(templateFile.getMimeType() || '').trim();
  if (mime !== 'application/vnd.google-apps.presentation') {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'pb_err_deck_not_google_slides'));
  }

  var copy = templateFile.makeCopy(copyName, targetFolder);
  var deckMeta = {
    deckName: String(copy.getName() || copyName),
    deckUrl: String(copy.getUrl() || ''),
  };
  var checklist = ProposalBuilding_createDeliveryChecklistSpreadsheet_(brief, targetFolder, deckMeta);
  return {
    id: String(copy.getId() || ''),
    url: String(copy.getUrl() || ''),
    name: String(copy.getName() || copyName),
    packageFolderId: packageInfo.id,
    packageFolderUrl: packageInfo.url,
    packageFolderName: packageInfo.name,
    clientFolderName: packageInfo.clientName,
    checklistFileId: checklist.id,
    checklistFileUrl: checklist.url,
    checklistFileName: checklist.name,
    checklistItemCount: checklist.itemCount,
  };
}

/**
 * @param {string} industryKey
 * @param {string} briefJson
 * @return {Object}
 */
function ProposalBuilding_copyProposalDeck(industryKey, briefJson, sessionId) {
  AdminAuth_requireProposalBuildingBuild();
  var industry = String(industryKey || '').trim();
  var valid = false;
  var vi;
  for (vi = 0; vi < PROPOSAL_BUILDING_INDUSTRY_KEYS.length; vi++) {
    if (PROPOSAL_BUILDING_INDUSTRY_KEYS[vi] === industry) valid = true;
  }
  if (!valid) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'pb_err_industry_required'));
  }
  var brief = {};
  try {
    if (briefJson) brief = JSON.parse(briefJson);
  } catch (eBrief) {
    brief = {};
  }
  brief = ProposalBuilding_normalizeBrief_(brief);
  var deck = ProposalBuilding_resolveDeckForIndustry_(industry);
  var copied = ProposalBuilding_copyProposalDeckToDrive_(deck.deckDriveId, brief);
  var deckPayload = {
    proposalDeckFileId: copied.id,
    proposalDeckFileUrl: copied.url,
    proposalDeckFileName: copied.name,
    proposalPackageFolderId: copied.packageFolderId || '',
    proposalPackageFolderUrl: copied.packageFolderUrl || '',
    proposalPackageFolderName: copied.packageFolderName || '',
    checklistFileId: copied.checklistFileId || '',
    checklistFileUrl: copied.checklistFileUrl || '',
    checklistFileName: copied.checklistFileName || '',
    checklistItemCount: copied.checklistItemCount || 0,
  };
  try {
    ProposalBuildingPersistence_recordDeckAiStep_(sessionId, 'copy_deck', deckPayload);
    ProposalBuildingPersistence_patchSession_(sessionId, {
      deckFileId: copied.id,
      deckFileUrl: copied.url,
      deckFileName: copied.name,
      checklistFileId: copied.checklistFileId || '',
      checklistFileUrl: copied.checklistFileUrl || '',
      checklistFileName: copied.checklistFileName || '',
      packageFolderId: copied.packageFolderId || '',
      packageFolderUrl: copied.packageFolderUrl || '',
      packageFolderName: copied.packageFolderName || '',
    });
  } catch (eCopyPersist) {
    AviatorsError_log_('ProposalBuilding_copy_deck_persist', String(eCopyPersist && eCopyPersist.message));
  }
  return {
    ok: true,
    industry: industry,
    deckKey: deck.deckKey,
    deckLabel: deck.deckLabel,
    deckDriveId: deck.deckDriveId,
    proposalDeckFileId: copied.id,
    proposalDeckFileUrl: copied.url,
    proposalDeckFileName: copied.name,
    proposalPackageFolderId: copied.packageFolderId || '',
    proposalPackageFolderUrl: copied.packageFolderUrl || '',
    proposalPackageFolderName: copied.packageFolderName || '',
    checklistFileId: copied.checklistFileId || '',
    checklistFileUrl: copied.checklistFileUrl || '',
    checklistFileName: copied.checklistFileName || '',
    checklistItemCount: copied.checklistItemCount || 0,
  };
}

/**
 * @param {string} presentationId
 * @param {string} industryKey
 * @param {string} briefJson
 * @param {string} understandingJson
 * @return {Object}
 */
function ProposalBuilding_customizeProposalDeck(
  presentationId,
  industryKey,
  briefJson,
  understandingJson,
  successCasesJson,
  deckOptionsJson,
  sessionId,
) {
  AdminAuth_requireProposalBuildingBuild();
  var fileId = String(presentationId || '').trim();
  if (!fileId) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'pb_err_deck_template_missing'));
  }
  var industry = String(industryKey || '').trim();
  var brief = {};
  var understanding = null;
  var successCases = null;
  try {
    if (briefJson) brief = JSON.parse(briefJson);
  } catch (eBrief) {
    brief = {};
  }
  try {
    if (understandingJson) understanding = JSON.parse(understandingJson);
  } catch (eUnd) {
    understanding = null;
  }
  try {
    if (successCasesJson) successCases = JSON.parse(successCasesJson);
  } catch (eCases) {
    successCases = null;
  }
  var deckOptions = null;
  try {
    if (deckOptionsJson) deckOptions = JSON.parse(deckOptionsJson);
  } catch (eDeckOpts) {
    deckOptions = null;
  }
  brief = ProposalBuilding_normalizeBrief_(brief);
  if (understanding && typeof understanding === 'object') {
    understanding = ProposalBuilding_normalizeUnderstanding_(understanding, brief);
  }
  if (successCases && !Array.isArray(successCases)) successCases = null;
  var customization = ProposalBuilding_customizeDeckContent_(
    fileId,
    brief,
    industry,
    understanding,
    successCases,
    deckOptions,
  );
  var normalizedDeckOptions = ProposalBuilding_normalizeDeckOptions_(deckOptions, industry);
  var customResult = {
    ok: true,
    proposalDeckFileId: fileId,
    deckOptions: normalizedDeckOptions,
    successCasesApplied: customization.successCasesApplied || 0,
    successCaseTitles: (customization.successCases || [])
      .map(function (sc) {
        return String(sc.title || '').trim();
      })
      .filter(function (t) {
        return !!t;
      }),
    customizationWarnings: customization.warnings || [],
  };
  try {
    ProposalBuildingPersistence_recordDeckAiStep_(sessionId, 'customize_deck', customResult);
    ProposalBuildingPersistence_recordDeckComplete_(sessionId, brief, industry, {
      proposalDeckFileId: fileId,
    }, {
      composedUnderstanding: understanding,
      deckOptions: normalizedDeckOptions,
      successCases: successCases || [],
      successCasesApplied: customResult.successCasesApplied,
      successCaseTitles: customResult.successCaseTitles,
      customizationWarnings: customResult.customizationWarnings,
    });
  } catch (eCustomPersist) {
    AviatorsError_log_('ProposalBuilding_customize_persist', String(eCustomPersist && eCustomPersist.message));
  }
  return customResult;
}

/**
 * @param {string} baseDeckFileId
 * @param {Object} brief
 * @param {string} industryKey
 * @param {Object=} understanding
 * @return {{id:string,url:string,name:string,successCasesApplied:number,warnings:Array<string>,successCases:Array<Object>}}
 */
function ProposalBuilding_copyBaseDeckToDrive_(baseDeckFileId, brief, industryKey, understanding) {
  var copied = ProposalBuilding_copyProposalDeckToDrive_(baseDeckFileId, brief);
  var customization = ProposalBuilding_customizeDeckContent_(
    copied.id,
    brief,
    industryKey,
    understanding,
  );
  return {
    id: copied.id,
    url: copied.url,
    name: copied.name,
    successCasesApplied: customization.successCasesApplied,
    warnings: customization.warnings,
    successCases: customization.successCases,
  };
}

/**
 * @param {Object=} raw
 * @param {string=} industryKey
 * @return {{includeGlobant:boolean, includeAirlinesStudio:boolean}}
 */
function ProposalBuilding_normalizeDeckOptions_(raw, industryKey) {
  raw = raw && typeof raw === 'object' ? raw : {};
  var industry = String(industryKey || '').trim();
  var includeGlobant = raw.includeGlobant !== false && raw.includeGlobant !== 'false';
  var includeAirlinesStudio = false;
  if (industry === 'Aerolineas') {
    includeAirlinesStudio =
      raw.includeAirlinesStudio !== false && raw.includeAirlinesStudio !== 'false';
  }
  return {
    includeGlobant: includeGlobant,
    includeAirlinesStudio: includeAirlinesStudio,
  };
}

/**
 * @param {string} industryKey
 * @return {{deckKey:string,deckLabel:string,deckDriveId:string}}
 */
function ProposalBuilding_resolveDeckForIndustry_(industryKey) {
  var key = String(industryKey || '').trim();
  var deckKey = key === 'Logistica' ? 'logistics' : 'airlines';
  var props = PropertiesService.getScriptProperties();
  var propName =
    deckKey === 'logistics' ? 'PROPOSAL_DECK_LOGISTICS_ID' : 'PROPOSAL_DECK_AIRLINES_ID';
  var deckDriveId = String(props.getProperty(propName) || '').trim();
  var deckLabel = UiStrings_t(
    UiStrings_activeLocale_(),
    deckKey === 'logistics' ? 'pb_deck_logistics' : 'pb_deck_airlines',
  );
  return { deckKey: deckKey, deckLabel: deckLabel, deckDriveId: deckDriveId };
}

/**
 * @param {Object} context
 * @return {string}
 */
function ProposalBuilding_buildSystemContext_(context) {
  context = context || {};
  var brief = context.validatedBrief || {};
  var industry = String(context.industry || '').trim();
  var deck = ProposalBuilding_resolveDeckForIndustry_(industry);
  var lang = ProposalBuilding_outputLangCode_(brief);
  var workingDeck = context.proposalDeckFileName
    ? context.proposalDeckFileName +
      (context.proposalDeckFileUrl ? ' · ' + context.proposalDeckFileUrl : '')
    : deck.deckLabel + (deck.deckDriveId ? ' (plantilla: ' + deck.deckDriveId + ')' : '');
  var packageFolderLine = context.proposalPackageFolderUrl
    ? 'Carpeta de la propuesta en Drive: ' + context.proposalPackageFolderUrl + '.'
    : '';
  var checklistLine = context.checklistFileUrl
    ? 'Checklist de entregables: ' +
      (context.checklistFileName || 'checklist') +
      ' · ' +
      context.checklistFileUrl +
      '.'
    : '';
  var deckOpts = ProposalBuilding_normalizeDeckOptions_(context.deckOptions, industry);
  var deletedForAgenda = ProposalBuildingSlides_collectDeletedSlideIndices_(deckOpts);
  var agendaPreview = ProposalBuildingSlides_buildAgendaText_(deckOpts, deletedForAgenda);
  var deckOptionsLine =
    'Secciones del deck: Globant=' +
    (deckOpts.includeGlobant ? 'sí' : 'no') +
    ', Studio aerolíneas=' +
    (deckOpts.includeAirlinesStudio ? 'sí' : 'no') +
    '.';
  var successCasesLine = '';
  if (context.successCasesApplied > 0) {
    successCasesLine =
      'Casos de éxito insertados en el deck: ' + String(context.successCasesApplied) + '.';
    if (Array.isArray(context.successCases) && context.successCases.length) {
      var sc;
      for (sc = 0; sc < context.successCases.length; sc++) {
        var scRow = context.successCases[sc] || {};
        var scTitle = String(scRow.title || '').trim();
        var scWhy = String(scRow.rationale || '').trim();
        if (!scTitle) continue;
        successCasesLine +=
          '\n- ' + scTitle + (scWhy ? ' — Motivo de inclusión: ' + scWhy : '');
      }
    } else if (Array.isArray(context.successCaseTitles) && context.successCaseTitles.length) {
      successCasesLine += ' ' + context.successCaseTitles.join('; ');
    }
  }
  var lines = [
    'MODO ARMADO DE PROPUESTA — contexto validado por el usuario.',
    'Idioma de redacción: ' + (lang === 'en' ? 'English' : 'Español') + '.',
    'Industria: ' + industry + '.',
    'Presentación de trabajo en Drive: ' + workingDeck + '.',
  ];
  if (packageFolderLine) lines.push(packageFolderLine);
  if (checklistLine) lines.push(checklistLine);
  lines.push(
    deckOptionsLine,
    'Agenda ({ITEMS_AGENDA}):\n' + agendaPreview,
    successCasesLine || 'Casos de éxito en deck: (ninguno automático o slide plantilla omitida).',
    'Cliente: ' + (String(brief.clientName || '').trim() || '(no indicado)'),
    'Título deck ({Titulo}): ' +
      ProposalBuilding_resolveDeckTitle_(context.composedUnderstanding, brief),
    'Nuestro entendimiento ({OUR_UNDERSTANDING}): ' +
      ProposalBuildingSlides_buildUnderstandingContent_(
        String(brief.clientName || '').trim(),
        context.composedUnderstanding && Array.isArray(context.composedUnderstanding.items)
          ? context.composedUnderstanding.items
          : ProposalBuilding_briefScopeItems_(brief),
        context.composedUnderstanding ? context.composedUnderstanding.intro : '',
      ).plain,
    'Modelo comercial: ' + (String(brief.commercialModel || '').trim() || '(no indicado)'),
    'Alcance validado:',
  );
  var items = Array.isArray(brief.scopeItems) ? brief.scopeItems : [];
  if (!items.length) {
    lines.push('- (sin ítems detallados)');
  } else {
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var row = String(it.title || '').trim();
      if (it.description) row += (row ? ': ' : '') + String(it.description || '').trim();
      lines.push('- ' + (row || '(ítem vacío)'));
    }
  }
  lines.push('Hitos / fechas:');
  var ms = Array.isArray(brief.milestones) ? brief.milestones : [];
  if (!ms.length) {
    lines.push('- (sin fechas explícitas)');
  } else {
    for (var j = 0; j < ms.length; j++) {
      var m = ms[j];
      lines.push(
        '- ' +
          String(m.label || 'Hito').trim() +
          (m.date ? ' · ' + m.date : '') +
          (m.notes ? ' — ' + m.notes : ''),
      );
    }
  }
  if (brief.rfpDeadline) {
    lines.push('Fecha límite RFP / entrega propuesta: ' + brief.rfpDeadline);
  }
  if (ProposalBuilding_budgetHasEvidence_(brief.budget)) {
    var budget = brief.budget || ProposalBuilding_normalizeBudget_(null);
    var budgetLine = '';
    if (budget.amount) budgetLine += budget.amount;
    if (budget.currency) budgetLine += (budgetLine ? ' ' : '') + budget.currency;
    if (budget.notes) budgetLine += (budgetLine ? ' — ' : '') + budget.notes;
    lines.push('Presupuesto / budget: ' + budgetLine);
  }
  var stks = Array.isArray(brief.stakeholders) ? brief.stakeholders : [];
  if (stks.length) {
    lines.push('Stakeholders:');
    for (var sk = 0; sk < stks.length; sk++) {
      var stk = stks[sk];
      lines.push(
        '- ' +
          String(stk.name || '').trim() +
          (stk.role ? ' · ' + stk.role : '') +
          (stk.organization ? ' · ' + stk.organization : '') +
          (stk.email ? ' · ' + stk.email : ''),
      );
    }
  }
  lines.push('Objetivos de negocio:');
  var objs = Array.isArray(brief.businessObjectives) ? brief.businessObjectives : [];
  if (!objs.length) {
    lines.push('- (no indicados)');
  } else {
    for (var ob = 0; ob < objs.length; ob++) {
      lines.push('- ' + String(objs[ob] || '').trim());
    }
  }
  lines.push('Restricciones / condiciones:');
  var cons = Array.isArray(brief.constraints) ? brief.constraints : [];
  if (!cons.length) {
    lines.push('- (ninguna explícita)');
  } else {
    for (var co = 0; co < cons.length; co++) {
      lines.push('- ' + String(cons[co] || '').trim());
    }
  }
  var studioLine = '';
  if (Array.isArray(context.recommendedStudios) && context.recommendedStudios.length) {
    studioLine = 'Studios Globant recomendados para esta propuesta:';
    for (var si = 0; si < context.recommendedStudios.length; si++) {
      var st = context.recommendedStudios[si];
      if (!st || typeof st !== 'object') continue;
      studioLine +=
        '\n- ' +
        String(st.studioName || '').trim();
      if (st.aiPodsPitch && typeof st.aiPodsPitch === 'object') {
        studioLine += ':\n' + ProposalBuilding_formatAiPodsPitchAsText_(st.aiPodsPitch);
      } else if (st.rationale) {
        studioLine += ': ' + String(st.rationale).trim();
      }
    }
  }
  if (studioLine) lines.push(studioLine);
  lines.push(
    'Goal: help draft the commercial proposal using the industry deck base, keeping coherence with the validated brief and indexed proposal repository.',
  );
  return PromptCatalog_render('pb.chat_context.user', {
    contextBody: lines.join('\n'),
  });
}

/**
 * @param {string} question
 * @param {string} historyJson
 * @param {string} contextJson
 * @return {Object}
 */
function ProposalBuilding_answerWithContext(question, historyJson, contextJson) {
  AdminAuth_requireProposalBuildingBuild();
  var context = {};
  try {
    if (contextJson) context = JSON.parse(contextJson);
  } catch (eCtx) {
    context = {};
  }
  var preamble = ProposalBuilding_buildSystemContext_(context);
  var enrichedQuestion =
    preamble + '\n\n--- Consulta del usuario ---\n' + String(question || '').trim();

  var history = [];
  try {
    if (historyJson) history = JSON.parse(historyJson);
  } catch (eHist) {}

  var r = AgentOrchestrator_answerWith(
    enrichedQuestion,
    _ADMIN_AGENT_ID_PROPOSALS,
    history,
  );
  return {
    answer: r.answer,
    agentName: r.agentName || 'proposals',
    meta: {
      model: r.model,
      location: r.providerLabel,
      filterNote: r.filterLabel,
      references: ChatReferences_enrichList_(r.references || []),
    },
    isUnanswered: !!r.isUnanswered,
    unansweredCode: r.unansweredCode || '',
  };
}

/**
 * @param {string} industryKey
 * @param {string=} briefJson brief validado para nombrar la copia en Drive
 * @return {{ok:boolean, industry:string, deckKey:string, deckLabel:string, deckDriveId:string, proposalDeckFileId:string, proposalDeckFileUrl:string, proposalDeckFileName:string}}
 */
function ProposalBuilding_resolveDeck(industryKey, briefJson) {
  AdminAuth_requireProposalBuildingBuild();
  var industry = String(industryKey || '').trim();
  var valid = false;
  for (var i = 0; i < PROPOSAL_BUILDING_INDUSTRY_KEYS.length; i++) {
    if (PROPOSAL_BUILDING_INDUSTRY_KEYS[i] === industry) valid = true;
  }
  if (!valid) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'pb_err_industry_required'));
  }
  var brief = {};
  try {
    if (briefJson) brief = JSON.parse(briefJson);
  } catch (eBrief) {
    brief = {};
  }
  brief = ProposalBuilding_normalizeBrief_(brief);
  AgentOrchestrator_requireGlobant_();
  var understanding = ProposalBuilding_runUnderstandingComposition_(brief, industry);
  var matchedCases = ProposalBuilding_findRelevantSuccessCases_(brief, industry);
  var successCases = matchedCases.length
    ? ProposalBuilding_runSuccessCaseRationalesComposition_(brief, industry, matchedCases)
    : [];
  var deck = ProposalBuilding_resolveDeckForIndustry_(industry);
  var copied = ProposalBuilding_copyProposalDeckToDrive_(deck.deckDriveId, brief);
  var defaultDeckOptions = ProposalBuilding_normalizeDeckOptions_(null, industry);
  var customization = ProposalBuilding_customizeDeckContent_(
    copied.id,
    brief,
    industry,
    understanding,
    successCases,
    defaultDeckOptions,
  );
  return {
    ok: true,
    industry: industry,
    deckKey: deck.deckKey,
    deckLabel: deck.deckLabel,
    deckDriveId: deck.deckDriveId,
    proposalDeckFileId: copied.id,
    proposalDeckFileUrl: copied.url,
    proposalDeckFileName: copied.name,
    proposalPackageFolderId: copied.packageFolderId || '',
    proposalPackageFolderUrl: copied.packageFolderUrl || '',
    proposalPackageFolderName: copied.packageFolderName || '',
    checklistFileId: copied.checklistFileId || '',
    checklistFileUrl: copied.checklistFileUrl || '',
    checklistFileName: copied.checklistFileName || '',
    checklistItemCount: copied.checklistItemCount || 0,
    composedUnderstanding: understanding,
    successCases: successCases,
    successCasesApplied: customization.successCasesApplied || 0,
    successCaseTitles: (customization.successCases || []).map(function (sc) {
      return String(sc.title || '').trim();
    }).filter(function (t) {
      return !!t;
    }),
    customizationWarnings: customization.warnings || [],
  };
}
