/**
 * @fileoverview Subida de archivos elegibles para RAG (PDF) desde el cliente HtmlService a Drive.
 */

/** @type {number} */
var ADMIN_UPLOAD_LOCAL_MAX_BYTES = 15 * 1024 * 1024;

/**
 * @param {{ name: string, mimeType: string, dataBase64: string }} payload
 * @return {{ id: string, name: string }}
 */
function AdminAgents_uploadLocalFileForCorpus_(payload) {
  AdminAuth_requireAgentsAdmin();
  if (!payload || typeof payload !== 'object') {
    throw new Error(
      UiStrings_t(UiStrings_activeLocale_(), 'err_admin_agent_payload'),
    );
  }
  var name = ('' + (payload.name || 'document')).trim();
  var mime = ('' + (payload.mimeType || '')).trim();
  var b64 = '' + (payload.dataBase64 || '');
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
      }),
    );
  }

  var stem = DriveDocuments_safeFileStem_(name);
  if (
    (mime === MimeType.PDF || mime === 'application/pdf') &&
    !/\.pdf$/i.test(stem)
  ) {
    stem = stem + '.pdf';
  }
  var blob = Utilities.newBlob(bytes, mime, stem);
  var file = DriveApp.createFile(blob);
  return { id: file.getId(), name: file.getName() };
}

/**
 * Solo admin · crea un archivo en Drive desde base64 (PDF para corpus RAG).
 *
 * @param {string} payloadJson JSON { name, mimeType, dataBase64 }
 * @return {{ id: string, name: string }}
 */
function adminAgentsUploadLocalPdf(payloadJson) {
  var raw = ('' + (payloadJson || '')).trim();
  /** @type {{ name: string, mimeType: string, dataBase64: string }} */
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
  return AdminAgents_uploadLocalFileForCorpus_(obj);
}
