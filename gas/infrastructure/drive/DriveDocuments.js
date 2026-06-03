/**
 * @fileoverview Acceso a contenido de archivos en Drive (texto y export PDF).
 */

/**
 * @param {string} fileId
 * @param {number} maxChars
 * @return {string}
 */
function DriveDocuments_fetchPlainText(fileId, maxChars) {
  maxChars = maxChars || LLM_DEFAULTS.MAX_DOC_CHARS;
  var file = DriveApp.getFileById(fileId);
  var mime = file.getMimeType();
  var token = ScriptApp.getOAuthToken();
  var url;

  if (mime === MimeType.GOOGLE_DOCUMENT) {
    url =
      'https://www.googleapis.com/drive/v3/files/' +
      encodeURIComponent(fileId) +
      '/export?mimeType=' +
      encodeURIComponent('text/plain');
  } else if (mime === 'text/plain' || mime === 'text/markdown') {
    url =
      'https://www.googleapis.com/drive/v3/files/' +
      encodeURIComponent(fileId) +
      '?alt=media';
  } else {
    throw new Error(
      UiStrings_fmt_('drive_mime_not_plain_text', { mime: mime }),
    );
  }

  var res = UrlFetchApp.fetch(url, {
    muteHttpExceptions: true,
    headers: { Authorization: 'Bearer ' + token },
    followRedirects: true,
    validateHttpsCertificates: true,
  });

  var code = res.getResponseCode();
  var body = res.getContentText() || '';

  if (code < 200 || code >= 300) {
    throw new Error(
      UiStrings_fmt_('drive_error_fetch_http', {
        code: String(code),
        detail: body.substring(0, 400),
      }),
    );
  }

  if (body.length > maxChars) {
    body = body.substring(0, maxChars) + UiStrings_fmt_('drive_text_truncated_suffix');
  }
  return body;
}



/**
 * @param {string} name
 * @return {string}
 */
function DriveDocuments_safeFileStem_(name) {
  return ('' + (name || 'document')).replace(/[/\\?%*:|"<>]/g, '-');
}

/**
 * Extrae el ID de carpeta desde URL de Drive (`…/folders/ID`) o ID suelto.
 *
 * @param {string} raw
 * @return {string}
 */
function DriveDocuments_parseDriveFolderIdFromInput(raw) {
  var s = ('' + (raw || '')).trim();
  if (!s)
    throw new Error(UiStrings_t(UiStrings_activeLocale_(), 'err_root_folder_required'));

  var m = s.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (m) return m[1];

  var mParent = s.match(/[?&#]parents=([a-zA-Z0-9_-]+)/);
  if (mParent) return mParent[1];

  var mId = s.match(/[?&#]id=([a-zA-Z0-9_-]+)/);
  if (mId) return mId[1];

  if (/^[a-zA-Z0-9_-]+$/.test(s)) return s;

  throw new Error(
    UiStrings_t(UiStrings_activeLocale_(), 'err_drive_folder_not_recognized'),
  );
}

/**
 * @param {string} mime
 * @return {boolean}
 */
function DriveDocuments_mimeExportsToPdfViaGoogleApi_(mime) {
  return (
    mime === MimeType.GOOGLE_DOCUMENT ||
    mime === MimeType.GOOGLE_SHEETS ||
    mime === MimeType.GOOGLE_SLIDES ||
    mime === MimeType.GOOGLE_DRAWINGS ||
    mime === 'application/vnd.google-apps.drawing'
  );
}

/**
 * Exporta archivo de Drive como PDF blob para Globant RAG (/v1/search/.../document).
 * Docs / Sheets / Slides / Drawings → PDF; PDF nativo → blob sin recodificar.
 *
 * @param {string} fileId
 * @return {Blob}
 */
function DriveDocuments_getPdfBlobForGlobant(fileId) {
  var file = DriveApp.getFileById(fileId);
  var mime = file.getMimeType();
  var stem = DriveDocuments_safeFileStem_(file.getName());

  if (mime === MimeType.PDF || mime === 'application/pdf') {
    return file.getBlob().setName(stem + '.pdf');
  }

  if (DriveDocuments_mimeExportsToPdfViaGoogleApi_(mime)) {
    var token = ScriptApp.getOAuthToken();
    var url =
      'https://www.googleapis.com/drive/v3/files/' +
      encodeURIComponent(fileId) +
      '/export?mimeType=' +
      encodeURIComponent('application/pdf');
    var res = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      headers: { Authorization: 'Bearer ' + token },
      followRedirects: true,
      validateHttpsCertificates: true,
    });
    var code = res.getResponseCode();
    if (code < 200 || code >= 300) {
      throw new Error(
        UiStrings_fmt_('drive_export_pdf_failed', {
          code: String(code),
          detail: (res.getContentText() || '').substring(0, 400),
          stem: stem,
        }),
      );
    }
    return res.getBlob().setName(stem + '.pdf');
  }

  throw new Error(
    UiStrings_fmt_('drive_globant_pdf_required', { stem: stem, mime: mime }),
  );
}

/**
 * @param {string} mime
 * @return {boolean}
 */
function DriveDocuments_isGlobantRagIndexedMime_(mime) {
  return (
    mime === MimeType.PDF ||
    mime === 'application/pdf' ||
    DriveDocuments_mimeExportsToPdfViaGoogleApi_(mime)
  );
}

/**
 * ¿Se puede llevar este MIME a PDF para indexar en Globant RAG?
 *
 * @param {string} mime
 * @return {boolean}
 */
function DriveDocuments_mimeEligibleForGlobantRag(mime) {
  return DriveDocuments_isGlobantRagIndexedMime_(mime);
}

/**
 * Recorre carpetas (ids) y lista archivos PDF / Google hasta maxTotal · subcarpetas maxDepth.
 *
 * @param {string[]} folderIds
 * @param {number} maxTotal
 * @param {number} [maxDepth]
 * @return {string[]}
 */
function DriveDocuments_collectGlobantRagSourceIdsFromFolders(
  folderIds,
  maxTotal,
  maxDepth,
) {
  maxTotal = maxTotal || 25;
  maxDepth =
    maxDepth == null ? 6 : Math.min(Math.max(0, maxDepth), 12);

  var seen = {};
  var out = [];

  /**
   * @param {GoogleAppsScript.Drive.Folder} folder
   * @param {number} depth
   */
  function visitFolder(folder, depth) {
    if (out.length >= maxTotal) return;
    var files = folder.getFiles();
    while (files.hasNext() && out.length < maxTotal) {
      var f = files.next();
      var mime = f.getMimeType();
      if (!DriveDocuments_isGlobantRagIndexedMime_(mime)) continue;
      var id = f.getId();
      if (seen[id]) continue;
      seen[id] = true;
      out.push(id);
    }
    if (depth >= maxDepth || out.length >= maxTotal) return;
    var sub = folder.getFolders();
    while (sub.hasNext() && out.length < maxTotal) {
      visitFolder(sub.next(), depth + 1);
    }
  }

  for (
    var i = 0;
    i < folderIds.length && out.length < maxTotal;
    i++
  ) {
    var fid = ('' + folderIds[i]).trim();
    if (!fid) continue;
    try {
      var entry = DriveApp.getFileById(fid);
      if (entry.getMimeType() !== MimeType.FOLDER) continue;
      visitFolder(DriveApp.getFolderById(fid), 0);
    } catch (e) {
      throw new Error(
        UiStrings_fmt_('admin_folder_tree_inaccessible', {
          tail: fid.slice(-8),
          reason: e && e.message ? e.message : String(e),
        }),
      );
    }
  }
  return out;
}

/**
 * Alias retrocompatible.
 *
 * @param {string[]} folderIds
 * @param {number} maxTotal
 * @param {number} [maxDepth]
 * @return {string[]}
 */
function DriveDocuments_collectGoogleDocIdsFromFolders(
  folderIds,
  maxTotal,
  maxDepth,
) {
  return DriveDocuments_collectGlobantRagSourceIdsFromFolders(
    folderIds,
    maxTotal,
    maxDepth,
  );
}

/**
 * PDF para Globant (Doc, Sheets, Slides, PDF…).
 *
 * @param {string} fileId
 * @return {Blob}
 */
function DriveDocuments_exportGoogleDocAsPdf(fileId) {
  return DriveDocuments_getPdfBlobForGlobant(fileId);
}

/**
 * @param {string} raw
 * @return {string}
 */
function DriveDocuments_escapeQueryLiteral_(raw) {
  return String(raw || '')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');
}

/**
 * Busca un archivo por título exacto (carpeta raíz de proyecto primero, luego todo Drive).
 * @param {string} fileName
 * @return {string} drive file id
 */
function DriveDocuments_findFileIdByExactTitle_(fileName) {
  var name = String(fileName || '').trim();
  if (!name) return '';
  var esc = DriveDocuments_escapeQueryLiteral_(name);
  var queries = [];
  try {
    var rootFolderId = AviatorsConfig_driveRootFolderId_();
    if (rootFolderId) {
      queries.push(
        '"' +
          DriveDocuments_escapeQueryLiteral_(rootFolderId) +
          '" in parents and trashed = false and title = "' +
          esc +
          '"',
      );
    }
  } catch (ignoreRoot) {}
  queries.push('trashed = false and title = "' + esc + '"');
  var qi;
  for (qi = 0; qi < queries.length; qi++) {
    try {
      var it = DriveApp.searchFiles(queries[qi]);
      if (it.hasNext()) {
        var f = it.next();
        return String(f.getId() || '');
      }
    } catch (ignoreSearch) {}
  }
  return '';
}
