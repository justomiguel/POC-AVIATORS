/**
 * @fileoverview Guardado transaccional de contenidos (Globant + Catalogo).
 */

/**
 * @param {string} contentType
 * @return {{id:string,profileName:string,systemPrompt:string}}
 */
function ContentIngestion_findAgentByType_(contentType) {
  var wantedId =
    contentType === 'proposal'
      ? _ADMIN_AGENT_ID_PROPOSALS
      : contentType === 'success_case'
        ? _ADMIN_AGENT_ID_SUCCESS_CASES
        : contentType === 'client'
          ? _ADMIN_AGENT_ID_CLIENTS
          : contentType === 'onboarding'
            ? _ADMIN_AGENT_ID_ONBOARDING
            : '';
  if (!wantedId) throw new Error('content_type invalido');
  var props = PropertiesService.getScriptProperties();
  var reg = AdminAgents_loadRegistry_(props);
  var agents = reg && reg.agents ? reg.agents : [];
  var i;
  for (i = 0; i < agents.length; i++) {
    var ag = agents[i];
    if (String(ag.id || '').trim() === wantedId) return ag;
  }
  throw new Error('No existe agente configurado para ' + contentType);
}

/**
 * @return {Object}
 */
function ContentIngestion_createRagClient_() {
  var props = PropertiesService.getScriptProperties();
  if (LlmOrchestrator_resolveProviderKind() !== 'globant') {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_globant_only_feature'));
  }
  if (LlmProviderGlobant_isAssistantMode(props)) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_globant_rag_action_only'));
  }
  var apiKey = (props.getProperty(LLM_PROP.GLOBANT_API_KEY) || '').trim();
  if (!apiKey) throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_falta_globant_key'));
  var baseUrl = (props.getProperty(LLM_PROP.GLOBANT_BASE_URL) || '').trim();
  return GlobantRagApiClient_create({
    apiKey: apiKey,
    baseUrl: baseUrl || undefined,
  });
}

/** @type {number} Reintentos para waitIndexed en save (24×2.5s ≈ 60s). */
var CONTENT_INGESTION_INDEX_RETRIES = 24;
/** @type {number} Delay entre polls de indexación. */
var CONTENT_INGESTION_INDEX_DELAY_MS = 2500;

/**
 * @param {Object} client
 * @param {string} profileName
 * @param {GoogleAppsScript.Base.Blob} pdfBlob
 * @param {Object} [metadata] - Metadata para indexacion (client_name, content_type, etc.)
 * @return {string}
 */
function ContentIngestion_indexBlob_(client, profileName, pdfBlob, metadata) {
  var up = client.uploadPdfDocument(profileName, pdfBlob, metadata || null);
  var indexed = false;
  try {
    indexed = GlobantRagApiClient_waitIndexed(
      client,
      profileName,
      up.id,
      CONTENT_INGESTION_INDEX_RETRIES,
      CONTENT_INGESTION_INDEX_DELAY_MS,
    );
  } catch (eWait) {
    try {
      client.deleteDocument(profileName, up.id);
    } catch (ignoreDelete) {}
    throw eWait;
  }
  if (!indexed) {
    try {
      client.deleteDocument(profileName, up.id);
    } catch (ignoreDelete) {}
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_globant_indexing_failed'));
  }
  return up.id;
}

/**
 * Construye metadata para indexacion en Globant RAG.
 * @param {Object} common - Datos comunes del contenido
 * @param {string} contentType
 * @return {Object}
 */
function ContentIngestion_buildMetadata_(common, contentType, specific) {
  var meta = {
    client_name: String(common.client_name || '').trim(),
    content_type: String(contentType || '').trim(),
    industry: String(common.industry || '').trim(),
    title: String(common.title || '').trim(),
    file_name: String(common.file_name || '').trim(),
  };
  if (String(contentType || '').trim() === 'onboarding') {
    meta.topic = ContentIngestion_resolveOnboardingTopic_(specific, null);
  }
  if (String(contentType || '').trim() === 'proposal') {
    var proposalSp = specific && typeof specific === 'object' ? specific : {};
    meta.material_kind = ContentIngestion_resolveProposalMaterialKind_(proposalSp, null);
    meta.topic = String(proposalSp.topic || '').trim();
    meta.globant_studio = String(proposalSp.globant_studio || '').trim();
    meta.offering = String(proposalSp.offering || '').trim();
    if (!meta.offering && proposalSp.pricing_model) {
      meta.offering = String(proposalSp.pricing_model || '').trim();
    }
    meta.stage = String(proposalSp.stage || '').trim();
    meta.pricing_model = String(proposalSp.pricing_model || '').trim();
  }
  console.log('[RAG-META] Building metadata: ' + JSON.stringify(meta));
  return meta;
}

/** @type {string} Carpeta raíz de todo el material de onboarding en DRIVE_ROOT_FOLDER_ID. */
var CONTENT_INGESTION_ONBOARDING_DRIVE_ROOT_NAME = 'Onboarding';

/** @type {string} Carpeta Drive cuando el onboarding no define tópico. */
var CONTENT_INGESTION_ONBOARDING_TOPIC_FALLBACK = 'General';

/** @type {string} Raíz de propuestas en DRIVE_ROOT_FOLDER_ID (decks armados + catálogo). */
var CONTENT_INGESTION_PROPOSALS_DRIVE_ROOT_NAME = 'Propuestas';

/** @type {string} Subcarpeta del material indexado (catálogo Contenidos). */
var CONTENT_INGESTION_PROPOSALS_CATALOG_SEGMENT = 'Catalogo';

/** @type {string} Fallback de segmento secundario en Drive para propuestas. */
var CONTENT_INGESTION_PROPOSALS_SEGMENT_FALLBACK = 'General';

/**
 * @param {Object|null|undefined} specific
 * @param {Object|null|undefined} existingSpecific
 * @return {string}
 */
function ContentIngestion_resolveOnboardingTopic_(specific, existingSpecific) {
  var topic = String((specific && specific.topic) || '').trim();
  if (!topic && existingSpecific) {
    topic = String(existingSpecific.topic || '').trim();
  }
  if (!topic) topic = CONTENT_INGESTION_ONBOARDING_TOPIC_FALLBACK;
  return topic;
}

/**
 * @return {GoogleAppsScript.Drive.Folder}
 */
function ContentIngestion_getOnboardingDriveRootFolder_() {
  function getOrCreateChildFolder_(parent, name) {
    var it = parent.getFoldersByName(name);
    if (it.hasNext()) return it.next();
    return parent.createFolder(name);
  }

  var projectRoot = DriveApp.getFolderById(AviatorsConfig_requireDriveRootFolderId_());
  return getOrCreateChildFolder_(projectRoot, CONTENT_INGESTION_ONBOARDING_DRIVE_ROOT_NAME);
}

/**
 * @param {string} raw
 * @param {string} fallback
 * @return {string}
 */
function ContentIngestion_safeDriveFolderName_(raw, fallback) {
  var v = String(raw || '').trim();
  if (!v) v = String(fallback || '').trim();
  if (!v) v = 'General';
  v = v
    .replace(/[\\\/:*?"<>|#%{}~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!v) v = 'General';
  if (v.length > 110) v = v.slice(0, 110).trim();
  return v;
}

/**
 * @param {string} topic
 * @param {string} contentTitle
 * @return {GoogleAppsScript.Drive.Folder}
 */
function ContentIngestion_getOnboardingDriveTargetFolder_(topic, contentTitle) {
  function getOrCreateChildFolder_(parent, name) {
    var it = parent.getFoldersByName(name);
    if (it.hasNext()) return it.next();
    return parent.createFolder(name);
  }

  var onboardingRoot = ContentIngestion_getOnboardingDriveRootFolder_();
  var topicFolder = getOrCreateChildFolder_(
    onboardingRoot,
    ContentIngestion_safeDriveFolderName_(topic, CONTENT_INGESTION_ONBOARDING_TOPIC_FALLBACK),
  );
  return getOrCreateChildFolder_(
    topicFolder,
    ContentIngestion_safeDriveFolderName_(contentTitle, 'Sin título'),
  );
}

/**
 * @param {string} driveFileId
 * @return {boolean}
 */
function ContentIngestion_onboardingFileUnderDriveRoot_(driveFileId) {
  var file = ContentIngestion_getLiveDriveFile_(driveFileId);
  if (!file) return false;
  var rootId = String(ContentIngestion_getOnboardingDriveRootFolder_().getId() || '');
  if (!rootId) return false;
  var parents = file.getParents();
  while (parents.hasNext()) {
    if (String(parents.next().getId() || '') === rootId) return true;
  }
  return false;
}

/**
 * Casos de éxito y onboarding persisten PDF en DRIVE_ROOT_FOLDER_ID.
 * Otros tipos usan archivo en Drive del desplegador (Aviators/Catalog/…) + RAG.
 * @param {string} contentType
 * @return {boolean}
 */
function ContentIngestion_usesProjectDriveStorage_(contentType) {
  var t = String(contentType || '').trim();
  return t === 'success_case' || t === 'onboarding' || t === 'proposal';
}

/**
 * @param {Object|null|undefined} specific
 * @param {Object|null|undefined} existingSpecific
 * @return {string}
 */
function ContentIngestion_resolveProposalMaterialKind_(specific, existingSpecific) {
  var kind = String((specific && specific.material_kind) || '').trim();
  if (!kind && existingSpecific) {
    kind = String(existingSpecific.material_kind || '').trim();
  }
  if (!kind) kind = 'COMMERCIAL_PROPOSAL';
  kind = ContentExtraction_normalizeEnum_(kind, CONTENT_PROPOSAL_MATERIAL_KINDS, 'COMMERCIAL_PROPOSAL');
  return kind;
}

/**
 * @param {string} materialKind
 * @return {string}
 */
function ContentIngestion_proposalMaterialKindFolderLabel_(materialKind) {
  var kind = ContentIngestion_resolveProposalMaterialKind_({ material_kind: materialKind }, null);
  return (
    CONTENT_PROPOSAL_MATERIAL_KIND_FOLDER_LABELS[kind] ||
    CONTENT_PROPOSAL_MATERIAL_KIND_FOLDER_LABELS.OTHER
  );
}

/**
 * @param {string} materialKind
 * @param {Object} specific
 * @param {Object} common
 * @param {Object|null|undefined} existingSpecific
 * @param {Object|null|undefined} existingCommon
 * @return {string}
 */
function ContentIngestion_resolveProposalDriveSecondarySegment_(
  materialKind,
  specific,
  common,
  existingSpecific,
  existingCommon,
) {
  var sp = specific && typeof specific === 'object' ? specific : {};
  var kind = ContentIngestion_resolveProposalMaterialKind_(
    { material_kind: materialKind || sp.material_kind },
    existingSpecific,
  );
  if (kind === 'COMMERCIAL_PROPOSAL') {
    var clientName = String((common && common.client_name) || '').trim();
    if (!clientName && existingCommon) {
      clientName = String(existingCommon.client_name || '').trim();
    }
    return ContentIngestion_safeDriveFolderName_(clientName, CONTENT_INGESTION_PROPOSALS_SEGMENT_FALLBACK);
  }
  if (kind === 'GLOBANT_STUDIO') {
    var studio = String(sp.globant_studio || '').trim();
    if (!studio && existingSpecific) studio = String(existingSpecific.globant_studio || '').trim();
    return ContentIngestion_safeDriveFolderName_(studio, CONTENT_INGESTION_PROPOSALS_SEGMENT_FALLBACK);
  }
  if (kind === 'GLOBANT_OFFERING') {
    var offering = String(sp.offering || sp.pricing_model || '').trim();
    if (!offering && existingSpecific) {
      offering = String(existingSpecific.offering || existingSpecific.pricing_model || '').trim();
    }
    offering = ContentExtraction_normalizeEnum_(offering, CONTENT_PRICING_MODELS, '');
    if (!offering) offering = CONTENT_INGESTION_PROPOSALS_SEGMENT_FALLBACK;
    return ContentIngestion_safeDriveFolderName_(offering, CONTENT_INGESTION_PROPOSALS_SEGMENT_FALLBACK);
  }
  var topic = String(sp.topic || '').trim();
  if (!topic && existingSpecific) topic = String(existingSpecific.topic || '').trim();
  return ContentIngestion_safeDriveFolderName_(topic, CONTENT_INGESTION_PROPOSALS_SEGMENT_FALLBACK);
}

/**
 * @return {GoogleAppsScript.Drive.Folder}
 */
function ContentIngestion_getProposalsCatalogDriveRootFolder_() {
  function getOrCreateChildFolder_(parent, name) {
    var it = parent.getFoldersByName(name);
    if (it.hasNext()) return it.next();
    return parent.createFolder(name);
  }

  var projectRoot = DriveApp.getFolderById(AviatorsConfig_requireDriveRootFolderId_());
  var proposalsRoot = getOrCreateChildFolder_(projectRoot, CONTENT_INGESTION_PROPOSALS_DRIVE_ROOT_NAME);
  return getOrCreateChildFolder_(proposalsRoot, CONTENT_INGESTION_PROPOSALS_CATALOG_SEGMENT);
}

/**
 * @param {Object} specific
 * @param {Object} common
 * @param {Object|null|undefined} existingSpecific
 * @param {Object|null|undefined} existingCommon
 * @return {GoogleAppsScript.Drive.Folder}
 */
function ContentIngestion_getProposalsDriveTargetFolder_(
  specific,
  common,
  existingSpecific,
  existingCommon,
) {
  function getOrCreateChildFolder_(parent, name) {
    var it = parent.getFoldersByName(name);
    if (it.hasNext()) return it.next();
    return parent.createFolder(name);
  }

  var materialKind = ContentIngestion_resolveProposalMaterialKind_(specific, existingSpecific);
  var catalogRoot = ContentIngestion_getProposalsCatalogDriveRootFolder_();
  var kindFolder = getOrCreateChildFolder_(
    catalogRoot,
    ContentIngestion_safeDriveFolderName_(
      ContentIngestion_proposalMaterialKindFolderLabel_(materialKind),
      CONTENT_PROPOSAL_MATERIAL_KIND_FOLDER_LABELS.OTHER,
    ),
  );
  var secondaryFolder = getOrCreateChildFolder_(
    kindFolder,
    ContentIngestion_resolveProposalDriveSecondarySegment_(
      materialKind,
      specific,
      common,
      existingSpecific,
      existingCommon,
    ),
  );
  var title =
    String((common && common.title) || '').trim() ||
    (existingCommon ? String(existingCommon.title || '').trim() : '') ||
    '';
  return getOrCreateChildFolder_(
    secondaryFolder,
    ContentIngestion_safeDriveFolderName_(title, 'Sin título'),
  );
}

/**
 * @param {string} driveFileId
 * @return {boolean}
 */
function ContentIngestion_proposalFileUnderDriveRoot_(driveFileId) {
  var file = ContentIngestion_getLiveDriveFile_(driveFileId);
  if (!file) return false;
  var rootId = String(ContentIngestion_getProposalsCatalogDriveRootFolder_().getId() || '');
  if (!rootId) return false;
  var parents = file.getParents();
  while (parents.hasNext()) {
    if (String(parents.next().getId() || '') === rootId) return true;
  }
  return false;
}

/**
 * @param {GoogleAppsScript.Base.Blob} pdfBlob
 * @param {string} fileName
 * @param {Object} specific
 * @param {Object} common
 * @return {{id:string,url:string,name:string}}
 */
function ContentIngestion_storeProposalPdfInDrive_(pdfBlob, fileName, specific, common) {
  var name = String(fileName || 'content.pdf').trim() || 'content.pdf';
  var targetFolder = ContentIngestion_getProposalsDriveTargetFolder_(specific, common, null, null);
  var file = targetFolder.createFile(pdfBlob.setName(name));
  return {
    id: String(file.getId() || ''),
    url: String(file.getUrl() || ''),
    name: String(file.getName() || name),
  };
}

/**
 * @param {string} driveFileId
 * @param {Object} specific
 * @param {Object} common
 * @param {Object|null|undefined} existingSpecific
 * @param {Object|null|undefined} existingCommon
 * @return {{id:string,url:string,name:string}|null}
 */
function ContentIngestion_relocateProposalDriveFile_(
  driveFileId,
  specific,
  common,
  existingSpecific,
  existingCommon,
) {
  var file = ContentIngestion_getLiveDriveFile_(driveFileId);
  if (!file) return null;
  var targetFolder = ContentIngestion_getProposalsDriveTargetFolder_(
    specific,
    common,
    existingSpecific,
    existingCommon,
  );
  var parents = file.getParents();
  if (parents.hasNext()) {
    var parent = parents.next();
    if (String(parent.getId() || '') === String(targetFolder.getId() || '')) {
      return {
        id: String(file.getId() || ''),
        url: String(file.getUrl() || ''),
        name: String(file.getName() || ''),
      };
    }
  }
  file.moveTo(targetFolder);
  return {
    id: String(file.getId() || ''),
    url: String(file.getUrl() || ''),
    name: String(file.getName() || ''),
  };
}

/**
 * @param {Object} specific
 * @param {Object} common
 * @param {Object|null|undefined} existingSpecific
 * @param {Object|null|undefined} existingCommon
 * @return {string}
 */
function ContentIngestion_proposalDriveLayoutKey_(
  specific,
  common,
  existingSpecific,
  existingCommon,
) {
  var materialKind = ContentIngestion_resolveProposalMaterialKind_(specific, existingSpecific);
  var secondary = ContentIngestion_resolveProposalDriveSecondarySegment_(
    materialKind,
    specific,
    common,
    existingSpecific,
    existingCommon,
  );
  var title =
    String((common && common.title) || '').trim() ||
    (existingCommon ? String(existingCommon.title || '').trim() : '') ||
    '';
  return [materialKind, secondary, title].join('\u0001');
}

/**
 * @param {GoogleAppsScript.Base.Blob} pdfBlob
 * @param {string} fileName
 * @param {string} clientName
 * @param {string} contentTitle
 * @return {{id:string,url:string,name:string}}
 */
function ContentIngestion_storeSuccessCasePdfInDrive_(
  pdfBlob,
  fileName,
  clientName,
  contentTitle,
) {
  function safeFolderName_(raw, fallback) {
    var v = String(raw || '').trim();
    if (!v) v = String(fallback || '').trim();
    if (!v) v = 'Sin nombre';
    // Evita caracteres conflictivos y espacios repetidos.
    v = v
      .replace(/[\\\/:*?"<>|#%{}~]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!v) v = 'Sin nombre';
    if (v.length > 110) v = v.slice(0, 110).trim();
    return v;
  }

  function getOrCreateChildFolder_(parent, name) {
    var it = parent.getFoldersByName(name);
    if (it.hasNext()) return it.next();
    return parent.createFolder(name);
  }

  var name = String(fileName || 'content.pdf').trim() || 'content.pdf';
  var root = DriveApp.getFolderById(AviatorsConfig_requireDriveRootFolderId_());
  var clientFolderName = safeFolderName_(clientName, 'Sin cliente');
  var titleFolderName = safeFolderName_(contentTitle, 'Success Case');
  var clientFolder = getOrCreateChildFolder_(root, clientFolderName);
  var targetFolder = getOrCreateChildFolder_(clientFolder, titleFolderName);
  var file = targetFolder.createFile(pdfBlob.setName(name));
  return {
    id: String(file.getId() || ''),
    url: String(file.getUrl() || ''),
    name: String(file.getName() || name),
  };
}

/**
 * @param {GoogleAppsScript.Base.Blob} pdfBlob
 * @param {string} fileName
 * @param {string} topic
 * @param {string} contentTitle
 * @return {{id:string,url:string,name:string}}
 */
function ContentIngestion_storeOnboardingPdfInDrive_(pdfBlob, fileName, topic, contentTitle) {
  var name = String(fileName || 'content.pdf').trim() || 'content.pdf';
  var targetFolder = ContentIngestion_getOnboardingDriveTargetFolder_(topic, contentTitle);
  var file = targetFolder.createFile(pdfBlob.setName(name));
  return {
    id: String(file.getId() || ''),
    url: String(file.getUrl() || ''),
    name: String(file.getName() || name),
  };
}

/**
 * Mueve un PDF de onboarding a la carpeta del tópico/título actual (mismo file id).
 * @param {string} driveFileId
 * @param {string} topic
 * @param {string} contentTitle
 * @return {{id:string,url:string,name:string}|null}
 */
function ContentIngestion_relocateOnboardingDriveFile_(driveFileId, topic, contentTitle) {
  var file = ContentIngestion_getLiveDriveFile_(driveFileId);
  if (!file) return null;
  var targetFolder = ContentIngestion_getOnboardingDriveTargetFolder_(topic, contentTitle);
  var parents = file.getParents();
  if (parents.hasNext()) {
    var parent = parents.next();
    if (String(parent.getId() || '') === String(targetFolder.getId() || '')) {
      return {
        id: String(file.getId() || ''),
        url: String(file.getUrl() || ''),
        name: String(file.getName() || ''),
      };
    }
  }
  file.moveTo(targetFolder);
  return {
    id: String(file.getId() || ''),
    url: String(file.getUrl() || ''),
    name: String(file.getName() || ''),
  };
}

/**
 * Copia archivada en Drive del desplegador (fuera de DRIVE_ROOT_FOLDER_ID) para poder ver PDF en la app.
 * @param {GoogleAppsScript.Base.Blob} pdfBlob
 * @param {string} fileName
 * @param {string} contentType
 * @return {{id:string,url:string,name:string}}
 */
function ContentIngestion_storeCatalogPdfArchiveInDrive_(pdfBlob, fileName, contentType) {
  function getOrCreateChildFolder_(parent, folderName) {
    var it = parent.getFoldersByName(folderName);
    if (it.hasNext()) return it.next();
    return parent.createFolder(folderName);
  }

  var name = String(fileName || 'content.pdf').trim() || 'content.pdf';
  var typeKey = String(contentType || 'other').trim() || 'other';
  var root = DriveApp.getRootFolder();
  var aviators = getOrCreateChildFolder_(root, 'Aviators');
  var catalog = getOrCreateChildFolder_(aviators, 'Catalog');
  var typeFolder = getOrCreateChildFolder_(catalog, typeKey);
  var file = typeFolder.createFile(pdfBlob.setName(name));
  return {
    id: String(file.getId() || ''),
    url: String(file.getUrl() || ''),
    name: String(file.getName() || name),
  };
}

/**
 * @param {string} driveFileId
 */
function ContentIngestion_trashDriveFile_(driveFileId) {
  var id = String(driveFileId || '').trim();
  if (!id) return;
  try {
    DriveApp.getFileById(id).setTrashed(true);
  } catch (ignoreTrash) {}
}

/**
 * Resuelve cliente para success case: catálogo, o cliente genérico por industria si no hay cuenta.
 * @param {Object} common
 * @param {Object|null} existing
 * @return {{clientName:string, clientIndustry:string}}
 */
function ContentIngestion_resolveSuccessCaseClient_(common, existing) {
  var clientName = String(common.client_name || '').trim();
  var clientIndustry = String(common.industry || '').trim();
  if (clientName) {
    var clientMatch = ContentExtraction_matchClient_(clientName, String(common.file_name || ''));
    if (clientMatch.matched) {
      clientName = clientMatch.client_name;
      clientIndustry =
        ClientsMaster_resolveIndustryFromCatalog_(clientMatch.industry) || clientIndustry;
    }
    clientIndustry = ClientsMaster_resolveIndustryFromCatalog_(clientIndustry);
    return { clientName: clientName, clientIndustry: clientIndustry };
  }
  clientIndustry =
    ClientsMaster_resolveIndustryFromCatalog_(clientIndustry) ||
    (existing && existing.common
      ? ClientsMaster_resolveIndustryFromCatalog_(String(existing.common.industry || '').trim())
      : '');
  if (!clientIndustry) {
    return { clientName: '', clientIndustry: '' };
  }
  var generic = ClientsMaster_ensureGenericForIndustry(clientIndustry);
  if (!generic || !generic.item) {
    return { clientName: '', clientIndustry: clientIndustry };
  }
  return {
    clientName: String(generic.item.client_name || '').trim(),
    clientIndustry: String(generic.item.industry || clientIndustry).trim(),
  };
}

/**
 * @param {string} payloadJson
 * @return {{ok:boolean,item:Object,meta:Object}}
 */
function ContentIngestion_save(payloadJson) {
  var who = ContentCatalog_requireContributor_();
  var payload = JSON.parse(String(payloadJson || '{}'));
    var common = payload.common || {};
    var specific = payload.specific || {};
    var filePayload = payload.file || {};
    var contentType = String(common.content_type || '').trim();
    if (!ContentCatalog_isValidType_(contentType)) throw new Error('content_type invalido');

    if (contentType === 'success_case' && !payload.forceSave) {
      var dupCheck = ContentDuplicateCheck_findSimilarSuccessCases_({
        common: common,
        specific: specific,
      });
      if (dupCheck.matches && dupCheck.matches.length) {
        AviatorsError_throw_(
          'ERR_CONTENT_DUPLICATE_SIMILAR',
          'ContentIngestion_save',
          JSON.stringify(dupCheck.matches),
        );
      }
    }

    var contentId = String(common.content_id || '').trim();
    var existing = null;
    if (contentId) {
      try {
        existing = ContentCatalog_get(contentId).item;
      } catch (ignoreMissing) {}
    }

    var clientName = String(common.client_name || '').trim();
    var clientIndustry = String(common.industry || '').trim();
    if (contentType === 'onboarding') {
      clientName = '';
      clientIndustry = '';
      common.client_name = '';
      common.industry = '';
    } else if (contentType === 'success_case') {
      var scResolved = ContentIngestion_resolveSuccessCaseClient_(common, existing);
      clientName = scResolved.clientName;
      clientIndustry = scResolved.clientIndustry;
      common.client_name = clientName;
      common.industry = clientIndustry;
      if (clientName) {
        ClientsMaster_ensureByName(clientName, clientIndustry);
      }
    } else if (clientName) {
      var clientMatch = ContentExtraction_matchClient_(clientName, String(common.file_name || ''));
      if (clientMatch.matched) {
        clientName = clientMatch.client_name;
        clientIndustry =
          ClientsMaster_resolveIndustryFromCatalog_(clientMatch.industry) || clientIndustry;
      }
      clientIndustry = ClientsMaster_resolveIndustryFromCatalog_(clientIndustry);
      common.client_name = clientName;
      common.industry = clientIndustry;
      ClientsMaster_ensureByName(clientName, clientIndustry);
    }

    var hasNewFile = !!(filePayload.dataBase64 && filePayload.name);
    if (!existing && !hasNewFile) {
      throw new Error('Se requiere archivo para contenido nuevo');
    }

    var externalUrl = String(
      payload.externalUrl || common.external_url || common.drive_file_url || '',
    ).trim();
    var skipDriveArchive =
      !!externalUrl &&
      contentType === 'success_case' &&
      (hasNewFile || !String(existing.common.drive_file_id || '').trim());

    var pdfBlob = null;
    var newDriveFile = null;
    var oldDriveFileId = existing ? String(existing.common.drive_file_id || '').trim() : '';
    var oldDriveFileUrl = existing ? String(existing.common.drive_file_url || '').trim() : '';
    if (skipDriveArchive) {
      oldDriveFileId = '';
      if (!oldDriveFileUrl) oldDriveFileUrl = externalUrl;
    }
    var usesDrive = ContentIngestion_usesProjectDriveStorage_(contentType);
    var onboardingTopic = '';
    var onboardingTitle = '';
    var existingSpecific = existing && existing.specific ? existing.specific : null;
    var existingCommon = existing && existing.common ? existing.common : null;
    if (contentType === 'onboarding') {
      onboardingTopic = ContentIngestion_resolveOnboardingTopic_(specific, existingSpecific);
      onboardingTitle =
        String(common.title || '').trim() ||
        (existingCommon ? String(existingCommon.title || '').trim() : '') ||
        '';
    }
    if (hasNewFile) {
      var prepared = ContentExtraction_validateAndPrepareBlob_(filePayload);
      pdfBlob = prepared.blob;
      common.file_name = prepared.name;
      common.mime_type = prepared.mimeType;
      if (usesDrive && !skipDriveArchive) {
        var contentTitle =
          common.title || (existingCommon && existingCommon.title) || '';
        if (contentType === 'onboarding') {
          newDriveFile = ContentIngestion_storeOnboardingPdfInDrive_(
            pdfBlob,
            prepared.name,
            onboardingTopic,
            onboardingTitle || contentTitle,
          );
        } else if (contentType === 'proposal') {
          newDriveFile = ContentIngestion_storeProposalPdfInDrive_(
            pdfBlob,
            prepared.name,
            specific,
            common,
          );
        } else {
          newDriveFile = ContentIngestion_storeSuccessCasePdfInDrive_(
            pdfBlob,
            prepared.name,
            common.client_name ||
              (existingCommon && existingCommon.client_name) ||
              '',
            contentTitle,
          );
        }
      } else if (!skipDriveArchive) {
        if (oldDriveFileId) {
          ContentIngestion_trashDriveFile_(oldDriveFileId);
        }
        newDriveFile = ContentIngestion_storeCatalogPdfArchiveInDrive_(
          pdfBlob,
          prepared.name,
          contentType,
        );
        oldDriveFileId = '';
        oldDriveFileUrl = '';
      }
    }

    var onboardingDriveLayoutChanged = false;
    if (contentType === 'onboarding' && usesDrive && oldDriveFileId && existing) {
      var prevTopicForLayout = ContentIngestion_resolveOnboardingTopic_(
        existingSpecific || {},
        null,
      );
      var prevTitleForLayout = String(existingCommon.title || '').trim();
      var needsOnboardingFolder =
        !ContentIngestion_onboardingFileUnderDriveRoot_(oldDriveFileId);
      onboardingDriveLayoutChanged =
        needsOnboardingFolder ||
        onboardingTopic !== prevTopicForLayout ||
        onboardingTitle !== prevTitleForLayout;
      if (!hasNewFile && onboardingDriveLayoutChanged) {
        newDriveFile = ContentIngestion_relocateOnboardingDriveFile_(
          oldDriveFileId,
          onboardingTopic,
          onboardingTitle || prevTitleForLayout,
        );
      }
    }

    var proposalDriveLayoutChanged = false;
    if (contentType === 'proposal' && usesDrive && oldDriveFileId && existing) {
      var prevProposalLayoutKey = ContentIngestion_proposalDriveLayoutKey_(
        existingSpecific || {},
        existingCommon || {},
        null,
        null,
      );
      var nextProposalLayoutKey = ContentIngestion_proposalDriveLayoutKey_(
        specific,
        common,
        existingSpecific,
        existingCommon,
      );
      var needsProposalFolder = !ContentIngestion_proposalFileUnderDriveRoot_(oldDriveFileId);
      proposalDriveLayoutChanged =
        needsProposalFolder || prevProposalLayoutKey !== nextProposalLayoutKey;
      if (!hasNewFile && proposalDriveLayoutChanged) {
        newDriveFile = ContentIngestion_relocateProposalDriveFile_(
          oldDriveFileId,
          specific,
          common,
          existingSpecific,
          existingCommon,
        );
      }
    }

    var agent = ContentIngestion_findAgentByType_(contentType);
    var targetProfile = String(agent.profileName || '').trim();
    if (!targetProfile) throw new Error('profileName vacio para agente destino');

    var oldProfile = existing ? String(existing.common.globant_profile_name || '').trim() : '';
    var oldDocId = existing ? String(existing.common.globant_document_id || '').trim() : '';
    var needReindex =
      !existing ||
      !oldDocId ||
      hasNewFile ||
      oldProfile !== targetProfile ||
      String(existing.common.content_type || '').trim() !== contentType ||
      onboardingDriveLayoutChanged ||
      proposalDriveLayoutChanged;

    var savedDriveFileId = newDriveFile ? newDriveFile.id : oldDriveFileId;
    var savedDriveFileUrl = newDriveFile ? newDriveFile.url : oldDriveFileUrl;
    if (skipDriveArchive && externalUrl) {
      savedDriveFileId = '';
      savedDriveFileUrl = externalUrl;
    }

    var toSaveCommon = {
      content_id: contentId,
      content_type: contentType,
      title: common.title,
      summary: common.summary,
      client_name: common.client_name,
      industry: clientIndustry,
      tags: common.tags || [],
      file_name:
        common.file_name ||
        (existing ? existing.common.file_name : '') ||
        ('content-' + contentType),
      mime_type:
        common.mime_type || (existing ? existing.common.mime_type : '') || 'application/pdf',
      drive_file_id: savedDriveFileId,
      drive_file_url: savedDriveFileUrl,
      globant_profile_name: targetProfile,
      uploaded_by: (existing ? existing.common.uploaded_by : '') || who.email,
    };

    if (!needReindex) {
      var toSaveNoIndex = {
        common: Object.assign({}, toSaveCommon, { globant_document_id: oldDocId }),
        specific: specific,
      };
      var savedNoIndex;
      try {
        savedNoIndex = ContentCatalog_upsert(toSaveNoIndex);
      } catch (eSaveNoIndex) {
        if (newDriveFile && newDriveFile.id) {
          ContentIngestion_trashDriveFile_(newDriveFile.id);
        }
        throw eSaveNoIndex;
      }
      if (usesDrive && newDriveFile && oldDriveFileId && oldDriveFileId !== newDriveFile.id) {
        ContentIngestion_trashDriveFile_(oldDriveFileId);
      }
      return {
        ok: true,
        item: savedNoIndex.item,
        meta: {
          indexed: false,
          targetProfile: targetProfile,
          newDocumentId: oldDocId,
        },
      };
    }

    if (
      !pdfBlob &&
      (contentType === 'onboarding' || contentType === 'proposal') &&
      oldDriveFileId
    ) {
      pdfBlob = DriveDocuments_getPdfBlobForGlobant(oldDriveFileId);
    }
    if (!pdfBlob) {
      throw new Error('Se requiere archivo para reindexar');
    }
    var docMetadata = ContentIngestion_buildMetadata_(
      {
        client_name: common.client_name,
        industry: clientIndustry,
        title: common.title,
        file_name: common.file_name,
      },
      contentType,
      specific,
    );
    var driveIdForMeta = (newDriveFile && newDriveFile.id) || oldDriveFileId || '';
    if (driveIdForMeta) {
      docMetadata.drive_file_id = driveIdForMeta;
    }
    var driveUrlForMeta =
      (skipDriveArchive && externalUrl) ||
      (newDriveFile && newDriveFile.url) ||
      oldDriveFileUrl ||
      '';
    if (driveUrlForMeta) {
      docMetadata.drive_file_url = driveUrlForMeta;
    }

  var indexClient = ContentIngestion_createRagClient_();
  var newDocId = ContentIngestion_indexBlob_(
    indexClient,
    targetProfile,
    pdfBlob,
    docMetadata,
  );

  var toSaveIndexed = {
    common: Object.assign({}, toSaveCommon, { globant_document_id: newDocId }),
    specific: specific,
  };
  var savedIndexed;
  try {
    savedIndexed = ContentCatalog_upsert(toSaveIndexed);
  } catch (eSaveIndexed) {
    if (newDriveFile && newDriveFile.id) {
      ContentIngestion_trashDriveFile_(newDriveFile.id);
    }
    if (newDocId) {
      try {
        indexClient.deleteDocument(targetProfile, newDocId);
      } catch (ignoreRollback) {}
    }
    throw eSaveIndexed;
  }

  if (oldDocId) {
    try {
      indexClient.deleteDocument(oldProfile || targetProfile, oldDocId);
    } catch (ignoreOldDelete) {}
  }
  if (usesDrive && newDriveFile && oldDriveFileId && oldDriveFileId !== newDriveFile.id) {
    ContentIngestion_trashDriveFile_(oldDriveFileId);
  }

  return {
    ok: true,
    item: savedIndexed.item,
    meta: {
      indexed: true,
      targetProfile: targetProfile,
      newDocumentId: newDocId,
    },
  };
}

/**
 * @param {string} contentId
 * @return {{ok:boolean,deleted:boolean}}
 */
function ContentIngestion_delete(contentId) {
  ContentCatalog_requireContributor_();
  var id = String(contentId || '').trim();
    if (!id) throw new Error('content_id requerido');
    var item = ContentCatalog_get(id).item;
    var profile = String(item.common.globant_profile_name || '').trim();
    var docId = String(item.common.globant_document_id || '').trim();
    var remoteDeleteError = null;
    if (profile && docId) {
      try {
        var client = ContentIngestion_createRagClient_();
        client.deleteDocument(profile, docId);
      } catch (eRemote) {
        // No bloquear el borrado de filas locales por residuos remotos/corruptos.
        remoteDeleteError = eRemote;
      }
    }
    var deleted = ContentCatalog_deleteHard(id);
    var driveFileId = String(item.common.drive_file_id || '').trim();
    if (
      ContentIngestion_usesProjectDriveStorage_(String(item.common.content_type || '')) &&
      driveFileId
    ) {
      ContentIngestion_trashDriveFile_(driveFileId);
    }
  return {
    ok: true,
    deleted: !!(deleted && deleted.deleted),
    remoteDeleteOk: remoteDeleteError == null,
    remoteDeleteWarning: remoteDeleteError
      ? String(remoteDeleteError && remoteDeleteError.message
          ? remoteDeleteError.message
          : remoteDeleteError)
      : '',
  };
}

/**
 * @param {string} driveFileId
 * @return {GoogleAppsScript.Drive.File|null}
 */
function ContentIngestion_getLiveDriveFile_(driveFileId) {
  var id = String(driveFileId || '').trim();
  if (!id) return null;
  try {
    var f = DriveApp.getFileById(id);
    return f.isTrashed() ? null : f;
  } catch (e) {
    var msg = e && e.message ? String(e.message) : String(e || '');
    if (!/not found|no item|cannot find/i.test(msg)) throw e;
    return null;
  }
}

/**
 * Repara una fila del catálogo reindexando desde Drive. Si el archivo fuente ya
 * no existe, limpia el índice remoto y elimina la fila del catálogo.
 *
 * @param {string} contentId
 * @return {{ok:boolean, action:string, item:Object|null, documentId:string}}
 */
function ContentIngestion_repairIndexFromDrive(contentId) {
  ContentCatalog_requireContributor_();
  /** @type {Object|null} */
  var repairIndex = null;
  var id = String(contentId || '').trim();
    if (!id) throw new Error('content_id requerido');
    var item = ContentCatalog_get(id).item;
    var common = item.common || {};
    var profile = String(common.globant_profile_name || '').trim();
    var oldDocId = String(common.globant_document_id || '').trim();
    var driveFileId = String(common.drive_file_id || '').trim();
    var driveFile = ContentIngestion_getLiveDriveFile_(driveFileId);

    if (!driveFile) {
      ContentCatalog_tryDeleteRemoteIndex_(profile, oldDocId);
      ContentCatalog_deleteHard(id);
      return { ok: true, action: 'removed', item: null, documentId: '' };
    }

    var contentType = String(common.content_type || '').trim();
    if (!ContentIngestion_usesProjectDriveStorage_(contentType)) {
      throw new Error('ERR_CONTENT_REPAIR_DRIVE_PROJECT_ONLY');
    }

    var agent = ContentIngestion_findAgentByType_(contentType);
    var targetProfile = String(agent.profileName || '').trim();
    if (!targetProfile) throw new Error('profileName vacio para agente destino');

    var blob = DriveDocuments_getPdfBlobForGlobant(driveFileId);
    var docMetadata = ContentIngestion_buildMetadata_(common, contentType, item.specific || {});
    if (driveFileId) {
      docMetadata.drive_file_id = driveFileId;
    }
    if (driveFile.getUrl()) {
      docMetadata.drive_file_url = String(driveFile.getUrl() || '');
    }

  repairIndex = {
    id: id,
    common: common,
    specific: item.specific || {},
    profile: profile,
    oldDocId: oldDocId,
    targetProfile: targetProfile,
    driveFile: driveFile,
    driveFileId: driveFileId,
    blob: blob,
    docMetadata: docMetadata,
  };

  if (!repairIndex) {
    throw new Error('ContentIngestion_repairIndexFromDrive: estado interno inválido');
  }

  var client = ContentIngestion_createRagClient_();
  var newDocId = ContentIngestion_indexBlob_(
    client,
    repairIndex.targetProfile,
    repairIndex.blob,
    repairIndex.docMetadata,
  );

  var nextCommon = Object.assign({}, repairIndex.common, {
      file_name: String(repairIndex.driveFile.getName() || repairIndex.common.file_name || ''),
      mime_type: String(
        repairIndex.driveFile.getMimeType() || repairIndex.common.mime_type || 'application/pdf',
      ),
      drive_file_id: repairIndex.driveFileId,
      drive_file_url: String(
        repairIndex.driveFile.getUrl() || repairIndex.common.drive_file_url || '',
      ),
      globant_profile_name: repairIndex.targetProfile,
      globant_document_id: newDocId,
    });

    var saved;
    try {
      saved = ContentCatalog_upsert({
        common: nextCommon,
        specific: repairIndex.specific,
      });
    } catch (eSave) {
      try {
        client.deleteDocument(repairIndex.targetProfile, newDocId);
      } catch (ignoreRollback) {}
      throw eSave;
    }

    if (
      repairIndex.oldDocId &&
      (repairIndex.oldDocId !== newDocId || repairIndex.profile !== repairIndex.targetProfile)
    ) {
      try {
        client.deleteDocument(
          repairIndex.profile || repairIndex.targetProfile,
          repairIndex.oldDocId,
        );
      } catch (ignoreOldDelete) {}
    }

  return {
    ok: true,
    action: 'reindexed',
    item: saved.item,
    documentId: newDocId,
  };
}

/**
 * Reindexa un documento existente con metadata actualizada (sin re-subir el archivo).
 * Usa la metadata del catalogo (client_name, content_type, industry, title).
 *
 * @param {string} contentId
 * @return {{ok:boolean, action:string, indexStatus:string}}
 */
function ContentIngestion_reindexWithMetadata(contentId) {
  ContentCatalog_requireContributor_();
  var id = String(contentId || '').trim();
  if (!id) throw new Error('content_id requerido');
  var item = ContentCatalog_get(id).item;
  var common = item.common || {};
  var profile = String(common.globant_profile_name || '').trim();
  var docId = String(common.globant_document_id || '').trim();

  if (!profile || !docId) {
    throw new Error('Documento no tiene profile/docId para reindexar');
  }

  var contentType = String(common.content_type || '').trim();
  var docMetadata = ContentIngestion_buildMetadata_(common, contentType, item.specific || {});

  var client = ContentIngestion_createRagClient_();
  var result = client.reindexDocumentWithMetadata(profile, docId, docMetadata);

  return {
    ok: true,
    action: 'metadata_updated',
    indexStatus: result.indexStatus,
  };
}

