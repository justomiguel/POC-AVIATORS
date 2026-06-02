/**
 * @fileoverview Nombre y avatar del usuario que accede a la Web App.
 * Con executeAs USER_DEPLOYING, ScriptApp.getOAuthToken() es del desplegador;
 * el perfil del visitante se resuelve vía People API (directorio del dominio)
 * usando su email de Session.getActiveUser().
 * Fallback: OAuth userinfo si visitante === desplegador; luego Gravatar + nombre inferido.
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
 * @param {string} email
 * @return {{ photoUrl: string, displayName: string }}
 */
function SessionProfile_gravatarFallback_(email) {
  var normalized = String(email || '').trim();
  if (!normalized) return { photoUrl: '', displayName: '' };
  var localPart = normalized.split('@')[0] || normalized;
  var hash = SessionProfile_md5Hex_(normalized.toLowerCase());
  return {
    photoUrl: 'https://www.gravatar.com/avatar/' + hash + '?d=mp&s=128',
    displayName: SessionProfile_humanizeLocalPart_(localPart),
  };
}

/**
 * @param {string} email
 * @return {{ photoUrl: string, displayName: string }|null}
 */
function SessionProfile_fetchPeopleDirectory_(email) {
  var normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) return null;

  var resp = UrlFetchApp.fetch(
    'https://people.googleapis.com/v1/people:searchDirectoryPeople',
    {
      method: 'post',
      contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
      payload: JSON.stringify({
        query: normalizedEmail,
        readMask: 'names,emailAddresses,photos',
        sources: [
          'DIRECTORY_SOURCE_TYPE_DOMAIN_PROFILE',
          'DIRECTORY_SOURCE_TYPE_DOMAIN_CONTACT',
        ],
        pageSize: 8,
      }),
      muteHttpExceptions: true,
    },
  );

  var code = resp.getResponseCode();
  if (code < 200 || code >= 300) {
    Logger.log(
      '[SessionProfile] People directory HTTP ' +
        code +
        ' body=' +
        String(resp.getContentText() || '').slice(0, 400),
    );
    return null;
  }

  var data = JSON.parse(resp.getContentText() || '{}');
  var people = data.people || [];
  for (var i = 0; i < people.length; i++) {
    var person = people[i];
    var emails = person.emailAddresses || [];
    var matched = false;
    for (var j = 0; j < emails.length; j++) {
      var val = String(emails[j].value || '')
        .trim()
        .toLowerCase();
      if (val === normalizedEmail) {
        matched = true;
        break;
      }
    }
    if (!matched && people.length === 1) matched = true;
    if (!matched) continue;

    var displayName = '';
    var names = person.names || [];
    for (var k = 0; k < names.length; k++) {
      if (names[k].displayName) {
        displayName = String(names[k].displayName).trim();
        break;
      }
      var given = String(names[k].givenName || '').trim();
      var family = String(names[k].familyName || '').trim();
      var combined = (given + ' ' + family).trim();
      if (combined) {
        displayName = combined;
        break;
      }
    }

    var photoUrl = '';
    var photos = person.photos || [];
    for (var p = 0; p < photos.length; p++) {
      if (photos[p].url) {
        photoUrl = String(photos[p].url).trim();
        break;
      }
    }
    if (
      photoUrl &&
      photoUrl.indexOf('googleusercontent.com') >= 0 &&
      photoUrl.indexOf('=') < 0
    ) {
      photoUrl = photoUrl + '=s128-c';
    }

    if (displayName || photoUrl) {
      return { photoUrl: photoUrl, displayName: displayName };
    }
  }
  return null;
}

/**
 * Perfil OAuth (token del usuario que autorizó). Con USER_DEPLOYING suele ser el desplegador.
 * @return {{ photoUrl: string, displayName: string }|null}
 */
function SessionProfile_fetchOAuthUserInfo_() {
  var resp = UrlFetchApp.fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    muteHttpExceptions: true,
  });
  var code = resp.getResponseCode();
  if (code < 200 || code >= 300) return null;
  var data = JSON.parse(resp.getContentText() || '{}');
  var displayName = String(data.name || '').trim();
  var photoUrl = String(data.picture || '').trim();
  if (!displayName && !photoUrl) return null;
  return { photoUrl: photoUrl, displayName: displayName };
}

/**
 * @return {{ photoUrl: string, displayName: string }}
 */
function SessionProfile_getGoogleCard_() {
  var empty = { photoUrl: '', displayName: '' };
  try {
    var email = ('' + Session.getActiveUser().getEmail()).trim();
    if (!email) return empty;

    var fromDirectory = SessionProfile_fetchPeopleDirectory_(email);
    if (fromDirectory && (fromDirectory.displayName || fromDirectory.photoUrl)) {
      if (!fromDirectory.displayName) {
        fromDirectory.displayName = SessionProfile_gravatarFallback_(email).displayName;
      }
      return fromDirectory;
    }

    var activeEmail = email.toLowerCase();
    var effectiveEmail = ('' + Session.getEffectiveUser().getEmail())
      .trim()
      .toLowerCase();
    if (activeEmail && activeEmail === effectiveEmail) {
      var fromOAuth = SessionProfile_fetchOAuthUserInfo_();
      if (fromOAuth && (fromOAuth.displayName || fromOAuth.photoUrl)) {
        if (!fromOAuth.displayName) {
          fromOAuth.displayName = SessionProfile_gravatarFallback_(email).displayName;
        }
        return fromOAuth;
      }
    }

    return SessionProfile_gravatarFallback_(email);
  } catch (e) {
    Logger.log(
      '[SessionProfile] getGoogleCard error: ' +
        (e && e.message ? e.message : e),
    );
    return empty;
  }
}
