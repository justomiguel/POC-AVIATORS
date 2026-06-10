/**
 * @fileoverview Persistencia por usuario del armado de propuestas (Supabase + Drive).
 */

/** @type {string} */
var PROPOSAL_BUILDING_SESSIONS_DRIVE_SEGMENT_ = '_Sesiones';

/** @type {string} */
var PROPOSAL_BUILDING_MATERIALS_FOLDER_NAME_ = 'Materiales';

/** @type {number} */
var PROPOSAL_BUILDING_AI_EVENTS_MAX_ = 80;

/**
 * @return {string}
 */
function ProposalBuildingPersistence_requireEmail_() {
  var email = ('' + Session.getActiveUser().getEmail()).trim();
  if (!email) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_proposal_building_forbidden'));
  }
  return email;
}

/**
 * @param {Object} brief
 * @return {{title:string,clientName:string,proposalName:string,rfpDeadline:string,commercialModel:string,projectSummary:string}}
 */
function ProposalBuildingPersistence_summaryFromBrief_(brief) {
  brief = ProposalBuilding_normalizeBrief_(brief || {});
  return {
    title: ProposalBuilding_buildProposalSubjectName_(brief),
    clientName: String(brief.clientName || '').trim(),
    proposalName: ProposalBuilding_buildProposalSubjectName_(brief),
    rfpDeadline: String(brief.rfpDeadline || '').trim(),
    commercialModel: String(brief.commercialModel || '').trim(),
    projectSummary: String(brief.projectSummary || '').trim(),
  };
}

/**
 * @param {string=} sessionId
 * @return {string}
 */
function ProposalBuildingPersistence_ensureSessionId_(sessionId) {
  AviatorsDataBackend_requireSupabase_();
  var email = ProposalBuildingPersistence_requireEmail_();
  var sid = String(sessionId || '').trim();
  if (sid) {
    var existing = ProposalBuildingStore_getByIdForUser(sid, email);
    if (existing) return sid;
  }
  var created = ProposalBuildingStore_create(email, { builderStep: 'materials' });
  return String(created.sessionId || '');
}

/**
 * @param {string} sessionId
 * @return {GoogleAppsScript.Drive.Folder}
 */
function ProposalBuildingPersistence_getSessionMaterialsFolder_(sessionId) {
  var sid = String(sessionId || '').trim();
  if (!sid) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'pb_err_session_missing'));
  }
  var proposalsRoot = ProposalBuilding_getProposalsDriveFolder_();
  var sessionsRoot = ProposalBuilding_getOrCreateChildFolder_(
    proposalsRoot,
    PROPOSAL_BUILDING_SESSIONS_DRIVE_SEGMENT_,
  );
  var sessionFolder = ProposalBuilding_getOrCreateChildFolder_(sessionsRoot, sid);
  return ProposalBuilding_getOrCreateChildFolder_(sessionFolder, PROPOSAL_BUILDING_MATERIALS_FOLDER_NAME_);
}

/**
 * @param {string} sessionId
 * @param {{name:string,mimeType:string,dataBase64:string,textContent:string}} attachment
 * @return {Object|null}
 */
function ProposalBuildingPersistence_storeMaterialAttachment_(sessionId, attachment) {
  attachment = attachment || {};
  var baseName = String(attachment.name || 'material').trim() || 'material';
  var folder = ProposalBuildingPersistence_getSessionMaterialsFolder_(sessionId);
  var name = ProposalBuildingPersistence_uniqueMaterialFileName_(folder, baseName);
  var file;
  if (attachment.textContent) {
    file = folder.createFile(name, String(attachment.textContent || ''), MimeType.PLAIN_TEXT);
  } else if (attachment.dataBase64) {
    var bytes = Utilities.base64Decode(String(attachment.dataBase64 || ''));
    var mime = String(attachment.mimeType || MimeType.PDF).trim();
    file = folder.createFile(Utilities.newBlob(bytes, mime, name));
  } else {
    return null;
  }
  return {
    name: String(file.getName() || name),
    mimeType: String(attachment.mimeType || file.getMimeType() || ''),
    driveFileId: String(file.getId() || ''),
    driveFileUrl: String(file.getUrl() || ''),
    uploadedAt: new Date().toISOString(),
    reused: false,
  };
}

/**
 * @param {GoogleAppsScript.Drive.Folder} folder
 * @param {string} baseName
 * @return {string}
 */
function ProposalBuildingPersistence_uniqueMaterialFileName_(folder, baseName) {
  baseName = String(baseName || 'material').trim() || 'material';
  if (!folder.getFilesByName(baseName).hasNext()) return baseName;
  var dot = baseName.lastIndexOf('.');
  var stem = dot > 0 ? baseName.slice(0, dot) : baseName;
  var ext = dot > 0 ? baseName.slice(dot) : '';
  var n = 2;
  while (n < 1000) {
    var candidate = stem + ' (' + n + ')' + ext;
    if (!folder.getFilesByName(candidate).hasNext()) return candidate;
    n++;
  }
  return stem + ' (' + Date.now() + ')' + ext;
}

/**
 * @param {Array<Object>} materials
 * @param {Object} materialRow
 * @return {Array<Object>}
 */
function ProposalBuildingPersistence_appendMaterial_(materials, materialRow) {
  if (!materialRow || !materialRow.driveFileId) return materials || [];
  var list = Array.isArray(materials) ? materials.slice() : [];
  var key = String(materialRow.driveFileId || '');
  var i;
  for (i = 0; i < list.length; i++) {
    if (String(list[i].driveFileId || '') === key) return list;
  }
  list.push(materialRow);
  return list;
}

/**
 * @param {Array<Object>} events
 * @param {string} step
 * @param {Object} payload
 * @return {Array<Object>}
 */
function ProposalBuildingPersistence_appendAiEvent_(events, step, payload) {
  var list = Array.isArray(events) ? events.slice() : [];
  list.push({
    step: String(step || '').trim(),
    at: new Date().toISOString(),
    payload: payload && typeof payload === 'object' ? payload : {},
  });
  if (list.length > PROPOSAL_BUILDING_AI_EVENTS_MAX_) {
    list = list.slice(list.length - PROPOSAL_BUILDING_AI_EVENTS_MAX_);
  }
  return list;
}

/**
 * @param {string} sessionId
 * @param {string} step
 * @param {Object} payload
 */
function ProposalBuildingPersistence_recordAiStep_(sessionId, step, payload) {
  if (!AviatorsDataBackend_supabaseConfigured_()) return;
  var sid = String(sessionId || '').trim();
  if (!sid) return;
  var email = ProposalBuildingPersistence_requireEmail_();
  var row = ProposalBuildingStore_getByIdForUser(sid, email);
  if (!row) return;
  ProposalBuildingStore_updateForUser(sid, email, {
    aiResponses: ProposalBuildingPersistence_appendAiEvent_(row.aiResponses, step, payload),
  });
}

/**
 * @param {string} sessionId
 * @param {Object} patch
 */
function ProposalBuildingPersistence_patchSession_(sessionId, patch) {
  if (!AviatorsDataBackend_supabaseConfigured_()) return;
  var sid = String(sessionId || '').trim();
  if (!sid) return;
  var email = ProposalBuildingPersistence_requireEmail_();
  ProposalBuildingStore_updateForUser(sid, email, patch || {});
}

/**
 * @param {string=} sessionId
 * @param {Object=} opts
 * @return {string}
 */
function ProposalBuildingPersistence_beginStep_(sessionId, opts) {
  opts = opts || {};
  if (!AviatorsDataBackend_supabaseConfigured_()) return String(sessionId || '').trim();
  var sid = ProposalBuildingPersistence_ensureSessionId_(sessionId);
  var patch = { builderStep: String(opts.builderStep || 'materials') };
  if (opts.status) patch.status = String(opts.status);
  ProposalBuildingPersistence_patchSession_(sid, patch);
  return sid;
}

/**
 * @param {string} sessionId
 * @param {Object} brief
 * @param {{attachment?:Object,step?:string,aiPayload?:Object,isDraft?:boolean}=} opts
 * @return {string}
 */
function ProposalBuildingPersistence_recordBriefStep_(sessionId, brief, opts) {
  opts = opts || {};
  if (!AviatorsDataBackend_supabaseConfigured_()) return String(sessionId || '').trim();
  var sid = ProposalBuildingPersistence_beginStep_(sessionId, {
    builderStep: opts.isDraft ? 'brief' : String(opts.builderStep || 'brief'),
  });
  var email = ProposalBuildingPersistence_requireEmail_();
  var row = ProposalBuildingStore_getByIdForUser(sid, email);
  if (!row) return sid;

  var summary = ProposalBuildingPersistence_summaryFromBrief_(brief);
  var materials = opts.resetMaterials ? [] : row.materials;
  if (opts.attachment) {
    try {
      var stored = ProposalBuildingPersistence_storeMaterialAttachment_(sid, opts.attachment);
      materials = ProposalBuildingPersistence_appendMaterial_(materials, stored);
    } catch (eMat) {
      AviatorsError_log_('ProposalBuildingPersistence_material', String(eMat && eMat.message));
    }
  }

  var aiResponses = row.aiResponses;
  if (opts.step) {
    aiResponses = ProposalBuildingPersistence_appendAiEvent_(aiResponses, opts.step, opts.aiPayload || {
      brief: brief,
    });
  }

  var patch = {
    title: summary.title,
    clientName: summary.clientName,
    proposalName: summary.proposalName,
    rfpDeadline: summary.rfpDeadline,
    commercialModel: summary.commercialModel,
    projectSummary: summary.projectSummary,
    materials: materials,
    aiResponses: aiResponses,
  };
  if (opts.isDraft !== false) {
    patch.draftBrief = brief;
  } else {
    patch.validatedBrief = brief;
    patch.draftBrief = brief;
  }
  ProposalBuildingPersistence_patchSession_(sid, patch);
  return sid;
}

/**
 * @param {string} sessionId
 * @param {Object} brief
 * @param {string} industryKey
 * @param {Object} result
 */
function ProposalBuildingPersistence_recordStudiosStep_(sessionId, brief, industryKey, result) {
  if (!AviatorsDataBackend_supabaseConfigured_()) return;
  var sid = ProposalBuildingPersistence_beginStep_(sessionId, { builderStep: 'studios' });
  var summary = ProposalBuildingPersistence_summaryFromBrief_(brief);
  var email = ProposalBuildingPersistence_requireEmail_();
  var row = ProposalBuildingStore_getByIdForUser(sid, email);
  ProposalBuildingPersistence_patchSession_(sid, {
    validatedBrief: brief,
    industryKey: String(industryKey || '').trim(),
    title: summary.title,
    clientName: summary.clientName,
    proposalName: summary.proposalName,
    studioRecommendations: (result && result.studios) || [],
    aiResponses: ProposalBuildingPersistence_appendAiEvent_(row ? row.aiResponses : [], 'studios', {
      industry: industryKey,
      studios: (result && result.studios) || [],
    }),
  });
}

/**
 * @param {string} sessionId
 * @param {Object} brief
 * @param {string} industryKey
 * @param {Array<Object>} selections
 */
function ProposalBuildingPersistence_recordSuccessCasesStep_(sessionId, brief, industryKey, selections) {
  if (!AviatorsDataBackend_supabaseConfigured_()) return;
  var sid = ProposalBuildingPersistence_beginStep_(sessionId, { builderStep: 'success_cases' });
  var summary = ProposalBuildingPersistence_summaryFromBrief_(brief);
  var email = ProposalBuildingPersistence_requireEmail_();
  var row = ProposalBuildingStore_getByIdForUser(sid, email) || {};
  var ctx = row.context && typeof row.context === 'object' ? Object.assign({}, row.context) : {};
  var normalized = ProposalBuilding_normalizeSuccessCaseSelections_(selections);
  ctx.successCaseSelections = normalized;
  ctx.successCases = normalized.filter(function (sc) {
    return sc.included !== false;
  });
  ProposalBuildingPersistence_patchSession_(sid, {
    validatedBrief: brief,
    industryKey: String(industryKey || '').trim(),
    title: summary.title,
    clientName: summary.clientName,
    proposalName: summary.proposalName,
    context: ctx,
    aiResponses: ProposalBuildingPersistence_appendAiEvent_(row.aiResponses, 'success_cases', {
      industry: industryKey,
      successCases: normalized,
      includedCount: ctx.successCases.length,
    }),
  });
}

/**
 * @param {string} sessionId
 * @param {Object} brief
 * @param {string} industryKey
 */
function ProposalBuildingPersistence_recordConfigureStep_(sessionId, brief, industryKey) {
  if (!AviatorsDataBackend_supabaseConfigured_()) return;
  var sid = ProposalBuildingPersistence_beginStep_(sessionId, { builderStep: 'configure' });
  var summary = ProposalBuildingPersistence_summaryFromBrief_(brief);
  ProposalBuildingPersistence_patchSession_(sid, {
    validatedBrief: brief,
    industryKey: String(industryKey || '').trim(),
    title: summary.title,
    clientName: summary.clientName,
    proposalName: summary.proposalName,
    rfpDeadline: summary.rfpDeadline,
    commercialModel: summary.commercialModel,
    projectSummary: summary.projectSummary,
  });
}

/**
 * @param {string} sessionId
 * @param {string} step
 * @param {Object} payload
 */
function ProposalBuildingPersistence_recordDeckAiStep_(sessionId, step, payload) {
  if (!AviatorsDataBackend_supabaseConfigured_()) return;
  var sid = ProposalBuildingPersistence_beginStep_(sessionId, { builderStep: 'building', status: 'in_progress' });
  var email = ProposalBuildingPersistence_requireEmail_();
  var row = ProposalBuildingStore_getByIdForUser(sid, email);
  ProposalBuildingPersistence_patchSession_(sid, {
    aiResponses: ProposalBuildingPersistence_appendAiEvent_(row ? row.aiResponses : [], step, payload || {}),
  });
}

/**
 * @param {string} sessionId
 * @param {Object} brief
 * @param {string} industryKey
 * @param {Object} deckResult
 * @param {Object=} contextPatch
 */
function ProposalBuildingPersistence_recordDeckComplete_(
  sessionId,
  brief,
  industryKey,
  deckResult,
  contextPatch,
) {
  if (!AviatorsDataBackend_supabaseConfigured_()) return;
  var sid = ProposalBuildingPersistence_beginStep_(sessionId, { builderStep: 'building', status: 'completed' });
  var summary = ProposalBuildingPersistence_summaryFromBrief_(brief);
  deckResult = deckResult || {};
  var email = ProposalBuildingPersistence_requireEmail_();
  var row = ProposalBuildingStore_getByIdForUser(sid, email) || {};
  var existingCtx = row.context && typeof row.context === 'object' ? row.context : {};
  var ctx = Object.assign({}, existingCtx);
  if (contextPatch && typeof contextPatch === 'object') {
    var ck;
    for (ck in contextPatch) {
      if (Object.prototype.hasOwnProperty.call(contextPatch, ck)) {
        ctx[ck] = contextPatch[ck];
      }
    }
  }

  var deckId = String(
    deckResult.proposalDeckFileId ||
      deckResult.id ||
      row.deckFileId ||
      ctx.proposalDeckFileId ||
      '',
  ).trim();
  var deckUrl = String(
    deckResult.proposalDeckFileUrl ||
      deckResult.url ||
      row.deckFileUrl ||
      ctx.proposalDeckFileUrl ||
      '',
  ).trim();
  var deckName = String(
    deckResult.proposalDeckFileName ||
      deckResult.name ||
      row.deckFileName ||
      ctx.proposalDeckFileName ||
      '',
  ).trim();
  deckUrl = deckUrl || (deckId ? ChatReferences_driveOpenUrl_(deckId, '') : '');

  var checklistId = String(
    deckResult.checklistFileId || row.checklistFileId || ctx.checklistFileId || '',
  ).trim();
  var checklistUrl = String(
    deckResult.checklistFileUrl || row.checklistFileUrl || ctx.checklistFileUrl || '',
  ).trim();
  var checklistName = String(
    deckResult.checklistFileName || row.checklistFileName || ctx.checklistFileName || '',
  ).trim();
  checklistUrl = checklistUrl || (checklistId ? ChatReferences_driveOpenUrl_(checklistId, '') : '');

  var packageId = String(
    deckResult.proposalPackageFolderId ||
      deckResult.packageFolderId ||
      row.packageFolderId ||
      ctx.proposalPackageFolderId ||
      '',
  ).trim();
  var packageUrl = String(
    deckResult.proposalPackageFolderUrl ||
      deckResult.packageFolderUrl ||
      row.packageFolderUrl ||
      ctx.proposalPackageFolderUrl ||
      '',
  ).trim();
  var packageName = String(
    deckResult.proposalPackageFolderName ||
      deckResult.packageFolderName ||
      row.packageFolderName ||
      ctx.proposalPackageFolderName ||
      '',
  ).trim();
  packageUrl = packageUrl || (packageId ? ChatReferences_driveOpenUrl_(packageId, '') : '');

  if (deckId) ctx.proposalDeckFileId = deckId;
  if (deckUrl) ctx.proposalDeckFileUrl = deckUrl;
  if (deckName) ctx.proposalDeckFileName = deckName;
  if (checklistId) ctx.checklistFileId = checklistId;
  if (checklistUrl) ctx.checklistFileUrl = checklistUrl;
  if (checklistName) ctx.checklistFileName = checklistName;
  if (packageId) ctx.proposalPackageFolderId = packageId;
  if (packageUrl) ctx.proposalPackageFolderUrl = packageUrl;
  if (packageName) ctx.proposalPackageFolderName = packageName;

  ProposalBuildingPersistence_patchSession_(sid, {
    validatedBrief: brief,
    industryKey: String(industryKey || '').trim(),
    title: summary.title,
    clientName: summary.clientName,
    proposalName: summary.proposalName,
    rfpDeadline: summary.rfpDeadline,
    commercialModel: summary.commercialModel,
    projectSummary: summary.projectSummary,
    status: 'completed',
    builderStep: 'building',
    deckFileId: deckId,
    deckFileUrl: deckUrl,
    deckFileName: deckName,
    checklistFileId: checklistId,
    checklistFileUrl: checklistUrl,
    checklistFileName: checklistName,
    packageFolderId: packageId,
    packageFolderUrl: packageUrl,
    packageFolderName: packageName,
    context: ctx,
  });
}

/**
 * @param {Object} session
 * @return {Object}
 */
function ProposalBuildingPersistence_toListItem_(session) {
  session = session || {};
  var brief = session.validatedBrief || session.draftBrief || {};
  return {
    sessionId: session.sessionId,
    status: session.status,
    builderStep: session.builderStep,
    title: session.title || session.proposalName || '',
    clientName: session.clientName || String(brief.clientName || '').trim(),
    proposalName: session.proposalName || '',
    industryKey: session.industryKey || '',
    rfpDeadline: session.rfpDeadline || String(brief.rfpDeadline || '').trim(),
    commercialModel: session.commercialModel || String(brief.commercialModel || '').trim(),
    projectSummary: session.projectSummary || String(brief.projectSummary || '').trim(),
    materialsCount: Array.isArray(session.materials) ? session.materials.length : 0,
    studiosCount: Array.isArray(session.studioRecommendations) ? session.studioRecommendations.length : 0,
    deckFileUrl: session.deckFileUrl || '',
    deckFileName: session.deckFileName || '',
    checklistFileUrl: session.checklistFileUrl || '',
    checklistFileName: session.checklistFileName || '',
    packageFolderUrl: session.packageFolderUrl || '',
    updatedAt: session.updatedAt || '',
    createdAt: session.createdAt || '',
  };
}

/**
 * @param {number} skip
 * @param {number} limit
 * @param {string=} sortBy
 * @param {string=} sortDir
 * @param {string=} statusFilter
 * @param {string=} filtersJson
 * @return {{ok:boolean,items:Array<Object>,total:number,skip:number,limit:number,hasMore:boolean,sortBy:string,sortDir:string,filters:Object}}
 */
function ProposalBuildingPersistence_listMySessions(skip, limit, sortBy, sortDir, statusFilter, filtersJson) {
  AdminAuth_requireProposalBuildingView();
  AviatorsDataBackend_requireSupabase_();
  var email = ProposalBuildingPersistence_requireEmail_();
  var s = Math.max(0, Number(skip) || 0);
  var lim = Math.min(100, Math.max(1, Number(limit) || 25));
  var sortKey = String(sortBy || 'deadline').trim().toLowerCase();
  if (!PROPOSAL_BUILDING_STORE_SORT_COLUMNS_[sortKey]) sortKey = 'deadline';
  var sortDirection = ProposalBuildingStore_resolveSortDirection_(sortDir);
  var filters = ProposalBuildingStore_normalizeListFilters_(statusFilter, filtersJson);
  var total = ProposalBuildingStore_countByUser(email, filters);
  var rows = ProposalBuildingStore_listByUser(email, s, lim, sortKey, sortDirection, filters);
  var items = rows.map(ProposalBuildingPersistence_toListItem_);
  return {
    ok: true,
    items: items,
    total: total,
    skip: s,
    limit: lim,
    hasMore: s + items.length < total,
    sortBy: sortKey,
    sortDir: sortDirection,
    statusFilter: filters.status,
    filters: filters,
  };
}

/**
 * @param {string} sessionId
 * @param {Object} opts
 * @return {{ok:boolean,session:Object,material:Object}}
 */
function ProposalBuildingPersistence_addMaterial_(sessionId, opts) {
  AdminAuth_requireProposalBuildingSave();
  AviatorsDataBackend_requireSupabase_();
  var email = ProposalBuildingPersistence_requireEmail_();
  var sid = String(sessionId || '').trim();
  if (!sid) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'pb_err_session_missing'));
  }
  var row = ProposalBuildingStore_getByIdForUser(sid, email);
  if (!row) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'pb_err_session_not_found'));
  }
  opts = opts || {};
  var materialRow = null;
  if (opts.attachment && typeof opts.attachment === 'object') {
    materialRow = ProposalBuildingPersistence_storeMaterialAttachment_(sid, opts.attachment);
  } else {
    var driveUrl = String(opts.driveUrl || opts.url || '').trim();
    var driveFileId =
      ChatReferences_extractDriveFileId_(driveUrl) || String(opts.driveFileId || '').trim();
    if (!driveFileId) {
      AviatorsError_throw_('ERR_PROPOSAL_MATERIAL_DRIVE', 'ProposalBuildingPersistence_addMaterial_', driveUrl);
    }
    try {
      var file = DriveApp.getFileById(driveFileId);
      materialRow = {
        name: String(opts.name || file.getName() || 'material').trim() || 'material',
        mimeType: String(file.getMimeType() || ''),
        driveFileId: driveFileId,
        driveFileUrl: ChatReferences_driveOpenUrl_(driveFileId, driveUrl),
        uploadedAt: new Date().toISOString(),
        source: 'drive_link',
      };
    } catch (eDrive) {
      AviatorsError_throw_(
        'ERR_PROPOSAL_MATERIAL_DRIVE',
        'ProposalBuildingPersistence_addMaterial_',
        String(eDrive && eDrive.message),
      );
    }
  }
  if (!materialRow || !materialRow.driveFileId) {
    AviatorsError_throw_('ERR_PROPOSAL_MATERIAL_INVALID', 'ProposalBuildingPersistence_addMaterial_', sid);
  }
  var materials = ProposalBuildingPersistence_appendMaterial_(row.materials, materialRow);
  ProposalBuildingPersistence_patchSession_(sid, { materials: materials });
  var updated = ProposalBuildingStore_getByIdForUser(sid, email);
  return { ok: true, session: updated, material: materialRow };
}

/**
 * Actualiza campos editables de una sesión (vista propuesta: hero, brief, recordatorios).
 * @param {string} sessionId
 * @param {Object} payload
 * @return {{ok:boolean,session:Object}}
 */
function ProposalBuildingPersistence_updateMySession_(sessionId, payload) {
  AdminAuth_requireProposalBuildingSave();
  AviatorsDataBackend_requireSupabase_();
  var email = ProposalBuildingPersistence_requireEmail_();
  var sid = String(sessionId || '').trim();
  if (!sid) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'pb_err_session_missing'));
  }
  var row = ProposalBuildingStore_getByIdForUser(sid, email);
  if (!row) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'pb_err_session_not_found'));
  }
  payload = payload && typeof payload === 'object' ? payload : {};
  var patch = {};

  if (payload.status != null) {
    patch.status = ProposalBuildingPersistence_normalizeSessionStatus_(payload.status);
  }
  if (payload.builderStep != null) {
    patch.builderStep = ProposalBuildingPersistence_normalizeBuilderStep_(payload.builderStep);
  }
  if (payload.title != null) patch.title = String(payload.title || '');
  if (payload.clientName != null) patch.clientName = String(payload.clientName || '');
  if (payload.proposalName != null) patch.proposalName = String(payload.proposalName || '');
  if (payload.projectSummary != null) patch.projectSummary = String(payload.projectSummary || '');
  if (payload.industryKey != null) patch.industryKey = String(payload.industryKey || '');
  if (payload.rfpDeadline != null) patch.rfpDeadline = String(payload.rfpDeadline || '');
  if (payload.commercialModel != null) {
    patch.commercialModel = ProposalBuilding_normalizeCommercialModel_(payload.commercialModel);
  }

  if (payload.brief && typeof payload.brief === 'object') {
    var briefInput = Object.assign({}, payload.brief);
    if (payload.clientName != null) briefInput.clientName = String(payload.clientName || '');
    if (payload.proposalName != null) {
      briefInput.proposalName = String(payload.proposalName || '');
    }
    if (payload.projectSummary != null) briefInput.projectSummary = String(payload.projectSummary || '');
    if (payload.rfpDeadline != null) briefInput.rfpDeadline = String(payload.rfpDeadline || '');
    if (payload.commercialModel != null) {
      briefInput.commercialModel = ProposalBuilding_normalizeCommercialModel_(payload.commercialModel);
    }
    var normalizedBrief = ProposalBuilding_normalizeBrief_(briefInput);
    var summary = ProposalBuildingPersistence_summaryFromBrief_(normalizedBrief);
    patch.validatedBrief = normalizedBrief;
    patch.draftBrief = normalizedBrief;
    patch.title = summary.title;
    if (patch.clientName == null) patch.clientName = summary.clientName;
    if (patch.proposalName == null) patch.proposalName = summary.proposalName;
    if (patch.rfpDeadline == null) patch.rfpDeadline = summary.rfpDeadline;
    if (patch.commercialModel == null) patch.commercialModel = summary.commercialModel;
    if (patch.projectSummary == null) patch.projectSummary = summary.projectSummary;
  }

  if (payload.context && typeof payload.context === 'object') {
    var ctx = row.context && typeof row.context === 'object' ? Object.assign({}, row.context) : {};
    var ck;
    for (ck in payload.context) {
      if (Object.prototype.hasOwnProperty.call(payload.context, ck)) {
        ctx[ck] = payload.context[ck];
      }
    }
    patch.context = ctx;
  }

  if (payload.deckFileUrl != null || payload.deckFileName != null || payload.deckFileId != null) {
    var deckUrl = String(payload.deckFileUrl != null ? payload.deckFileUrl : row.deckFileUrl || '').trim();
    var deckId =
      ChatReferences_extractDriveFileId_(deckUrl) ||
      String(payload.deckFileId != null ? payload.deckFileId : row.deckFileId || '').trim();
    patch.deckFileUrl = deckUrl || (deckId ? ChatReferences_driveOpenUrl_(deckId, '') : '');
    patch.deckFileId = deckId;
    patch.deckFileName = String(
      payload.deckFileName != null ? payload.deckFileName : row.deckFileName || '',
    ).trim();
  }
  if (payload.checklistFileUrl != null || payload.checklistFileName != null || payload.checklistFileId != null) {
    var checkUrl = String(
      payload.checklistFileUrl != null ? payload.checklistFileUrl : row.checklistFileUrl || '',
    ).trim();
    var checkId =
      ChatReferences_extractDriveFileId_(checkUrl) ||
      String(payload.checklistFileId != null ? payload.checklistFileId : row.checklistFileId || '').trim();
    patch.checklistFileUrl = checkUrl || (checkId ? ChatReferences_driveOpenUrl_(checkId, '') : '');
    patch.checklistFileId = checkId;
    patch.checklistFileName = String(
      payload.checklistFileName != null ? payload.checklistFileName : row.checklistFileName || '',
    ).trim();
  }
  if (
    payload.packageFolderUrl != null ||
    payload.packageFolderName != null ||
    payload.packageFolderId != null
  ) {
    var pkgUrl = String(
      payload.packageFolderUrl != null ? payload.packageFolderUrl : row.packageFolderUrl || '',
    ).trim();
    var pkgId =
      ChatReferences_extractDriveFileId_(pkgUrl) ||
      String(payload.packageFolderId != null ? payload.packageFolderId : row.packageFolderId || '').trim();
    patch.packageFolderUrl = pkgUrl || (pkgId ? ChatReferences_driveOpenUrl_(pkgId, '') : '');
    patch.packageFolderId = pkgId;
    patch.packageFolderName = String(
      payload.packageFolderName != null ? payload.packageFolderName : row.packageFolderName || '',
    ).trim();
  }

  if (payload.materials != null && Array.isArray(payload.materials)) {
    patch.materials = ProposalBuildingPersistence_normalizeMaterialsPatch_(payload.materials);
  }
  if (payload.studioRecommendations != null && Array.isArray(payload.studioRecommendations)) {
    patch.studioRecommendations = ProposalBuildingPersistence_normalizeStudiosPatch_(payload.studioRecommendations);
  }

  if (!Object.keys(patch).length) {
    return { ok: true, session: row };
  }

  ProposalBuildingStore_updateForUser(sid, email, patch);
  var updated = ProposalBuildingStore_getByIdForUser(sid, email);
  if (!updated) {
    AviatorsError_throw_('ERR_PROPOSAL_SESSION_UPDATE', 'ProposalBuildingPersistence_updateMySession_', sid);
  }
  return { ok: true, session: updated };
}

/**
 * @param {string} status
 * @return {string}
 */
function ProposalBuildingPersistence_normalizeSessionStatus_(status) {
  var s = String(status || '').trim();
  if (s === 'completed' || s === 'failed' || s === 'in_progress') return s;
  return 'in_progress';
}

/**
 * @param {string} step
 * @return {string}
 */
function ProposalBuildingPersistence_normalizeBuilderStep_(step) {
  var s = String(step || '').trim();
  if (s === 'materials' || s === 'brief' || s === 'studios' || s === 'success_cases' || s === 'configure' || s === 'building') {
    return s;
  }
  return 'materials';
}

/**
 * @param {Array<Object>} materials
 * @return {Array<Object>}
 */
function ProposalBuildingPersistence_normalizeMaterialsPatch_(materials) {
  var list = Array.isArray(materials) ? materials : [];
  var out = [];
  var i;
  for (i = 0; i < list.length; i++) {
    var m = list[i] || {};
    var url = String(m.driveFileUrl || m.url || '').trim();
    var id = ChatReferences_extractDriveFileId_(url) || String(m.driveFileId || '').trim();
    var name = String(m.name || '').trim();
    if (!name && !url && !id) continue;
    out.push({
      name: name || 'material',
      mimeType: String(m.mimeType || '').trim(),
      driveFileId: id,
      driveFileUrl: url || (id ? ChatReferences_driveOpenUrl_(id, url) : ''),
      uploadedAt: String(m.uploadedAt || '').trim() || new Date().toISOString(),
      source: String(m.source || 'drive_link').trim() || 'drive_link',
    });
  }
  return out;
}

/**
 * @param {Array<Object>} studios
 * @return {Array<Object>}
 */
function ProposalBuildingPersistence_normalizeStudiosPatch_(studios) {
  var list = Array.isArray(studios) ? studios : [];
  var out = [];
  var i;
  for (i = 0; i < list.length; i++) {
    var st = list[i] || {};
    var name = String(st.studioName || st.name || '').trim();
    if (!name) continue;
    var priority = String(st.priority || 'medium').trim().toLowerCase();
    if (priority !== 'high' && priority !== 'low') priority = 'medium';
    var offerings = [];
    if (Array.isArray(st.offerings)) {
      var oi;
      for (oi = 0; oi < st.offerings.length; oi++) {
        var off = String(st.offerings[oi] || '').trim();
        if (off) offerings.push(off);
      }
    } else if (typeof st.offerings === 'string' && st.offerings.trim()) {
      offerings = st.offerings
        .split(/[,;]/)
        .map(function (part) {
          return String(part || '').trim();
        })
        .filter(function (part) {
          return !!part;
        });
    }
    var driveUrl = String(st.driveFileUrl || '').trim();
    var driveId = ChatReferences_extractDriveFileId_(driveUrl) || String(st.driveFileId || '').trim();
    out.push({
      studioName: name,
      name: name,
      priority: priority,
      studioType: String(st.studioType || '').trim(),
      catalogTitle: String(st.catalogTitle || '').trim(),
      contentId: String(st.contentId || '').trim(),
      offerings: offerings,
      rationale: String(st.rationale || '').trim(),
      aiPodsPitch: st.aiPodsPitch && typeof st.aiPodsPitch === 'object' ? st.aiPodsPitch : null,
      whyFit: st.whyFit && typeof st.whyFit === 'object' ? st.whyFit : null,
      driveFileUrl: driveUrl || (driveId ? ChatReferences_driveOpenUrl_(driveId, driveUrl) : ''),
      driveFileId: driveId,
    });
  }
  return out;
}

/**
 * @param {string} sessionId
 * @return {{ok:boolean,session:Object|null}}
 */
function ProposalBuildingPersistence_getMySession(sessionId) {
  AdminAuth_requireProposalBuildingView();
  AviatorsDataBackend_requireSupabase_();
  var email = ProposalBuildingPersistence_requireEmail_();
  var sid = String(sessionId || '').trim();
  if (!sid) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'pb_err_session_missing'));
  }
  var row = ProposalBuildingStore_getByIdForUser(sid, email);
  if (!row) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'pb_err_session_not_found'));
  }
  return { ok: true, session: row };
}

/**
 * @param {string} sessionId
 * @return {{ok:boolean, sessionId:string}}
 */
function ProposalBuildingPersistence_deleteMySession(sessionId) {
  AdminAuth_requireProposalBuildingSave();
  AviatorsDataBackend_requireSupabase_();
  var email = ProposalBuildingPersistence_requireEmail_();
  var sid = String(sessionId || '').trim();
  if (!sid) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'pb_err_session_missing'));
  }
  var row = ProposalBuildingStore_getByIdForUser(sid, email);
  if (!row) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'pb_err_session_not_found'));
  }
  var deleted = ProposalBuildingStore_deleteForUser(sid, email);
  if (!deleted) {
    AviatorsError_throw_('ERR_PROPOSAL_SESSION_DELETE', 'ProposalBuildingPersistence_deleteMySession', sid);
  }
  return { ok: true, sessionId: sid };
}
