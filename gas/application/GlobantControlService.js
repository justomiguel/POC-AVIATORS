/**
 * @fileoverview Panel admin inventario Globant: perfiles RAG vía esta API key, o archivos en modo Assistant.
 */

/**
 * @return {Object}
 */
function GlobantControl_fetchSnapshot() {
  AdminAuth_requireAdmin();

  if (LlmOrchestrator_resolveProviderKind() !== 'globant') {
    return {
      ok: false,
      mode: 'off',
      message: UiStrings_t(
        UiStrings_activeLocale_(),
        'globant_snapshot_requires_provider',
      ),
    };
  }

  var p = PropertiesService.getScriptProperties();
  var apiKey = (p.getProperty(LLM_PROP.GLOBANT_API_KEY) || '').trim();
  if (!apiKey) {
    return {
      ok: false,
      mode: 'off',
      message: UiStrings_t(UiStrings_activeLocale_(), 'err_falta_globant_key'),
    };
  }
  var baseUrl = (p.getProperty(LLM_PROP.GLOBANT_BASE_URL) || '').trim();

  if (LlmProviderGlobant_isAssistantMode(p)) {
    try {
      var as = GlobantAssistantApiClient_create({
        apiKey: apiKey,
        baseUrl: baseUrl || undefined,
      });
      var ids = as.getOrganizationAndProjectIds();
      var files = as.listAllFiles();
      return {
        ok: true,
        mode: 'assistant',
        organizationId: ids.organizationId,
        projectId: ids.projectId,
        fileCount: files.length,
        files: files,
        hint: UiStrings_t(
          UiStrings_activeLocale_(),
          'globant_assistant_files_list_hint',
        ),
      };
    } catch (e) {
      return {
        ok: false,
        mode: 'assistant',
        message: e && e.message ? e.message : String(e),
      };
    }
  }

  try {
    var rag = GlobantRagApiClient_create({
      apiKey: apiKey,
      baseUrl: baseUrl || undefined,
    });
    var meta = rag.listSearchProfiles();
    return {
      ok: true,
      mode: 'rag',
      projectId: meta.projectId,
      projectName: meta.projectName,
      projectActive: meta.projectActive,
      profileCount: meta.profiles.length,
      profiles: meta.profiles,
    };
  } catch (e2) {
    return {
      ok: false,
      mode: 'rag',
      message: e2 && e2.message ? e2.message : String(e2),
    };
  }
}

/**
 * @param {string} profileName
 * @param {number} [skip]
 * @param {number} [count]
 */
function GlobantControl_listRagDocuments(profileName, skip, count) {
  AdminAuth_requireAdmin();
  var pn = ('' + (profileName || '')).trim();
  if (!pn)
    throw new Error(
      UiStrings_t(UiStrings_activeLocale_(), 'err_globant_profile_name_required'),
    );

  var p = PropertiesService.getScriptProperties();
  var apiKey = (p.getProperty(LLM_PROP.GLOBANT_API_KEY) || '').trim();
  if (!apiKey)
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_falta_globant_key'));
  var baseUrl = (p.getProperty(LLM_PROP.GLOBANT_BASE_URL) || '').trim();

  if (LlmProviderGlobant_isAssistantMode(p)) {
    throw new Error(
      UiStrings_t(
        UiStrings_activeLocale_(),
        'err_globant_rag_list_mode_only',
      ),
    );
  }

  var client = GlobantRagApiClient_create({
    apiKey: apiKey,
    baseUrl: baseUrl || undefined,
  });
  return client.listProfileDocuments(pn, skip, count);
}

/**
 * @param {string} profileName
 */
function GlobantControl_deleteRagProfile(profileName) {
  AdminAuth_requireAdmin();
  var pn = ('' + (profileName || '')).trim();
  if (!pn)
    throw new Error(
      UiStrings_t(UiStrings_activeLocale_(), 'err_globant_profile_name_required'),
    );
  var p = PropertiesService.getScriptProperties();
  var apiKey = (p.getProperty(LLM_PROP.GLOBANT_API_KEY) || '').trim();
  if (!apiKey)
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_falta_globant_key'));
  var baseUrl = (p.getProperty(LLM_PROP.GLOBANT_BASE_URL) || '').trim();
  if (LlmProviderGlobant_isAssistantMode(p)) {
    throw new Error(
      UiStrings_t(
        UiStrings_activeLocale_(),
        'err_globant_delete_profile_rag_only',
      ),
    );
  }
  GlobantRagApiClient_create({
    apiKey: apiKey,
    baseUrl: baseUrl || undefined,
  }).deleteProfile(pn);
  return { ok: true, profileName: pn };
}

/**
 * @param {string} profileName
 */
function GlobantControl_deleteRagProfileDocuments(profileName) {
  AdminAuth_requireAdmin();
  var pn = ('' + (profileName || '')).trim();
  if (!pn)
    throw new Error(
      UiStrings_t(UiStrings_activeLocale_(), 'err_globant_profile_name_required'),
    );
  var p = PropertiesService.getScriptProperties();
  var apiKey = (p.getProperty(LLM_PROP.GLOBANT_API_KEY) || '').trim();
  if (!apiKey)
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_falta_globant_key'));
  var baseUrl = (p.getProperty(LLM_PROP.GLOBANT_BASE_URL) || '').trim();
  if (LlmProviderGlobant_isAssistantMode(p)) {
    throw new Error(
      UiStrings_t(UiStrings_activeLocale_(), 'err_globant_rag_action_only'),
    );
  }
  GlobantRagApiClient_create({
    apiKey: apiKey,
    baseUrl: baseUrl || undefined,
  }).deleteProfileDocumentsAll(pn);
  return { ok: true, profileName: pn };
}

/**
 * @param {string} profileName
 * @param {string} documentId
 */
function GlobantControl_deleteRagDocument(profileName, documentId) {
  AdminAuth_requireAdmin();
  var pn = ('' + (profileName || '')).trim();
  var doc = ('' + (documentId || '')).trim();
  if (!pn || !doc)
    throw new Error(
      UiStrings_t(
        UiStrings_activeLocale_(),
        'err_globant_profile_doc_required',
      ),
    );
  var p = PropertiesService.getScriptProperties();
  var apiKey = (p.getProperty(LLM_PROP.GLOBANT_API_KEY) || '').trim();
  if (!apiKey)
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_falta_globant_key'));
  var baseUrl = (p.getProperty(LLM_PROP.GLOBANT_BASE_URL) || '').trim();
  if (LlmProviderGlobant_isAssistantMode(p)) {
    throw new Error(
      UiStrings_t(UiStrings_activeLocale_(), 'err_globant_rag_only_short'),
    );
  }
  GlobantRagApiClient_create({
    apiKey: apiKey,
    baseUrl: baseUrl || undefined,
  }).deleteDocument(pn, doc);
  return { ok: true, profileName: pn, documentId: doc };
}

/**
 * @param {string} fileId
 */
function GlobantControl_deleteAssistantFileAdmin(fileId) {
  AdminAuth_requireAdmin();
  var fid = ('' + (fileId || '')).trim();
  if (!fid)
    throw new Error(
      UiStrings_t(
        UiStrings_activeLocale_(),
        'err_globant_assistant_file_id_required',
      ),
    );
  var p = PropertiesService.getScriptProperties();
  if (!LlmProviderGlobant_isAssistantMode(p)) {
    throw new Error(
      UiStrings_t(
        UiStrings_activeLocale_(),
        'err_globant_delete_file_assistant_only',
      ),
    );
  }
  var apiKey = (p.getProperty(LLM_PROP.GLOBANT_API_KEY) || '').trim();
  if (!apiKey)
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_falta_globant_key'));
  var baseUrl = (p.getProperty(LLM_PROP.GLOBANT_BASE_URL) || '').trim();
  GlobantAssistantApiClient_create({
    apiKey: apiKey,
    baseUrl: baseUrl || undefined,
  }).deleteFile(fid);
  return { ok: true, fileId: fid };
}
