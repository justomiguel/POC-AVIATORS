/**
 * @fileoverview Armado de propuestas: extracción de brief (RFP/chat) y construcción asistida.
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

var PROPOSAL_BUILDING_MAX_ATTACHMENT_BYTES_ = 12 * 1024 * 1024;

/** Carpeta bajo DRIVE_ROOT_FOLDER_ID donde se guardan decks armados. */
var PROPOSAL_BUILDING_DRIVE_FOLDER_NAME = 'Propuestas';

/** @type {string} */
var PROPOSAL_BUILDING_CLIENT_FALLBACK_ = 'Sin cliente';

/** @type {string} */
var PROPOSAL_BUILDING_SUBJECT_FALLBACK_ = 'Propuesta';

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
  if (bytes.length > PROPOSAL_BUILDING_MAX_ATTACHMENT_BYTES_) {
    throw new Error(
      UiStrings_fmt_('err_ephemeral_doc_too_large', {
        max_mb: String(Math.floor(PROPOSAL_BUILDING_MAX_ATTACHMENT_BYTES_ / (1024 * 1024))),
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
    result = client.chatWithFileInline(
      ContentExtraction_resolveChatModel_(),
      systemPrompt,
      userText,
      attachment.dataBase64,
      attachment.mimeType,
    );
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
 * Copia la presentación base al Drive del proyecto con nombre «Cliente - QueDeLaPropuesta».
 * @param {string} baseDeckFileId
 * @param {Object} brief
 * @return {{id:string,url:string,name:string}}
 */
function ProposalBuilding_copyBaseDeckToDrive_(baseDeckFileId, brief) {
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
  var copy = templateFile.makeCopy(copyName, targetFolder);
  return {
    id: String(copy.getId() || ''),
    url: String(copy.getUrl() || ''),
    name: String(copy.getName() || copyName),
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
  var lines = [
    'MODO ARMADO DE PROPUESTA — contexto validado por el usuario.',
    'Idioma de redacción: ' + (lang === 'en' ? 'English' : 'Español') + '.',
    'Industria: ' + industry + '.',
    'Presentación de trabajo en Drive: ' + workingDeck + '.',
    'Cliente: ' + (String(brief.clientName || '').trim() || '(no indicado)'),
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
  var deck = ProposalBuilding_resolveDeckForIndustry_(industry);
  var copied = ProposalBuilding_copyBaseDeckToDrive_(deck.deckDriveId, brief);
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
