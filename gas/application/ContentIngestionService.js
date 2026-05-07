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
function ContentIngestion_buildMetadata_(common, contentType) {
  var meta = {
    client_name: String(common.client_name || '').trim(),
    content_type: String(contentType || '').trim(),
    industry: String(common.industry || '').trim(),
    title: String(common.title || '').trim(),
    file_name: String(common.file_name || '').trim(),
  };
  console.log('[RAG-META] Building metadata: ' + JSON.stringify(meta));
  return meta;
}

/**
 * @param {GoogleAppsScript.Base.Blob} pdfBlob
 * @param {string} fileName
 * @param {string} clientName
 * @param {string} contentTitle
 * @param {string} contentType
 * @return {{id:string,url:string,name:string}}
 */
function ContentIngestion_storeBlobInDrive_(
  pdfBlob,
  fileName,
  clientName,
  contentTitle,
  contentType,
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
  var root = DriveApp.getFolderById(CATALOG_ROOT_FOLDER_ID);
  var clientFolderName = safeFolderName_(clientName, 'Sin cliente');
  var titleFallback = contentType === 'success_case'
    ? 'Success Case'
    : contentType === 'proposal'
      ? 'Propuesta'
      : 'Contenido';
  var titleFolderName = safeFolderName_(contentTitle, titleFallback);
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
    var clientIndustry = String(common.industry || '').trim();
    if (clientName) {
      ClientsMaster_ensureByName(clientName, clientIndustry);
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
    var newDriveFile = null;
    var oldDriveFileId = existing ? String(existing.common.drive_file_id || '').trim() : '';
    var oldDriveFileUrl = existing ? String(existing.common.drive_file_url || '').trim() : '';
    if (hasNewFile) {
      var prepared = ContentExtraction_validateAndPrepareBlob_(filePayload);
      pdfBlob = prepared.blob;
      common.file_name = prepared.name;
      common.mime_type = prepared.mimeType;
      newDriveFile = ContentIngestion_storeBlobInDrive_(
        pdfBlob,
        prepared.name,
        common.client_name || (existing && existing.common && existing.common.client_name) || '',
        common.title || (existing && existing.common && existing.common.title) || '',
        contentType,
      );
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
      var docMetadata = ContentIngestion_buildMetadata_(
        {
          client_name: common.client_name,
          industry: clientIndustry,
          title: common.title,
        },
        contentType,
      );
      newDocId = ContentIngestion_indexBlob_(client, targetProfile, pdfBlob, docMetadata);
    }

    var toSave = {
      common: {
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
        drive_file_id: newDriveFile
          ? newDriveFile.id
          : oldDriveFileId,
        drive_file_url: newDriveFile
          ? newDriveFile.url
          : oldDriveFileUrl,
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
      if (newDriveFile && newDriveFile.id) {
        try {
          DriveApp.getFileById(newDriveFile.id).setTrashed(true);
        } catch (ignoreDriveRollback) {}
      }
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
    if (newDriveFile && oldDriveFileId && oldDriveFileId !== newDriveFile.id) {
      try {
        DriveApp.getFileById(oldDriveFileId).setTrashed(true);
      } catch (ignoreOldDriveDelete) {}
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
  } finally {
    lock.releaseLock();
  }
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
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
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
    var agent = ContentIngestion_findAgentByType_(contentType);
    var targetProfile = String(agent.profileName || '').trim();
    if (!targetProfile) throw new Error('profileName vacio para agente destino');

    var client = ContentIngestion_createRagClient_();
    var blob = DriveDocuments_getPdfBlobForGlobant(driveFileId);
    var docMetadata = ContentIngestion_buildMetadata_(common, contentType);
    var newDocId = ContentIngestion_indexBlob_(client, targetProfile, blob, docMetadata);
    var nextCommon = Object.assign({}, common, {
      file_name: String(driveFile.getName() || common.file_name || ''),
      mime_type: String(driveFile.getMimeType() || common.mime_type || 'application/pdf'),
      drive_file_id: driveFileId,
      drive_file_url: String(driveFile.getUrl() || common.drive_file_url || ''),
      globant_profile_name: targetProfile,
      globant_document_id: newDocId,
    });

    var saved;
    try {
      saved = ContentCatalog_upsert({
        common: nextCommon,
        specific: item.specific || {},
      });
    } catch (eSave) {
      try {
        client.deleteDocument(targetProfile, newDocId);
      } catch (ignoreRollback) {}
      throw eSave;
    }

    if (oldDocId && (oldDocId !== newDocId || profile !== targetProfile)) {
      try {
        client.deleteDocument(profile || targetProfile, oldDocId);
      } catch (ignoreOldDelete) {}
    }

    return {
      ok: true,
      action: 'reindexed',
      item: saved.item,
      documentId: newDocId,
    };
  } finally {
    lock.releaseLock();
  }
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
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
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
    var docMetadata = ContentIngestion_buildMetadata_(common, contentType);

    var client = ContentIngestion_createRagClient_();
    var result = client.reindexDocumentWithMetadata(profile, docId, docMetadata);

    return {
      ok: true,
      action: 'metadata_updated',
      indexStatus: result.indexStatus,
    };
  } finally {
    lock.releaseLock();
  }
}

