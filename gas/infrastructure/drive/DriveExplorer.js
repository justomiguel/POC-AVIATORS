/**
 * @fileoverview Drive v3: búsqueda (picker admin) y listado hijos para explorador en la web app.
 */

var _DRIVE_EXPLOR_PAGE = 14;
var _DRIVE_BROWSE_PAGE = 80;

/**
 * @param {string} fragment
 * @return {string}
 */
function DriveExplorer_escapeDriveQuery(fragment) {
  return ('' + (fragment || '')).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/**
 * @param {string} query
 * @param {boolean} includeFullText
 * @param {string} [pageToken]
 * @return {{ items: Array<{id: string, name: string, mimeType: string, modifiedTime?: string}>, nextPageToken: string }}
 */
function DriveExplorer_searchDrive(query, includeFullText, pageToken) {
  var qUser = ('' + (query || '')).trim();
  if (qUser.length < 2) {
    throw new Error('Escribí al menos 2 caracteres para buscar.');
  }

  var safe = DriveExplorer_escapeDriveQuery(qUser);
  var clauses = ["name contains '" + safe + "'"];
  if (includeFullText) {
    clauses.push("fullText contains '" + safe + "'");
  }
  var body =
    '(' +
    clauses.join(' or ') +
    ') and trashed = false and mimeType != \'application/vnd.google-apps.shortcut\'';

  var token = ScriptApp.getOAuthToken();
  var qp = [
    'pageSize=' + _DRIVE_EXPLOR_PAGE,
    'supportsAllDrives=true',
    'includeItemsFromAllDrives=true',
    'spaces=drive',
    'fields=' +
      encodeURIComponent('nextPageToken,files(id,name,mimeType,modifiedTime)'),
    'q=' + encodeURIComponent(body),
  ];
  if (pageToken) {
    qp.push('pageToken=' + encodeURIComponent(pageToken));
  }

  var url = 'https://www.googleapis.com/drive/v3/files?' + qp.join('&');
  var res = UrlFetchApp.fetch(url, {
    muteHttpExceptions: true,
    headers: { Authorization: 'Bearer ' + token },
    followRedirects: true,
    validateHttpsCertificates: true,
  });

  var code = res.getResponseCode();
  var text = res.getContentText() || '';
  if (code < 200 || code >= 300) {
    throw new Error('Drive search ' + code + ': ' + text.substring(0, 400));
  }

  /** @type {{nextPageToken?: string, files?: Array<{id:string,name:string,mimeType:string,modifiedTime?:string}>}} */
  var parsed = JSON.parse(text);
  var files = parsed.files || [];
  var items = [];
  for (var i = 0; i < files.length; i++) {
    var f = files[i];
    items.push({
      id: f.id,
      name: f.name || f.id,
      mimeType: f.mimeType || '',
      modifiedTime: f.modifiedTime || '',
    });
  }

  return {
    items: items,
    nextPageToken: parsed.nextPageToken || '',
  };
}

/**
 * Lista hijos directos de una carpeta (Explorador en la app).
 * @param {string} parentId - vacío o «root» para la raíz de Mi unidad
 * @param {string} [pageToken]
 * @return {{ items: Array<{id: string, name: string, mimeType: string, modifiedTime?: string}>, nextPageToken: string }}
 */
function DriveExplorer_listChildren(parentId, pageToken) {
  var pid = ('' + (parentId || '')).trim();
  var parentKey = !pid || pid === 'root' ? 'root' : pid.replace(/'/g, "\\'");
  var body =
    "'" +
    parentKey +
    "' in parents and trashed = false and mimeType != 'application/vnd.google-apps.shortcut'";

  var token = ScriptApp.getOAuthToken();
  var qp = [
    'pageSize=' + _DRIVE_BROWSE_PAGE,
    'supportsAllDrives=true',
    'includeItemsFromAllDrives=true',
    'spaces=drive',
    'orderBy=' + encodeURIComponent('folder,name_natural'),
    'fields=' +
      encodeURIComponent('nextPageToken,files(id,name,mimeType,modifiedTime)'),
    'q=' + encodeURIComponent(body),
  ];
  if (pageToken) {
    qp.push('pageToken=' + encodeURIComponent(pageToken));
  }

  var url = 'https://www.googleapis.com/drive/v3/files?' + qp.join('&');
  var res = UrlFetchApp.fetch(url, {
    muteHttpExceptions: true,
    headers: { Authorization: 'Bearer ' + token },
    followRedirects: true,
    validateHttpsCertificates: true,
  });

  var code = res.getResponseCode();
  var text = res.getContentText() || '';
  if (code < 200 || code >= 300) {
    throw new Error('Drive browse ' + code + ': ' + text.substring(0, 400));
  }

  /** @type {{nextPageToken?: string, files?: Array<{id:string,name:string,mimeType:string,modifiedTime?:string}>}} */
  var parsed = JSON.parse(text);
  var files = parsed.files || [];
  var out = [];
  for (var i = 0; i < files.length; i++) {
    var f = files[i];
    out.push({
      id: f.id,
      name: f.name || f.id,
      mimeType: f.mimeType || '',
      modifiedTime: f.modifiedTime || '',
    });
  }

  return {
    items: out,
    nextPageToken: parsed.nextPageToken || '',
  };
}
