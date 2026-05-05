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
 * @return {string}
 */
function ContentIngestion_indexBlob_(client, profileName, pdfBlob) {
  var up = client.uploadPdfDocument(profileName, pdfBlob);
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
 * @param {string} payloadJson
 * @return {{ok:boolean,item:Object,meta:Object}}
 */
function ContentIngestion_save(payloadJson) {
  var who = ContentCatalog_requireContributor_();
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var payload = JSON.parse(String(payloadJson || '{}'));
    var common = payload.common || {};
    var specific = payload.specific || {};
    var filePayload = payload.file || {};
    var contentType = String(common.content_type || '').trim();
    if (!ContentCatalog_isValidType_(contentType)) throw new Error('content_type invalido');

    var clientName = String(common.client_name || '').trim();
    if (clientName) {
      ClientsMaster_ensureByName(clientName);
    }

    var contentId = String(common.content_id || '').trim();
    var existing = null;
    if (contentId) {
      try {
        existing = ContentCatalog_get(contentId).item;
      } catch (ignoreMissing) {}
    }

    var hasNewFile = !!(filePayload.dataBase64 && filePayload.name);
    if (!existing && !hasNewFile) {
      throw new Error('Se requiere archivo para contenido nuevo');
    }

    var pdfBlob = null;
    if (hasNewFile) {
      var prepared = ContentExtraction_validateAndPrepareBlob_(filePayload);
      pdfBlob = prepared.blob;
      common.file_name = prepared.name;
      common.mime_type = prepared.mimeType;
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
      String(existing.common.content_type || '').trim() !== contentType;

    var client = ContentIngestion_createRagClient_();
    var newDocId = '';
    if (needReindex) {
      if (!pdfBlob) {
        throw new Error('Se requiere archivo para reindexar');
      }
      newDocId = ContentIngestion_indexBlob_(client, targetProfile, pdfBlob);
    }

    var toSave = {
      common: {
        content_id: contentId,
        content_type: contentType,
        title: common.title,
        summary: common.summary,
        client_name: common.client_name,
        tags: common.tags || [],
        file_name:
          common.file_name ||
          (existing ? existing.common.file_name : '') ||
          ('content-' + contentType),
        mime_type:
          common.mime_type || (existing ? existing.common.mime_type : '') || 'application/pdf',
        globant_profile_name: targetProfile,
        globant_document_id: needReindex
          ? newDocId
          : oldDocId,
        uploaded_by:
          (existing ? existing.common.uploaded_by : '') || who.email,
      },
      specific: specific,
    };

    var saved;
    try {
      saved = ContentCatalog_upsert(toSave);
    } catch (eSave) {
      if (newDocId) {
        try {
          client.deleteDocument(targetProfile, newDocId);
        } catch (ignoreRollback) {}
      }
      throw eSave;
    }

    if (needReindex && oldDocId) {
      try {
        client.deleteDocument(oldProfile || targetProfile, oldDocId);
      } catch (ignoreOldDelete) {}
    }

    return {
      ok: true,
      item: saved.item,
      meta: {
        indexed: needReindex,
        targetProfile: targetProfile,
        newDocumentId: needReindex ? newDocId : oldDocId,
      },
    };
  } finally {
    lock.releaseLock();
  }
}

/**
 * @param {string} contentId
 * @return {{ok:boolean,deleted:boolean}}
 */
function ContentIngestion_delete(contentId) {
  ContentCatalog_requireContributor_();
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var id = String(contentId || '').trim();
    if (!id) throw new Error('content_id requerido');
    var item = ContentCatalog_get(id).item;
    var profile = String(item.common.globant_profile_name || '').trim();
    var docId = String(item.common.globant_document_id || '').trim();
    if (profile && docId) {
      var client = ContentIngestion_createRagClient_();
      client.deleteDocument(profile, docId);
    }
    return ContentCatalog_deleteHard(id);
  } finally {
    lock.releaseLock();
  }
}

