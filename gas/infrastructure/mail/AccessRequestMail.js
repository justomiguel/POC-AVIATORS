/**
 * @fileoverview Notificación por email de solicitudes de acceso (MailApp).
 */

/**
 * @param {string} raw
 * @return {Array<string>}
 */
function AccessRequestMail_parseEmailList_(raw) {
  var parts = String(raw || '').split(/[,;\s]+/);
  var seen = {};
  var out = [];
  for (var i = 0; i < parts.length; i++) {
    var em = String(parts[i] || '').trim().toLowerCase();
    if (!em || em.indexOf('@') < 1 || seen[em]) continue;
    seen[em] = true;
    out.push(em);
  }
  return out;
}

/**
 * @return {Array<string>}
 */
function AccessRequestMail_recipientsFromScriptProperty_() {
  return AccessRequestMail_parseEmailList_(
    AviatorsConfig_scriptProp_(AVIATORS_PROP.ADMIN_EMAILS),
  );
}

/**
 * @return {Array<string>}
 */
function AccessRequestMail_recipientsFromRoles_() {
  var seen = {};
  var out = [];
  try {
    var rows = RoleDirectoryStore_listAll();
    for (var i = 0; i < rows.length; i++) {
      var em = String(rows[i].email || '').trim().toLowerCase();
      if (!em || em.indexOf('@') < 1 || seen[em]) continue;
      var roleKey = String(rows[i].role_key || '').trim().toLowerCase();
      if (
        roleKey === 'admin' ||
        AdminAuth_roleHasPermission_(roleKey, 'manage_users')
      ) {
        seen[em] = true;
        out.push(em);
      }
    }
  } catch (ignore) {}
  return out;
}

/**
 * @return {Array<string>}
 */
function AccessRequestMail_resolveRecipients_() {
  var fromProp = AccessRequestMail_recipientsFromScriptProperty_();
  if (fromProp.length) return fromProp;
  return AccessRequestMail_recipientsFromRoles_();
}

/**
 * @param {'es'|'en'} locale
 * @param {string} key
 * @param {Object<string,string|number>} [vars]
 * @return {string}
 */
function AccessRequestMail_fmt_(locale, key, vars) {
  var s = UiStrings_t(locale, key);
  if (!vars) return s;
  for (var k in vars) {
    if (Object.prototype.hasOwnProperty.call(vars, k)) {
      s = s.split('{' + k + '}').join(String(vars[k]));
    }
  }
  return s;
}

/**
 * @return {string}
 */
function AccessRequestMail_webAppUrl_() {
  try {
    var svc = ScriptApp.getService();
    if (svc) return String(svc.getUrl() || '').trim();
  } catch (ignore) {}
  return '';
}

/**
 * Notifica a administradores (best-effort; no lanza si falla el envío).
 * @param {Object} requestApi
 * @param {'es'|'en'} locale
 */
function AccessRequestMail_notifyAdmins_(requestApi, locale) {
  var loc = locale === 'en' ? 'en' : 'es';
  var recipients = AccessRequestMail_resolveRecipients_();
  if (!recipients.length) {
    Logger.log('[AccessRequestMail] No admin recipients configured; skip mail.');
    return;
  }
  var appUrl = AccessRequestMail_webAppUrl_();
  var vars = {
    email: String(requestApi.email || ''),
    name: String(requestApi.display_name || requestApi.email || ''),
    role: String(requestApi.desired_role_label || requestApi.desired_role_key || ''),
    reason: String(requestApi.reason || ''),
    id: String(requestApi.id || ''),
    url: appUrl || UiStrings_t(loc, 'access_request_mail_url_missing'),
  };
  var subject = AccessRequestMail_fmt_(loc, 'access_request_mail_subject', vars);
  var body = AccessRequestMail_fmt_(loc, 'access_request_mail_body', vars);
  try {
    MailApp.sendEmail({
      to: recipients.join(','),
      subject: subject,
      body: body,
      name: 'Aviators',
    });
    Logger.log(
      '[AccessRequestMail] Sent to ' +
        recipients.length +
        ' recipient(s) for request ' +
        vars.id,
    );
  } catch (err) {
    var msg = err && err.message ? String(err.message) : String(err);
    Logger.log('[AccessRequestMail] send failed: ' + msg);
    try {
      console.error('[AccessRequestMail] send failed: ' + msg);
    } catch (ignore) {}
  }
}
