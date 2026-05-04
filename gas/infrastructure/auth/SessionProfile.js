/**
 * @fileoverview Foto y nombre para la UI (OAuth2 userinfo; respaldo People API).
 */

/**
 * @param {{ photoUrl: string, displayName: string }} acc
 * @param {{ picture?: string, name?: string }} j
 */
function SessionProfile_mergeUserinfo_(acc, j) {
  if (j && j.picture) {
    var u = String(j.picture || '').trim();
    if (u && u.indexOf('googleusercontent.com') !== -1 && u.indexOf('=') === -1) {
      u += (u.indexOf('?') === -1 ? '?' : '&') + 'sz=96';
    }
    acc.photoUrl = u;
  }
  if (j && j.name) acc.displayName = String(j.name || '').trim();
}

/**
 * @return {{ photoUrl: string, displayName: string }}
 */
function SessionProfile_getGoogleCard_() {
  var empty = { photoUrl: '', displayName: '' };
  try {
    var token = ScriptApp.getOAuthToken();
    var headers = { Authorization: 'Bearer ' + token };

    var resUi = UrlFetchApp.fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      muteHttpExceptions: true,
      validateHttpsCertificates: true,
      headers: headers,
    });
    var out = { photoUrl: '', displayName: '' };
    if (resUi.getResponseCode() === 200) {
      try {
        SessionProfile_mergeUserinfo_(out, JSON.parse(resUi.getContentText() || '{}'));
      } catch (eUi) {
        /* fall through */
      }
    }

    if (!out.photoUrl || !out.displayName) {
      var res = UrlFetchApp.fetch(
        'https://people.googleapis.com/v1/people/me?personFields=names,photos',
        {
          muteHttpExceptions: true,
          validateHttpsCertificates: true,
          headers: headers,
        },
      );
      if (res.getResponseCode() === 200) {
        var j = JSON.parse(res.getContentText() || '{}');
        if (!out.photoUrl && j.photos && j.photos[0] && j.photos[0].url) {
          out.photoUrl = j.photos[0].url;
          if (out.photoUrl.indexOf('=') === -1) out.photoUrl += '=s96-c';
        }
        if (!out.displayName && j.names && j.names[0]) {
          out.displayName =
            (
              j.names[0].displayName ||
              (j.names[0].givenName || '') + ' ' + (j.names[0].familyName || '')
            ).trim();
        }
      }
    }

    return out;
  } catch (e) {
    return empty;
  }
}

