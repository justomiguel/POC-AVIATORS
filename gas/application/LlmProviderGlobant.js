/**
 * @fileoverview Adaptador Globant: RAG Search (/v1/search/*) o Assistant Chat (legacy AssistantProvider).
 */

/**
 * @param {GoogleAppsScript.Properties.Properties} props
 * @return {boolean}
 */
function LlmProviderGlobant_isAssistantMode(props) {
  var m = (props.getProperty(LLM_PROP.GLOBANT_API_MODE) || 'rag')
    .trim()
    .toLowerCase();
  return m === 'assistant';
}

/**
 * Todos los perfiles Aviators (incl. orquestador) usan RAG /search/execute salvo modo assistant
 * con perfil que no sea aviators-*.
 * @param {string} profileName
 * @param {GoogleAppsScript.Properties.Properties} props
 * @return {boolean}
 */
function LlmProviderGlobant_useRagExecuteForProfile_(profileName, props) {
  if (!LlmProviderGlobant_isAssistantMode(props)) return true;
  var pn = String(profileName || '').trim().toLowerCase();
  if (pn.indexOf('aviators-') !== 0) return false;
  return true;
}

/**
 * @param {GoogleAppsScript.Properties.Properties} p
 * @return {number}
 */
function LlmProviderGlobant_readExecuteMaxRetries(p) {
  var raw = (p.getProperty(LLM_PROP.GLOBANT_EXECUTE_MAX_RETRIES) || '').trim();
  if (!raw) return LLM_DEFAULTS.GLOBANT_EXECUTE_MAX_RETRIES;
  var n = parseInt(raw, 10);
  if (isNaN(n) || n < 0) return LLM_DEFAULTS.GLOBANT_EXECUTE_MAX_RETRIES;
  return Math.min(n, 15);
}

/**
 * Perfil RAG o nombre de asistente (misma propiedad para no duplicar).
 * En modo `assistant` no se llama a createProfile; debe existir **GLOBANT_RAG_PROFILE_NAME**.
 *
 * @param {Object|null} ragApi — GlobantRagApiClient_create (null en modo assistant-only)
 * @param {GoogleAppsScript.Properties.Properties} props
 * @return {string} profileName / assistantName
 */
function LlmProviderGlobant_resolveProfileName(ragApi, props) {
  var existing = (props.getProperty(LLM_PROP.GLOBANT_PROFILE) || '').trim();
  var skipAuto =
    (props.getProperty(LLM_PROP.GLOBANT_SKIP_AUTO_PROFILE) || '')
      .toLowerCase()
      .trim() === 'true';
  var assistantMode = LlmProviderGlobant_isAssistantMode(props);

  if (assistantMode && !existing) {
    throw new Error(
      UiStrings_t(UiStrings_activeLocale_(), 'err_globant_prof_assistant'),
    );
  }
  if (skipAuto && !existing) {
    throw new Error(
      UiStrings_t(UiStrings_activeLocale_(), 'err_globant_prof_skipauto'),
    );
  }
  if (existing) return existing;
  if (assistantMode) {
    throw new Error(
      UiStrings_t(UiStrings_activeLocale_(), 'err_globant_prof_req'),
    );
  }
  if (!ragApi) {
    throw new Error(
      UiStrings_t(UiStrings_activeLocale_(), 'err_globant_rag_missing'),
    );
  }

  var name = 'aviators-' + Utilities.getUuid().replace(/-/g, '').substring(0, 12);
  var body = GlobantRagDefaults_buildCreateProfileBody(
    name,
    UiStrings_t(UiStrings_activeLocale_(), 'llm_auto_created_profile_desc'),
  );
  ragApi.createProfile(body);
  props.setProperty(LLM_PROP.GLOBANT_PROFILE, name);
  return name;
}

/**
 * @param {LlmConsultationCommand} cmd
 * @return {LlmConsultationAnswer}
 */
function LlmProviderGlobant_consult(cmd) {
  var p = PropertiesService.getScriptProperties();
  var apiKey = (p.getProperty(LLM_PROP.GLOBANT_API_KEY) || '').trim();
  if (!apiKey) {
    throw new Error(
      UiStrings_t(UiStrings_activeLocale_(), 'err_falta_globant_key'),
    );
  }

  var baseUrl = (p.getProperty(LLM_PROP.GLOBANT_BASE_URL) || '').trim();

  var q = (cmd.question || '').trim();
  if (!q)
    throw new Error(
      UiStrings_t(UiStrings_activeLocale_(), 'err_question_required'),
    );

  var hist = cmd.history || [];
  if (hist.length > 0) {
    var histContext = [];
    for (var hi = 0; hi < hist.length; hi++) {
      var he = hist[hi];
      if (he && he.content) {
        histContext.push('[' + (he.role || 'user').toUpperCase() + ']: ' + he.content);
      }
    }
    if (histContext.length > 0) {
      q = PromptCatalog_render('globant.consult.history_wrapper', {
        historyLines: histContext.join('\n'),
        question: q,
      });
    }
  }

  var ids = cmd.driveFileIds || [];
  if (ids.length === 0) {
    throw new Error(
      UiStrings_t(UiStrings_activeLocale_(), 'err_select_doc'),
    );
  }

  if (LlmProviderGlobant_isAssistantMode(p)) {
    return LlmProviderGlobant_consultAssistantWithDriveApi(
      apiKey,
      baseUrl,
      p,
      q,
      ids,
    );
  }

  var client = GlobantRagApiClient_create({
    apiKey: apiKey,
    baseUrl: baseUrl || undefined,
  });

  var profileName = LlmProviderGlobant_resolveProfileName(client, p);
  var skipUpload =
    (p.getProperty(LLM_PROP.GLOBANT_SKIP_UPLOAD) || '').toLowerCase() === 'true';
  var staticDocId = (p.getProperty(LLM_PROP.GLOBANT_STATIC_DOC_ID) || '').trim();

  var documentId;

  if (skipUpload && staticDocId) {
    documentId = staticDocId;
  } else {
    var lastId = '';
    ids.forEach(function (fid) {
      var blob = DriveDocuments_getPdfBlobForGlobant(fid);
      var up = client.uploadPdfDocument(profileName, blob);
      lastId = up.id;
      var ok = GlobantRagApiClient_waitIndexed(client, profileName, lastId);
      if (!ok) {
        throw new Error(
          UiStrings_t(
            UiStrings_activeLocale_(),
            'err_globant_indexing_failed',
          ),
        );
      }
    });
    documentId = lastId;
  }

  var maxRetries = LlmProviderGlobant_readExecuteMaxRetries(p);

  var text = GlobantRagApiClient_executeWithRetry(
    client,
    profileName,
    q,
    documentId,
    maxRetries,
  );

  /** @type {LlmConsultationAnswer} */
  return {
    answer: text,
    model: 'globant-rag',
    providerLabel: UiStrings_t(
      UiStrings_activeLocale_(),
      'meta_provider_globant_rag',
    ),
    filesUsed: ids.length,
  };
}

/**
 * @param {string} apiKey
 * @param {string} baseUrl
 * @param {GoogleAppsScript.Properties.Properties} p
 * @param {string} q
 * @param {string[]} ids
 * @return {LlmConsultationAnswer}
 */
function LlmProviderGlobant_consultAssistantWithDriveApi(
  apiKey,
  baseUrl,
  p,
  q,
  ids,
) {
  var assistant = GlobantAssistantApiClient_create({
    apiKey: apiKey,
    baseUrl: baseUrl || undefined,
  });

  var assistantName = LlmProviderGlobant_resolveProfileName(null, p);
  var skipUpload =
    (p.getProperty(LLM_PROP.GLOBANT_SKIP_UPLOAD) || '').toLowerCase() ===
    'true';

  if (!skipUpload) {
    ids.forEach(function (fid) {
      var blob = DriveDocuments_getPdfBlobForGlobant(fid);
      assistant.uploadFile(blob, assistantName);
    });
    Utilities.sleep(1500);
  }

  var maxRetries = LlmProviderGlobant_readExecuteMaxRetries(p);
  var detail = GlobantAssistantApiClient_sendChatWithRetry(
    assistant,
    assistantName,
    q,
    maxRetries,
  );

  return {
    answer: detail.text,
    model: 'globant-assistant',
    providerLabel: UiStrings_t(
      UiStrings_activeLocale_(),
      'meta_provider_globant_assistant',
    ),
    filesUsed: ids.length,
  };
}

/**
 * Ejecuta sólo texto: RAG `/v1/search/execute` ó Assistant `/v1/assistant/chat`.
 *
 * @param {string} prompt
 * @return {{ answer: string, model: string, providerLabel: string, rawJson: string, filterLabel: string }}
 */
function LlmProviderGlobant_consultPromptOnly(prompt) {
  var p = PropertiesService.getScriptProperties();
  var apiKey = (p.getProperty(LLM_PROP.GLOBANT_API_KEY) || '').trim();
  if (!apiKey) {
    throw new Error(
      UiStrings_t(UiStrings_activeLocale_(), 'err_falta_globant_key'),
    );
  }

  var baseUrl = (p.getProperty(LLM_PROP.GLOBANT_BASE_URL) || '').trim();
  var q = (prompt || '').trim();
  if (!q)
    throw new Error(
      UiStrings_t(UiStrings_activeLocale_(), 'err_prompt_required'),
    );

  var maxRetries = LlmProviderGlobant_readExecuteMaxRetries(p);

  if (LlmProviderGlobant_isAssistantMode(p)) {
    var ast = GlobantAssistantApiClient_create({
      apiKey: apiKey,
      baseUrl: baseUrl || undefined,
    });
    var aname = LlmProviderGlobant_resolveProfileName(null, p);
    var chatOut = GlobantAssistantApiClient_sendChatWithRetry(
      ast,
      aname,
      q,
      maxRetries,
    );

    var rawA = JSON.stringify(chatOut.parsed, null, 2);
    if (rawA.length > 6000) {
      rawA = rawA.substring(0, 6000) + UiStrings_fmt_('drive_text_truncated_suffix');
    }

    return {
      answer: chatOut.text,
      model: 'globant-assistant',
      providerLabel: UiStrings_t(
        UiStrings_activeLocale_(),
        'meta_provider_globant_assistant',
      ),
      rawJson: rawA,
      filterLabel: UiStrings_t(
        UiStrings_activeLocale_(),
        'meta_filter_assistant_no_rag',
      ),
    };
  }

  var client = GlobantRagApiClient_create({
    apiKey: apiKey,
    baseUrl: baseUrl || undefined,
  });

  var profileName = LlmProviderGlobant_resolveProfileName(client, p);
  var docId = (p.getProperty(LLM_PROP.GLOBANT_STATIC_DOC_ID) || '').trim();

  /** @type {Error|null} */
  var lastErr = null;
  /** @type {{ text: string, parsed: Object }|null} */
  var detail = null;

  for (var i = 0; i <= maxRetries; i++) {
    try {
      detail = client.executeQueryDetailed(profileName, q, docId);
      break;
    } catch (e) {
      lastErr = e;
      if (i < maxRetries) Utilities.sleep(500);
    }
  }
  if (!detail) throw lastErr;

  var rawStr = JSON.stringify(detail.parsed, null, 2);
  if (rawStr.length > 6000) {
    rawStr = rawStr.substring(0, 6000) + UiStrings_fmt_('drive_text_truncated_suffix');
  }

  return {
    answer: detail.text,
    model: 'globant-rag',
    providerLabel: UiStrings_t(
      UiStrings_activeLocale_(),
      'meta_provider_globant_execute',
    ),
    rawJson: rawStr,
    filterLabel: docId
      ? UiStrings_fmt_('meta_filter_rag_doc_id', { id: docId })
      : UiStrings_t(
          UiStrings_activeLocale_(),
          'meta_filter_rag_full_profile',
        ),
  };
}

/**
 * Ejecuta una consulta de texto sobre un perfil/agente especifico.
 * Permite inyectar instrucciones de sistema por agente sin tocar propiedades globales.
 *
 * @param {string} profileName
 * @param {string} prompt
 * @param {string} [systemPrompt]
 * @param {Array<{key:string,operator:string,value:string|number}>} [filters] - Filtros opcionales para el RAG
 * @return {{ answer: string, model: string, providerLabel: string, rawJson: string, filterLabel: string }}
 */
function LlmProviderGlobant_consultPromptWithAgent(
  profileName,
  prompt,
  systemPrompt,
  filters,
) {
  var p = PropertiesService.getScriptProperties();
  var apiKey = (p.getProperty(LLM_PROP.GLOBANT_API_KEY) || '').trim();
  if (!apiKey) {
    throw new Error(
      UiStrings_t(UiStrings_activeLocale_(), 'err_falta_globant_key'),
    );
  }

  var pn = ('' + (profileName || '')).trim();
  if (!pn) {
    throw new Error(
      UiStrings_t(UiStrings_activeLocale_(), 'err_globant_profile_name_required'),
    );
  }

  var q = ('' + (prompt || '')).trim();
  if (!q) {
    throw new Error(
      UiStrings_t(UiStrings_activeLocale_(), 'err_prompt_required'),
    );
  }

  var sp = ('' + (systemPrompt || '')).trim();
  var useRagExecute =
    LlmProviderGlobant_useRagExecuteForProfile_(pn, p) &&
    !LlmProviderGlobant_isAssistantMode(p);
  var finalPrompt = q;
  if (sp) {
    if (useRagExecute) {
      finalPrompt = PromptCatalog_render('globant.rag.constraints_wrapper', {
        question: q,
        constraints: sp,
      });
    } else {
      finalPrompt = PromptCatalog_render('globant.assistant.query_wrapper', {
        question: q,
        instructions: sp,
      });
    }
  }

  var baseUrl = (p.getProperty(LLM_PROP.GLOBANT_BASE_URL) || '').trim();
  var maxRetries = LlmProviderGlobant_readExecuteMaxRetries(p);

  if (!useRagExecute) {
    if (LlmProviderGlobant_isAssistantMode(p)) {
      var ast = GlobantAssistantApiClient_create({
        apiKey: apiKey,
        baseUrl: baseUrl || undefined,
      });
      var chatOut = GlobantAssistantApiClient_sendChatWithRetry(
        ast,
        pn,
        finalPrompt,
        maxRetries,
      );
      var rawA = JSON.stringify(chatOut.parsed, null, 2);
      if (rawA.length > 6000) {
        rawA = rawA.substring(0, 6000) + UiStrings_fmt_('drive_text_truncated_suffix');
      }
      return {
        answer: chatOut.text,
        model: 'globant-assistant',
        providerLabel: UiStrings_t(
          UiStrings_activeLocale_(),
          'meta_provider_globant_assistant',
        ),
        rawJson: rawA,
        filterLabel: UiStrings_fmt_('meta_filter_profile', { profile: pn }),
      };
    }
  }

  var ragExecuteMaxChars = 14000;
  if (finalPrompt.length > ragExecuteMaxChars) {
    console.log(
      '[RAG-QUERY] Truncating prompt from ' +
        finalPrompt.length +
        ' to ' +
        ragExecuteMaxChars +
        ' chars',
    );
    finalPrompt =
      finalPrompt.substring(0, ragExecuteMaxChars) +
      UiStrings_fmt_('drive_text_truncated_suffix');
  }

  var client = GlobantRagApiClient_create({
    apiKey: apiKey,
    baseUrl: baseUrl || undefined,
  });
  var appliedFilters = filters || [];
  console.log(
    '[RAG-QUERY] Profile: ' +
      pn +
      ', Filters: ' +
      JSON.stringify(appliedFilters) +
      ', promptLen=' +
      finalPrompt.length,
  );
  var detail = client.executeQueryDetailed(pn, finalPrompt, appliedFilters);
  var rawStr = JSON.stringify(detail.parsed, null, 2);
  if (rawStr.length > 6000) {
    rawStr = rawStr.substring(0, 6000) + UiStrings_fmt_('drive_text_truncated_suffix');
  }

  return {
    answer: detail.text,
    model: 'globant-rag',
    providerLabel: UiStrings_t(
      UiStrings_activeLocale_(),
      'meta_provider_globant_execute',
    ),
    rawJson: rawStr,
    filterLabel: UiStrings_fmt_('meta_filter_profile', { profile: pn }),
  };
}
