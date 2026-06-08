/**
 * @fileoverview Armado de propuestas: extracción de brief (RFP/chat) y construcción asistida.
 *
 * Decks: copia plantilla Slides → Propuestas/ en DRIVE_ROOT_FOLDER_ID.
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

/** @type {number} Máximo de casos de éxito insertados en el deck. */
var PROPOSAL_BUILDING_SUCCESS_CASE_MAX_ = 6;

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

  return {
    clientName: String(o.clientName || o.client_name || '').trim(),
    scopeItems: scopeItems,
    commercialModel: ProposalBuilding_normalizeCommercialModel_(o.commercialModel || o.pricing_model),
    milestones: milestones,
    detectedLanguage: lang,
    confidence: String(o.confidence || 'medium').trim().toLowerCase(),
    warnings: Array.isArray(o.warnings)
      ? o.warnings.map(function (w) {
          return String(w || '').trim();
        }).filter(function (w) {
          return !!w;
        })
      : [],
  };
}

/**
 * @param {GlobantAssistantApiClient} client
 * @param {string} userPrompt
 * @param {string} chatBlock
 * @param {{name:string,mimeType:string,dataBase64:string,textContent:string}} attachment
 * @return {string}
 */
function ProposalBuilding_runExtraction_(client, userPrompt, chatBlock, attachment) {
  var models = PROPOSAL_BUILDING_COMMERCIAL_MODELS.join(', ');
  var extractPrompt = [
    'Analizá el material (chat, documento o imagen) y extraé un brief comercial para armar una propuesta.',
    'Respondé SOLO con JSON válido (sin markdown):',
    '{',
    '  "clientName": "nombre del cliente si aparece, o vacío",',
    '  "scopeItems": [{"title":"ítem corto","description":"qué pide el cliente / nuestro entendimiento"}],',
    '  "commercialModel": "uno de: ' + models + ', o vacío si no está claro",',
    '  "milestones": [{"label":"hito","date":"fecha o rango","notes":"detalle opcional"}],',
    '  "detectedLanguage": "es o en según el idioma dominante del material",',
    '  "confidence": "high|medium|low",',
    '  "warnings": ["notas sobre ambigüedades"]',
    '}',
    '',
    'Reglas:',
    '- scopeItems: si hay varios pedidos o workstreams, un ítem por cada uno.',
    '- commercialModel: elegí el más cercano al RFP; no inventes si no hay señal.',
    '- milestones: fechas límite, go-live, entregas o fases con fecha cuando existan.',
    '- detectedLanguage: idioma en el que debería redactarse la propuesta.',
    '- Sé conservador: no inventes cliente, fechas ni modelo comercial sin evidencia.',
  ].join('\n');

  if (chatBlock) {
    extractPrompt += '\n\n--- Historial de chat ---\n' + chatBlock;
  }
  if (userPrompt) {
    extractPrompt += '\n\n--- Último mensaje del usuario ---\n' + userPrompt;
  }
  if (attachment.textContent) {
    extractPrompt +=
      '\n\n--- Contenido del archivo "' +
      attachment.name +
      '" ---\n' +
      attachment.textContent.slice(0, 120000);
  }

  var systemPrompt =
    'Sos un analista de preventa. Devolvé únicamente JSON válido según el esquema pedido.';

  var result;
  if (attachment.dataBase64 && attachment.mimeType) {
    var userText = extractPrompt;
    if (ProposalBuilding_isImageMime_(attachment.mimeType)) {
      userText +=
        '\n\nLa imagen adjunta puede ser una foto de pizarra, slide o documento escaneado. Transcribí el contenido relevante antes de extraer el brief.';
    }
    var fileBytes = Utilities.base64Decode(attachment.dataBase64);
    var fileBlob = Utilities.newBlob(fileBytes, attachment.mimeType, attachment.name || 'attachment');
    result = GlobantDocumentChat_chatWithBlob_(client, fileBlob, systemPrompt, userText);
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
  AdminAuth_requireProposalBuildingView();
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
  if (!userPrompt && !chatBlock && !payload.attachment) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'pb_err_extract_empty'));
  }

  var attachment = ProposalBuilding_normalizeAttachment_(payload.attachment || null);
  var client = ProposalBuilding_createLlmClient_();
  var raw = ProposalBuilding_runExtraction_(client, userPrompt, chatBlock, attachment);
  var parsed = ContentExtraction_parseLooseJson_(raw);
  var brief = ProposalBuilding_normalizeBrief_(parsed);
  if (!brief.detectedLanguage) {
    brief.detectedLanguage = UiStrings_activeLocale_() === 'en' ? 'en' : 'es';
  }
  if (!brief.scopeItems.length && !brief.clientName && !brief.milestones.length) {
    brief.warnings.push(UiStrings_t(UiStrings_activeLocale_(), 'pb_warn_extract_sparse'));
  }

  return { ok: true, brief: brief };
}

/**
 * @return {GoogleAppsScript.Drive.Folder}
 */
function ProposalBuilding_getProposalsDriveFolder_() {
  function getOrCreateChildFolder_(parent, name) {
    var it = parent.getFoldersByName(name);
    if (it.hasNext()) return it.next();
    return parent.createFolder(name);
  }
  var projectRoot = DriveApp.getFolderById(AviatorsConfig_requireDriveRootFolderId_());
  return getOrCreateChildFolder_(projectRoot, PROPOSAL_BUILDING_DRIVE_FOLDER_NAME);
}

/**
 * @param {Object} brief
 * @return {string}
 */
function ProposalBuilding_buildProposalFileName_(brief) {
  brief = brief || {};
  var clientPart = ContentIngestion_safeDriveFolderName_(
    brief.clientName,
    PROPOSAL_BUILDING_CLIENT_FALLBACK_,
  );
  var items = Array.isArray(brief.scopeItems) ? brief.scopeItems : [];
  var subjectParts = [];
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    if (!it || typeof it !== 'object') continue;
    var chunk = String(it.title || '').trim();
    if (!chunk) chunk = String(it.description || '').trim();
    if (chunk) subjectParts.push(chunk);
  }
  var subjectRaw = subjectParts.join('; ');
  if (!subjectRaw) subjectRaw = PROPOSAL_BUILDING_SUBJECT_FALLBACK_;
  var subjectPart = ContentIngestion_safeDriveFolderName_(
    subjectRaw,
    PROPOSAL_BUILDING_SUBJECT_FALLBACK_,
  );
  var fileName = clientPart + ' - ' + subjectPart;
  if (fileName.length > 200) fileName = fileName.slice(0, 200).trim();
  return fileName;
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
    var lang = String(brief.detectedLanguage || '').trim();
    if (lang.indexOf('en') === 0) lang = 'en';
    else lang = 'es';

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
      scopeBlock.push('- (sin ítems detallados en el brief)');
    }

    var prompt = [
      'Redactá el título del deck y el bloque «Nuestro entendimiento» para una propuesta comercial de preventa.',
      'Respondé SOLO con JSON válido (sin markdown ni texto extra):',
      '{"deckTitle":"título muy resumido del alcance","intro":"oración de apertura","items":[{"title":"título corto del pedido","description":"qué se solicita en tono profesional"}]}',
      '',
      'Reglas:',
      '- deckTitle: UNA frase nominal corta (máx. ~10 palabras) que sintetice todo el alcance para la portada del slide {Titulo}.',
      lang === 'en'
        ? '- deckTitle example: "Logistics management platform development"'
        : '- deckTitle ejemplo: «Desarrollo de plataforma de gestión logística»',
      '- No uses viñetas ni «·» en deckTitle; no listes ítems sueltos.',
      '- intro: debe mencionar al cliente y dejar claro que se resume lo solicitado.',
      lang === 'en'
        ? '- intro example tone: "Our client {name} is requesting the following:"'
        : '- intro ejemplo de tono: "Nuestro cliente {nombre} está solicitando lo siguiente:"',
      '- items: un ítem por cada pedido del brief; no inventes alcance fuera del brief.',
      '- items.title: frase corta tipo entregable (ej. «Desarrollo plataforma de gestión»).',
      '- items.description: 1-3 oraciones claras para slide comercial.',
      '- Idioma de salida: ' + (lang === 'en' ? 'English' : 'Español'),
      '',
      'Industria: ' + String(industryKey || '').trim(),
      'Cliente: ' + String(brief.clientName || '').trim(),
      'Modelo comercial: ' + String(brief.commercialModel || '').trim(),
      'Alcance validado:',
    ]
      .concat(scopeBlock)
      .join('\n');

    var systemPrompt =
      'Sos redactor de propuestas comerciales B2B. Devolvé únicamente JSON válido según el esquema pedido.';

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
function ProposalBuilding_composeUnderstanding(briefJson, industryKey) {
  AdminAuth_requireProposalBuildingView();
  AgentOrchestrator_requireGlobant_();
  var brief = {};
  try {
    brief = JSON.parse(String(briefJson || '{}'));
  } catch (eBrief) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_ephemeral_doc_payload'));
  }
  brief = ProposalBuilding_normalizeBrief_(brief);
  var understanding = ProposalBuilding_runUnderstandingComposition_(brief, industryKey);
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

  var rows = ContentCatalogStore_listAll();
  var ri;
  for (ri = 0; ri < rows.length; ri++) {
    var row = rows[ri];
    if (String(row.content_type || '').trim() !== 'success_case') continue;
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
    limit: PROPOSAL_BUILDING_SUCCESS_CASE_MAX_ + 2,
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
  if (ranked.length > PROPOSAL_BUILDING_SUCCESS_CASE_MAX_) {
    ranked = ranked.slice(0, PROPOSAL_BUILDING_SUCCESS_CASE_MAX_);
  }

  if (!ranked.length) {
    var fallback = [];
    for (ri = 0; ri < rows.length && fallback.length < 3; ri++) {
      var fbRow = rows[ri];
      if (String(fbRow.content_type || '').trim() !== 'success_case') continue;
      var fbIndustry = String(fbRow.industry || '').trim();
      if (fbIndustry && !allow[fbIndustry]) continue;
      var fbCard = ProposalBuilding_loadSuccessCaseForDeck_(String(fbRow.content_id || '').trim());
      if (fbCard) fallback.push(fbCard);
    }
    ranked = fallback;
  }

  return ranked;
}

/**
 * @param {Array<Object>} cases
 * @param {Object} parsed
 * @return {Array<Object>}
 */
function ProposalBuilding_mergeSuccessCaseRationales_(cases, parsed) {
  cases = Array.isArray(cases) ? cases : [];
  parsed = parsed && typeof parsed === 'object' ? parsed : {};
  var fallback = UiStrings_t(UiStrings_activeLocale_(), 'pb_success_case_rationale_fallback');
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
    var rationale = (contentId && byId[contentId]) || idxText || fallback;
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
function ProposalBuilding_runSuccessCaseRationalesComposition_(brief, industryKey, cases) {
  cases = Array.isArray(cases) ? cases : [];
  if (!cases.length) return [];
  try {
    var client = ProposalBuilding_createLlmClient_();
    var lang = String((brief || {}).detectedLanguage || '').trim();
    if (lang.indexOf('en') === 0) lang = 'en';
    else lang = 'es';

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
      scopeBlock.push('- (sin ítems detallados en el brief)');
    }

    var caseBlocks = [];
    for (i = 0; i < cases.length; i++) {
      var c = cases[i] || {};
      caseBlocks.push(
        String(i + 1) +
          '. contentId=' +
          String(c.contentId || '').trim() +
          ' | título=' +
          String(c.title || '').trim() +
          ' | cliente=' +
          String(c.client_name || '').trim() +
          ' | industria=' +
          String(c.industry || '').trim() +
          ' | resumen=' +
          String(c.summary || '').trim().slice(0, 420) +
          (c.challenge ? ' | desafío=' + String(c.challenge).trim().slice(0, 280) : '') +
          (c.solution ? ' | solución=' + String(c.solution).trim().slice(0, 280) : ''),
      );
    }

    var prompt = [
      'Para cada caso de éxito listado, redactá por qué conviene incluirlo en esta propuesta comercial.',
      'Respondé SOLO con JSON válido (sin markdown ni texto extra):',
      '{"rationales":[{"contentId":"id del caso","rationale":"2-4 oraciones explicando el vínculo con el brief"}]}',
      '',
      'Reglas:',
      '- rationale: explica el encaje concreto (industria, desafío similar, outcome útil para el cliente).',
      '- No inventes datos del caso que no estén en el listado.',
      '- Un rationale por cada caso, en el mismo orden.',
      '- Idioma de salida: ' + (lang === 'en' ? 'English' : 'Español'),
      '',
      'Industria de la propuesta: ' + String(industryKey || '').trim(),
      'Cliente: ' + String(brief.clientName || '').trim(),
      'Modelo comercial: ' + String(brief.commercialModel || '').trim(),
      'Alcance validado:',
    ]
      .concat(scopeBlock)
      .concat(['', 'Casos de éxito candidatos:'])
      .concat(caseBlocks)
      .join('\n');

    var systemPrompt =
      'Sos consultor de preventa B2B. Devolvé únicamente JSON válido según el esquema pedido.';

    var result = client.chatSimple(systemPrompt, prompt, ContentExtraction_resolveChatModel_());
    var raw = String(result.text || '').trim();
    var parsed = ContentExtraction_parseLooseJson_(raw);
    return ProposalBuilding_mergeSuccessCaseRationales_(cases, parsed);
  } catch (eRationales) {
    return ProposalBuilding_mergeSuccessCaseRationales_(cases, {});
  }
}

/**
 * @param {string} briefJson
 * @param {string=} industryKey
 * @return {{ok:boolean, successCases:Array<Object>, count:number}}
 */
function ProposalBuilding_composeSuccessCaseRationales(briefJson, industryKey) {
  AdminAuth_requireProposalBuildingView();
  AgentOrchestrator_requireGlobant_();
  var brief = {};
  try {
    brief = JSON.parse(String(briefJson || '{}'));
  } catch (eBrief) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_ephemeral_doc_payload'));
  }
  brief = ProposalBuilding_normalizeBrief_(brief);
  var cases = ProposalBuilding_findRelevantSuccessCases_(brief, industryKey);
  if (!cases.length) {
    return { ok: true, successCases: [], count: 0 };
  }
  var withRationales = ProposalBuilding_runSuccessCaseRationalesComposition_(
    brief,
    industryKey,
    cases,
  );
  return { ok: true, successCases: withRationales, count: withRationales.length };
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
    cases = ProposalBuilding_mergeSuccessCaseRationales_(cases, {});
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
  var targetFolder = ProposalBuilding_getProposalsDriveFolder_();
  var desiredName = ProposalBuilding_buildProposalFileName_(brief);
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
  return {
    id: String(copy.getId() || ''),
    url: String(copy.getUrl() || ''),
    name: String(copy.getName() || copyName),
  };
}

/**
 * @param {string} industryKey
 * @param {string} briefJson
 * @return {Object}
 */
function ProposalBuilding_copyProposalDeck(industryKey, briefJson) {
  AdminAuth_requireProposalBuildingView();
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
  return {
    ok: true,
    industry: industry,
    deckKey: deck.deckKey,
    deckLabel: deck.deckLabel,
    deckDriveId: deck.deckDriveId,
    proposalDeckFileId: copied.id,
    proposalDeckFileUrl: copied.url,
    proposalDeckFileName: copied.name,
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
) {
  AdminAuth_requireProposalBuildingView();
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
  return {
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
  var lang = String(context.language || brief.detectedLanguage || 'es').trim();
  var workingDeck = context.proposalDeckFileName
    ? context.proposalDeckFileName +
      (context.proposalDeckFileUrl ? ' · ' + context.proposalDeckFileUrl : '')
    : deck.deckLabel + (deck.deckDriveId ? ' (plantilla: ' + deck.deckDriveId + ')' : '');
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
  ];
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
  lines.push(
    'Objetivo: ayudar a redactar la propuesta comercial usando el deck base de la industria, manteniendo coherencia con el brief validado y el repositorio indexado de propuestas.',
  );
  return lines.join('\n');
}

/**
 * @param {string} question
 * @param {string} historyJson
 * @param {string} contextJson
 * @return {Object}
 */
function ProposalBuilding_answerWithContext(question, historyJson, contextJson) {
  AdminAuth_requireProposalBuildingView();
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
  AdminAuth_requireProposalBuildingView();
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
