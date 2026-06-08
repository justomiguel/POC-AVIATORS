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

  var techHints = [];
  if (Array.isArray(o.technologyHints)) {
    for (var ti = 0; ti < o.technologyHints.length; ti++) {
      var th = String(o.technologyHints[ti] || '').trim();
      if (th) techHints.push(th);
    }
  }

  return {
    clientName: String(o.clientName || o.client_name || '').trim(),
    projectSummary: String(o.projectSummary || o.summary || o.overview || '').trim(),
    scopeItems: scopeItems,
    commercialModel: ProposalBuilding_normalizeCommercialModel_(o.commercialModel || o.pricing_model),
    milestones: milestones,
    technologyHints: techHints,
    stakeholders: ProposalBuilding_normalizeStakeholders_(o.stakeholders),
    budget: ProposalBuilding_normalizeBudget_(o.budget || o.budgetNotes),
    businessObjectives: ProposalBuilding_normalizeStringList_(o.businessObjectives || o.objectives),
    constraints: ProposalBuilding_normalizeStringList_(o.constraints || o.risks),
    rfpDeadline: String(o.rfpDeadline || o.proposalDeadline || o.submissionDeadline || '').trim(),
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
      base.scopeItems.push(scopeRow);
      scopeSeen[sk] = true;
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
  var target = String(name || '').trim().toLowerCase();
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
    var enriched = {
      studioName: String(st.studioName || '').trim(),
      offerings: Array.isArray(st.offerings) ? st.offerings.slice() : [],
      rationale: String(st.rationale || '').trim(),
      priority: String(st.priority || 'medium').trim().toLowerCase(),
      contentId: String(st.contentId || '').trim(),
      catalogTitle: '',
      driveFileUrl: '',
      kgNodeId: ProposalBuilding_studioKgNodeId_(st.studioName),
      contentIds: [],
    };
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
  var names = Array.isArray(sourceFileNames) ? sourceFileNames : [];
  var fileHint = names.join(' ');
  var extracted = String(brief.clientName || '').trim();
  var match = ClientsMaster_matchFromHints_(extracted, fileHint);
  brief.clientMatch = {
    extractedName: extracted,
    matched: !!match.matched,
    catalogClientName: match.matched ? String(match.client_name || '').trim() : '',
    industry: String(match.industry || '').trim(),
    subIndustry: String(match.sub_industry || '').trim(),
    matchScore: Number(match.matchScore) || (match.matched ? 1 : 0),
    suggestions: match.matched
      ? []
      : ProposalBuilding_listClientSuggestions_(extracted, fileHint, 3),
  };
  if (match.matched && match.client_name) {
    brief.suggestedClientName = String(match.client_name || '').trim();
    if (!brief.clientName) brief.clientName = brief.suggestedClientName;
  } else {
    brief.suggestedClientName = extracted || String(match.client_name || '').trim();
  }
  return brief;
}

/**
 * @return {Array<Object>}
 */
function ProposalBuilding_listStudiosFromCatalog_() {
  var rows = ContentCatalogStore_listAll();
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
    out.push({
      studioName: name,
      offerings: offerings,
      rationale: String(row.rationale || row.reason || row.why || '').trim(),
      priority: String(row.priority || 'medium').trim().toLowerCase(),
      contentId: String(row.contentId || row.content_id || '').trim(),
    });
  }
  return out;
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
    '  "projectSummary": "resumen ejecutivo del pedido en 2-4 oraciones",',
    '  "scopeItems": [{"title":"ítem corto","description":"qué pide el cliente / nuestro entendimiento"}],',
    '  "commercialModel": "uno de: ' + models + ', o vacío si no está claro",',
    '  "milestones": [{"label":"hito","date":"fecha o rango","notes":"detalle opcional"}],',
    '  "technologyHints": ["tecnologías, plataformas o dominios mencionados"],',
    '  "stakeholders": [{"name":"nombre","role":"cargo","organization":"empresa/área","email":"opcional"}],',
    '  "budget": {"amount":"monto numérico o rango","currency":"USD|EUR|ARS|…","notes":"detalle de presupuesto"},',
    '  "businessObjectives": ["objetivos de negocio del cliente"],',
    '  "constraints": ["restricciones, riesgos o condiciones del RFP"],',
    '  "rfpDeadline": "fecha límite de entrega de propuesta si aparece",',
    '  "detectedLanguage": "es o en según el idioma dominante del material",',
    '  "confidence": "high|medium|low",',
    '  "warnings": ["notas sobre ambigüedades"]',
    '}',
    '',
    'Reglas:',
    '- scopeItems: si hay varios pedidos o workstreams, un ítem por cada uno.',
    '- commercialModel: elegí el más cercano al RFP; no inventes si no hay señal.',
    '- milestones: fechas límite, go-live, entregas o fases con fecha cuando existan.',
    '- stakeholders: contactos o sponsors mencionados; no inventes emails.',
    '- budget: solo si hay cifra o rango explícito; currency vacío si no está claro.',
    '- businessObjectives y constraints: ítems cortos con evidencia en el material.',
    '- rfpDeadline: fecha de cierre del RFP / entrega de propuesta, no hitos de proyecto.',
    '- detectedLanguage: idioma en el que debería redactarse la propuesta.',
    '- Sé conservador: no inventes cliente, presupuesto, fechas ni modelo comercial sin evidencia.',
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
  if (Array.isArray(payload.sourceFileNames)) {
    for (var sf = 0; sf < payload.sourceFileNames.length; sf++) {
      var fn = String(payload.sourceFileNames[sf] || '').trim();
      if (fn) sourceFiles.push(fn);
    }
  } else if (attachment.name) {
    sourceFiles.push(attachment.name);
  }
  brief = ProposalBuilding_enrichBriefWithClientMatch_(brief, sourceFiles);

  return { ok: true, brief: brief };
}

/**
 * @param {string} briefsJson
 * @return {{ok:boolean, brief:Object}}
 */
function ProposalBuilding_mergeExtractedBriefs(briefsJson) {
  AdminAuth_requireProposalBuildingView();
  var list = [];
  try {
    list = JSON.parse(String(briefsJson || '[]'));
  } catch (eList) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_ephemeral_doc_payload'));
  }
  if (!Array.isArray(list) || !list.length) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'pb_err_extract_empty'));
  }
  var merged = {};
  var fileNames = [];
  var fileSeen = {};
  var li;
  for (li = 0; li < list.length; li++) {
    var row = list[li];
    if (row && Array.isArray(row.__sourceFiles)) {
      var fi;
      for (fi = 0; fi < row.__sourceFiles.length; fi++) {
        var fn = String(row.__sourceFiles[fi] || '').trim();
        if (fn && !fileSeen[fn]) {
          fileNames.push(fn);
          fileSeen[fn] = true;
        }
      }
      delete row.__sourceFiles;
    }
    merged = ProposalBuilding_mergeBriefs_(merged, row);
  }
  merged = ProposalBuilding_enrichBriefWithClientMatch_(merged, fileNames);
  return { ok: true, brief: merged };
}

/**
 * @param {string} briefJson
 * @param {string=} industryKey
 * @return {{ok:boolean, studios:Array<Object>, catalogStudios:Array<Object>}}
 */
function ProposalBuilding_recommendStudios(briefJson, industryKey) {
  AdminAuth_requireProposalBuildingView();
  AgentOrchestrator_requireGlobant_();
  var brief = {};
  try {
    brief = JSON.parse(String(briefJson || '{}'));
  } catch (eBrief) {
    brief = {};
  }
  brief = ProposalBuilding_normalizeBrief_(brief);
  var industry = String(industryKey || '').trim();
  var catalogStudios = ProposalBuilding_listStudiosFromCatalog_();
  var studioLines = [];
  var ci;
  for (ci = 0; ci < catalogStudios.length; ci++) {
    var st = catalogStudios[ci];
    var line = '- ' + st.studioName;
    if (st.contentIds && st.contentIds.length) {
      line += ' · contentId=' + st.contentIds[0];
    }
    if (st.kgNodeId) {
      line += ' · kgNodeId=' + st.kgNodeId;
    }
    if (st.offerings && st.offerings.length) {
      line += ' · offerings: ' + st.offerings.join(', ');
    }
    if (st.summaries && st.summaries.length) {
      line += ' · ' + st.summaries[0];
    }
    studioLines.push(line);
  }
  var prompt = [
    'Recomendá hasta 5 Globant Studios que deberían acoplarse a esta propuesta comercial.',
    'Usá el catálogo indexado cuando sea posible; no inventes studios que no estén listados salvo que el brief lo exija explícitamente.',
    'Cuando elijas un studio del catálogo, incluí su contentId (y kgNodeId si está en la lista).',
    'Respondé SOLO con JSON válido (sin markdown):',
    '{"studios":[{"studioName":"nombre","offerings":["AI_PODS"],"rationale":"por qué encaja con el brief","priority":"high|medium|low","contentId":"id catálogo si aplica"}]}',
    '',
    'Industria propuesta: ' + (industry || '(no indicada)'),
    'Brief validado:',
    JSON.stringify(brief),
    '',
    'Studios en catálogo Aviators:',
    studioLines.length ? studioLines.join('\n') : '(sin studios indexados; sugerí según expertise Globant documentada)',
  ].join('\n');

  var r = AgentOrchestrator_answerWith(prompt, _ADMIN_AGENT_ID_PROPOSALS, []);
  var studios = ProposalBuilding_parseStudioRecommendations_(r.answer || '');
  if (!studios.length && catalogStudios.length) {
    var fb;
    for (fb = 0; fb < Math.min(3, catalogStudios.length); fb++) {
      studios.push({
        studioName: catalogStudios[fb].studioName,
        offerings: catalogStudios[fb].offerings || [],
        rationale: UiStrings_t(UiStrings_activeLocale_(), 'pb_studio_fallback_rationale'),
        priority: 'medium',
        contentId: catalogStudios[fb].contentIds && catalogStudios[fb].contentIds[0]
          ? catalogStudios[fb].contentIds[0]
          : '',
      });
    }
  }
  studios = ProposalBuilding_enrichStudioRecommendations_(studios, catalogStudios);
  return { ok: true, studios: studios, catalogStudios: catalogStudios };
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
  if (brief.rfpDeadline) {
    lines.push('Fecha límite RFP / entrega propuesta: ' + brief.rfpDeadline);
  }
  var budget = brief.budget || ProposalBuilding_normalizeBudget_(null);
  var budgetLine = '';
  if (budget.amount) budgetLine += budget.amount;
  if (budget.currency) budgetLine += (budgetLine ? ' ' : '') + budget.currency;
  if (budget.notes) budgetLine += (budgetLine ? ' — ' : '') + budget.notes;
  lines.push('Presupuesto / budget: ' + (budgetLine || '(no indicado)'));
  lines.push('Stakeholders:');
  var stks = Array.isArray(brief.stakeholders) ? brief.stakeholders : [];
  if (!stks.length) {
    lines.push('- (sin contactos explícitos)');
  } else {
    for (var sk = 0; sk < stks.length; sk++) {
      var stk = stks[sk];
      lines.push(
        '- ' +
          String(stk.name || '(sin nombre)').trim() +
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
        String(st.studioName || '').trim() +
        (st.rationale ? ': ' + String(st.rationale).trim() : '');
    }
  }
  if (studioLine) lines.push(studioLine);
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
