/**
 * @fileoverview Enlaces de apertura externa para referencias (Drive, Globant RAG Document API).
 */

/**
 * @return {string}
 */
function AviatorsConfig_webAppUrl_() {
  try {
    var svc = ScriptApp.getService();
    return svc ? String(svc.getUrl() || '').trim() : '';
  } catch (ignoreSvc) {
    return '';
  }
}

/**
 * @param {string} urlOrId
 * @return {string}
 */
function ChatReferences_extractDriveFileId_(urlOrId) {
  var s = String(urlOrId || '').trim();
  if (!s) return '';
  if (/^[a-zA-Z0-9_-]{15,}$/.test(s) && s.indexOf('/') < 0 && s.indexOf('?') < 0) {
    return s;
  }
  var m = s.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (m && m[1]) return m[1];
  m = s.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m && m[1]) return m[1];
  return '';
}

/**
 * @param {string} driveFileId
 * @param {string=} fallbackUrl
 * @return {string}
 */
function ChatReferences_driveOpenUrl_(driveFileId, fallbackUrl) {
  var direct = String(fallbackUrl || '').trim();
  if (direct) return direct;
  var id = ChatReferences_extractDriveFileId_(driveFileId);
  if (id) return 'https://drive.google.com/open?id=' + encodeURIComponent(id);
  return '';
}

/**
 * @param {string} driveFileId
 * @param {string=} fallbackUrl
 * @return {string}
 */
function ChatReferences_drivePreviewUrl_(driveFileId, fallbackUrl) {
  var id =
    ChatReferences_extractDriveFileId_(driveFileId) ||
    ChatReferences_extractDriveFileId_(fallbackUrl);
  if (id) return 'https://drive.google.com/file/d/' + id + '/preview';
  return '';
}

/**
 * @param {string} documentId
 * @return {string}
 */
function ChatReferences_globantDocServeUrl_(documentId) {
  var id = String(documentId || '').trim();
  if (!id) return '';
  var base = AviatorsConfig_webAppUrl_();
  if (!base) return '';
  var sep = base.indexOf('?') >= 0 ? '&' : '?';
  return base + sep + 'globantDoc=' + encodeURIComponent(id);
}

/**
 * @param {string} profileName
 * @param {string} documentId
 * @return {string}
 */
function ChatReferences_resolveGlobantOpenUrl_(profileName, documentId) {
  var profile = String(profileName || '').trim();
  var docId = String(documentId || '').trim();
  if (!docId) return '';

  if (profile) {
    try {
      var client = ContentIngestion_createRagClient_();
      var meta = client.getDocument(profile, docId);
      var direct = String(meta.url || '').trim();
      if (direct) return direct;
    } catch (ignoreMeta) {}
  }

  return ChatReferences_globantDocServeUrl_(docId);
}

/**
 * Sirve binario original vía GET ?globantDoc= (RAG Document API).
 * @param {string} documentId
 * @return {GoogleAppsScript.Content.TextOutput|GoogleAppsScript.HTML.HtmlOutput}
 */
function ChatReferences_serveGlobantDocHttp_(documentId) {
  var docId = String(documentId || '').trim();
  if (!docId) {
    return HtmlService.createHtmlOutput('Invalid document id').setTitle('Document');
  }
  var email = '';
  try {
    email = ('' + Session.getActiveUser().getEmail()).trim();
  } catch (ignoreEmail) {}
  if (!email) {
    return HtmlService.createHtmlOutput('Sign in required').setTitle('Document');
  }

  try {
    var client = ContentIngestion_createRagClient_();
    var dl = client.downloadOriginalDocument(docId);
    var name = String(dl.fileName || 'document.pdf').replace(/"/g, "'");
    return ContentService.create(dl.blob)
      .setMimeType(dl.mimeType || MimeType.PDF)
      .setHeader('Content-Disposition', 'inline; filename="' + name + '"');
  } catch (eServe) {
    AviatorsError_log_('ChatReferences_serveGlobantDocHttp_', eServe);
    return HtmlService.createHtmlOutput(
      UiStrings_t(UiStrings_activeLocale_(), 'err_pdf_not_available'),
    ).setTitle('Document');
  }
}

/**
 * @param {string} fileName
 * @return {string}
 */
function ChatReferencePdf_resolveDriveIdByFileName_(fileName) {
  var name = String(fileName || '').trim();
  if (!name) return '';
  try {
    var resolved = resolveDriveFileUrlByName(name);
    if (resolved && resolved.ok && resolved.url) {
      return ChatReferences_extractDriveFileId_(resolved.url);
    }
  } catch (ignoreResolve) {}
  return '';
}

/**
 * @param {{contentId?:string,driveFileId?:string,url?:string,globantDocumentId?:string,globantProfileName?:string}=} opts
 * @return {{ok:boolean,openUrl?:string,title?:string,code?:string,message?:string}}
 */
function ChatReferences_resolveOpenUrl_(opts) {
  opts = opts || {};
  var contentId = String(opts.contentId || '').trim();
  var driveFileId = String(opts.driveFileId || '').trim();
  var directUrl = String(opts.url || '').trim();
  var globantDocumentId = String(
    opts.globantDocumentId || opts.documentId || '',
  ).trim();
  var globantProfileName = String(
    opts.globantProfileName || opts.profileName || '',
  ).trim();
  var title = '';
  var fileName = '';
  var contentType = '';

  if (contentId) {
    try {
      var row = ContentCatalogStore_getById(contentId);
      if (row) {
        title = String(row.title || '').trim();
        fileName = String(row.file_name || '').trim();
        contentType = String(row.content_type || '').trim();
        if (!driveFileId) driveFileId = String(row.drive_file_id || '').trim();
        if (!directUrl) directUrl = String(row.drive_file_url || '').trim();
        if (!globantDocumentId) {
          globantDocumentId = String(row.globant_document_id || '').trim();
        }
        if (!globantProfileName) {
          globantProfileName = String(row.globant_profile_name || '').trim();
        }
        if (!title) title = fileName;
      }
    } catch (ignoreRow) {}
  }

  driveFileId =
    driveFileId ||
    ChatReferences_extractDriveFileId_(directUrl) ||
    ChatReferences_extractDriveFileId_(opts.driveFileId);

  if (!driveFileId && fileName) {
    driveFileId = ChatReferencePdf_resolveDriveIdByFileName_(fileName);
    if (driveFileId && !directUrl) {
      directUrl = ChatReferences_driveOpenUrl_(driveFileId, '');
    }
  }

  var openUrl = ChatReferences_driveOpenUrl_(driveFileId, directUrl);
  if (!openUrl && globantDocumentId) {
    openUrl = ChatReferences_resolveGlobantOpenUrl_(
      globantProfileName,
      globantDocumentId,
    );
  }

  if (openUrl) {
    return {
      ok: true,
      openUrl: openUrl,
      title: title || fileName || contentId || globantDocumentId || 'PDF',
    };
  }

  if (contentType === 'onboarding' && globantDocumentId) {
    return {
      ok: false,
      code: 'ERR_PDF_NOT_AVAILABLE',
      message: UiStrings_t(UiStrings_activeLocale_(), 'err_pdf_globant_onboarding'),
    };
  }

  return { ok: false, code: 'ERR_PDF_NOT_AVAILABLE' };
}

/** @deprecated usar ChatReferences_resolveOpenUrl_ */
function ChatReferencePdf_getView_(opts) {
  var resolved = ChatReferences_resolveOpenUrl_(opts);
  if (!resolved.ok) return resolved;
  return {
    ok: true,
    title: resolved.title,
    downloadUrl: resolved.openUrl,
    previewUrl: resolved.openUrl,
  };
}

/** @deprecated */
function ChatReferencePdf_serveHttp_(driveFileId) {
  return ChatReferences_serveGlobantDocHttp_(driveFileId);
}
