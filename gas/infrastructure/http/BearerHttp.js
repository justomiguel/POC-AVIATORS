/**
 * @fileoverview Cliente HTTP mínimo sobre UrlFetchApp (infraestructura).
 */

/**
 * @param {string} url
 * @param {GoogleAppsScript.URL_Fetch.URLFetchRequestOptions} options
 * @return {HTTPResponse}
 */
function BearerHttp_fetch(url, options) {
  var merged = options || {};
  merged.muteHttpExceptions = true;
  merged.followRedirects = true;
  merged.validateHttpsCertificates = true;
  return UrlFetchApp.fetch(url, merged);
}

/**
 * @param {number} code
 * @return {boolean}
 */
function BearerHttp_isSuccess(code) {
  return code >= 200 && code < 300;
}
