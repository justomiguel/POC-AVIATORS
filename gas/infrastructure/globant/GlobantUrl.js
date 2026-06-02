/**
 * @fileoverview Normalización de base URL para clientes Globant (Apps Script urlFetchWhitelist).
 */

/** @return {string} Base URL cuando GLOBANT_RAG_BASE_URL está vacío. */
function GlobantUrl_defaultBaseUrl_() {
  return 'https://api.clients.geai.globant.com';
}

/**
 * Fuerza HTTPS y quita barras finales. Apps Script exige coincidencia exacta de esquema en el manifiesto.
 * @param {string} [url]
 * @param {string} [defaultUrl]
 * @return {string}
 */
function GlobantUrl_normalizeBaseUrl_(url, defaultUrl) {
  var u = String(url || defaultUrl || GlobantUrl_defaultBaseUrl_()).trim();
  if (/^http:\/\//i.test(u)) {
    u = 'https://' + u.slice(7);
  } else if (!/^https:\/\//i.test(u)) {
    u = 'https://' + u.replace(/^\/+/, '');
  }
  return u.replace(/\/+$/, '');
}
