/**
 * Logging y códigos de error estables para RPC HtmlService → cliente.
 */

/**
 * @param {string} message
 * @return {string}
 */
function AviatorsError_extractCode_(message) {
  var m = String(message || '').trim();
  if (!m) return '';
  var head = m.match(/^ERR_[A-Z0-9_]+/);
  if (head) return head[0];
  var idx = m.indexOf('ERR_');
  if (idx < 0) return '';
  var rest = m.slice(idx);
  var cut = rest.search(/[\s:]/);
  return cut > 0 ? rest.slice(0, cut) : rest;
}

/**
 * @param {string} scope
 * @param {*} err
 */
function AviatorsError_log_(scope, err) {
  var msg =
    err && err.message != null
      ? String(err.message)
      : String(err || 'unknown');
  var code = AviatorsError_extractCode_(msg);
  var line =
    '[AviatorsError] scope=' +
    String(scope || 'unknown') +
    ' code=' +
    (code || '-') +
    ' message=' +
    msg;
  Logger.log(line);
  try {
    console.error(line);
  } catch (ignoreLog) {}
  if (err && err.stack) {
    var st = '[AviatorsError] stack=' + String(err.stack).slice(0, 4000);
    Logger.log(st);
    try {
      console.error(st);
    } catch (ignoreStack) {}
  }
}

/**
 * @param {string} code
 * @param {string=} scope
 * @param {string=} detail
 * @return {never}
 */
function AviatorsError_throw_(code, scope, detail) {
  var c = String(code || 'ERR_UNKNOWN').trim() || 'ERR_UNKNOWN';
  var msg = detail ? c + ': ' + String(detail) : c;
  AviatorsError_log_(scope || c, new Error(msg));
  throw new Error(msg);
}

/**
 * @param {string} scope
 * @param {function():*} fn
 * @return {*}
 */
function AviatorsError_run_(scope, fn) {
  try {
    return fn();
  } catch (e) {
    AviatorsError_log_(scope, e);
    throw e;
  }
}
