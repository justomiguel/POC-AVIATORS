/**
 * @fileoverview Caso de uso: elegir proveedor LLM y ejecutar consulta con documentos Drive.
 * Punto único de extensión para añadir nuevos proveedores.
 */

/**
 * @return {LlmProviderKind|'auto'}
 */
function LlmOrchestrator_resolveProviderKind() {
  var p = PropertiesService.getScriptProperties();
  var explicit = (p.getProperty(LLM_PROP.PROVIDER) || '').trim().toLowerCase();
  if (explicit === 'globant' || explicit === 'gemini') {
    return explicit === 'gemini' ? 'gemini_api' : 'globant';
  }

  if ((p.getProperty(LLM_PROP.GLOBANT_API_KEY) || '').trim()) {
    return 'globant';
  }
  if ((p.getProperty(LLM_PROP.GEMINI_KEY) || '').trim()) {
    return 'gemini_api';
  }
  return 'auto';
}

/**
 * @return {LlmConsultationAnswer}
 */
function LlmOrchestrator_consultWithDriveDocuments(question, driveFileIds) {
  var max = LLM_DEFAULTS.MAX_DRIVE_FILES;
  var raw = Array.isArray(driveFileIds) ? driveFileIds : [];
  var ids = [];
  for (var i = 0; i < raw.length && ids.length < max; i++) {
    if (typeof raw[i] === 'string' && raw[i].trim()) ids.push(raw[i].trim());
  }

  /** @type {LlmConsultationCommand} */
  var cmd = { question: question, driveFileIds: ids };

  var kind = LlmOrchestrator_resolveProviderKind();

  if (kind === 'globant') {
    return LlmProviderGlobant_consult(cmd);
  }

  if (kind === 'gemini_api') {
    return LlmProviderGemini_consult(cmd);
  }

  throw new Error(
    UiStrings_t(UiStrings_activeLocale_(), 'err_no_llm_provider'),
  );
}

/**
 * Configuración resumida para la UI.
 */
function LlmOrchestrator_getUiConfig() {
  var p = PropertiesService.getScriptProperties();
  var kind = LlmOrchestrator_resolveProviderKind();

  if (kind === 'globant') {
    var prof = (p.getProperty(LLM_PROP.GLOBANT_PROFILE) || '').trim();
    return {
      mode: 'globant',
      configured: true,
      projectHint:
        prof ||
        UiStrings_t(UiStrings_activeLocale_(), 'llm_project_hint_autocreate'),
      location: (p.getProperty(LLM_PROP.GLOBANT_BASE_URL) || '').replace(
        /^https?:\/\//,
        '',
      ) || 'api.agents.globant.com',
      model: LlmProviderGlobant_isAssistantMode(p)
        ? 'globant-assistant'
        : 'globant-rag',
      hint:
        '' +
        (LlmProviderGlobant_isAssistantMode(p)
          ? UiStrings_t(
              UiStrings_activeLocale_(),
              'llm_ui_config_hint_assistant_profile',
            )
          : ''),
    };
  }

  if (kind === 'gemini_api') {
    return {
      mode: 'apiKey',
      configured: true,
      projectHint: '',
      location: '',
      model: p.getProperty(LLM_PROP.GEMINI_MODEL) || LLM_DEFAULTS.GEMINI_MODEL,
      hint: '',
    };
  }

  return {
    mode: 'none',
    configured: false,
    projectHint: '',
    location: '',
    model: '',
    hint: UiStrings_t(UiStrings_activeLocale_(), 'llm_ui_config_no_keys'),
  };
}
