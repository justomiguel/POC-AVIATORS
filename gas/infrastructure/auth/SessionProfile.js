/**
 * @fileoverview Nombre y avatar para la sesión web.
 * Con la app desplegada como «Ejecutar como yo», ScriptApp.getOAuthToken() es del
 * desarrollador: no conviene llamar a userinfo/People con ese token.
 * Se usa email vía Session.getActiveUser() (p. ej. mismo dominio Workspace) y Gravatar.
 */

/**
 * @param {string} value
 * @return {string} MD5 hex minúsculas
 */
function SessionProfile_md5Hex_(value) {
  var digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.MD5,
    String(value || ''),
    Utilities.Charset.UTF_8,
  );
  var hex = '';
  for (var i = 0; i < digest.length; i++) {
    var b = (digest[i] + 256) % 256;
    var h = b.toString(16);
    if (h.length === 1) h = '0' + h;
    hex += h;
  }
  return hex;
}

/**
 * @param {string} localPart
 * @return {string}
 */
function SessionProfile_humanizeLocalPart_(localPart) {
  var s = String(localPart || '')
    .replace(/[._-]+/g, ' ')
    .trim();
  if (!s) return '';
  var parts = s.split(/\s+/);
  var out = [];
  for (var i = 0; i < parts.length; i++) {
    var w = parts[i];
    if (!w) continue;
    out.push(w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  }
  return out.join(' ');
}

/**
 * @return {{ photoUrl: string, displayName: string }}
 */
function SessionProfile_getGoogleCard_() {
  var empty = { photoUrl: '', displayName: '' };
  try {
    var email = ('' + Session.getActiveUser().getEmail()).trim();
    if (!email) return empty;

    var localPart = email.split('@')[0] || email;
    var displayName = SessionProfile_humanizeLocalPart_(localPart);
    var hash = SessionProfile_md5Hex_(email.toLowerCase());
    var photoUrl =
      'https://www.gravatar.com/avatar/' + hash + '?d=mp&s=96';

    return { photoUrl: photoUrl, displayName: displayName };
  } catch (e) {
    return empty;
  }
}
