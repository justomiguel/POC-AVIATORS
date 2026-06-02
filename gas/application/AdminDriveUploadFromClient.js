/**
 * @fileoverview Subida de PDF desde el cliente HtmlService al índice RAG de Globant (sin crear archivo en Drive).
 */

/**
 * Límite alineado con la cuota documentada de Google Apps Script para **UrlFetch POST** (50 MB por
 * llamada). Ver: https://developers.google.com/apps-script/guides/services/quotas
 * (`URL Fetch POST size`).
 *
 * Nota: `google.script.run` puede tener límites de mensaje no documentados; si un archivo cercano
 * a 50 MB fallara en el navegador, conviene partir el PDF o usar una vía con subida resumible.
 *
 * @type {number}
 */
var ADMIN_UPLOAD_LOCAL_MAX_BYTES = 50 * 1024 * 1024;

/**
 * @param {{ name: string, mimeType: string, dataBase64: string, profileName: string, systemPrompt?: string }} payload
 * @return {{ id: string, name: string }}
 */
function AdminAgents_uploadLocalPdfToGlobantRag_(payload) {
  AdminAuth_requireAgentsAdmin();
  if (!payload || typeof payload !== 'object') {
    throw new Error(
      UiStrings_t(UiStrings_activeLocale_(), 'err_admin_agent_payload'),
    );
  }
  var name = ('' + (payload.name || 'document')).trim();
  var mime = ('' + (payload.mimeType || '')).trim();
  var b64 = '' + (payload.dataBase64 || '');
  var profileName = ('' + (payload.profileName || '')).trim();
  var systemPrompt =
    payload.systemPrompt != null ? '' + payload.systemPrompt : '';

  if (!profileName) {
    throw new Error(
      UiStrings_t(UiStrings_activeLocale_(), 'err_admin_upload_profile_required'),
    );
  }

  if (!b64) {
    throw new Error(
      UiStrings_fmt_('err_admin_upload_empty', {
        name: name || 'document',
      }),
    );
  }

  if (!DriveDocuments_mimeEligibleForGlobantRag(mime)) {
    throw new Error(
      UiStrings_fmt_('err_admin_upload_mime', {
        name: name,
        mime: mime || UiStrings_t(UiStrings_activeLocale_(), 'label_em_dash'),
      }),
    );
  }

  var bytes;
  try {
    bytes = Utilities.base64Decode(b64);
  } catch (ignore) {
    throw new Error(
      UiStrings_fmt_('err_admin_upload_decode', {
        name: name,
      }),
    );
  }
  if (!bytes || bytes.length === 0) {
    throw new Error(
      UiStrings_fmt_('err_admin_upload_empty', {
        name: name,
      }),
    );
  }
  if (bytes.length > ADMIN_UPLOAD_LOCAL_MAX_BYTES) {
    throw new Error(
      UiStrings_fmt_('err_admin_upload_too_large', {
        name: name,
        max_mb: String(Math.floor(ADMIN_UPLOAD_LOCAL_MAX_BYTES / (1024 * 1024))),
      }),
    );
  }

  if (LlmOrchestrator_resolveProviderKind() !== 'globant') {
    throw new Error(
      UiStrings_t(UiStrings_activeLocale_(), 'err_corpus_globant_only'),
    );
  }

  var props = PropertiesService.getScriptProperties();
  if (LlmProviderGlobant_isAssistantMode(props)) {
    throw new Error(
      UiStrings_t(UiStrings_activeLocale_(), 'admin_corpus_assistant_no_search'),
    );
  }

  var client = AdminAgents_maybeCreateRagClient_(props);
  if (!client) {
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_falta_globant_key'));
  }

  AdminAgents_ensureRagProfileExists_(client, profileName, systemPrompt);

  var stem = DriveDocuments_safeFileStem_(name);
  if (
    (mime === MimeType.PDF || mime === 'application/pdf') &&
    !/\.pdf$/i.test(stem)
  ) {
    stem = stem + '.pdf';
  }
  var blob = Utilities.newBlob(bytes, mime, stem);
  var docId = ContentIngestion_indexBlob_(client, profileName, blob);
  return { id: docId, name: stem };
}

/**
 * Solo admin · indexa un PDF en el perfil RAG Globant desde base64 (sin Drive).
 *
 * @param {string} payloadJson JSON { name, mimeType, dataBase64, profileName, systemPrompt? }
 * @return {{ id: string, name: string }}
 */
function adminAgentsUploadLocalPdf(payloadJson) {
  return AviatorsCode_runRpc_('adminAgentsUploadLocalPdf', function () {
    var raw = ('' + (payloadJson || '')).trim();
    /** @type {{ name: string, mimeType: string, dataBase64: string, profileName: string, systemPrompt?: string }} */
    var obj;
    try {
      obj = JSON.parse(raw);
    } catch (e) {
      throw new Error(
        UiStrings_fmt_('err_json_invalid_detail', {
          message: e.message || '',
        }),
      );
    }
    return AdminAgents_uploadLocalPdfToGlobantRag_(obj);
  });
}
